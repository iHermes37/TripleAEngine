import axios from "axios";
import * as fs from "fs";
import { VideoData, VideoInfo } from "@/types/video";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocialMediaService } from "@/types/platform";
import { MediaPlatform } from "@/types/constant";
import { ArticleData, ArticleInfo } from "@/types/article";
import { MediaComment } from "@/types/comment";
import * as os from "os";
import * as path from "path";

// ==================== 配置 ====================
const API_KEY = process.env.YOUTUBE_API_KEY!;
const PROXY = process.env.PROXY_URL || "http://127.0.0.1:7890";

// 创建代理 agent（唯一正确方式）
const httpsAgent = new HttpsProxyAgent(PROXY);

// 创建带代理的 axios 实例（不污染全局，Next.js 里更安全）
const axiosWithProxy = axios.create({
  httpsAgent,
  proxy: false, // 必须禁用内置 proxy，否则冲突
});

// ==================== YouTubeCommentCollector ====================
export class YouTubeCommentCollector {
  private api_key: string;
  private base_url: string;
  public request_count: number;

  constructor(api_key: string) {
    this.api_key = api_key;
    this.base_url = "https://www.googleapis.com/youtube/v3";
    this.request_count = 0;
  }

  async _make_request(
    url: string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await axiosWithProxy.get(url, {
        params,
        timeout: 30000,
      });
      this.request_count += 1;
      return response.data;
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (e.code === "ETIMEDOUT") console.log("❌ 请求超时");
        else console.log(`❌ 请求失败: ${e.message}`);
      }
      return null;
    }
  }

  async get_video_info(video_id: string): Promise<Record<string, unknown> | null> {
    const data = await this._make_request(`${this.base_url}/videos`, {
      part: "snippet,statistics",
      id: video_id,
      key: this.api_key,
    });
    if (!data || !Array.isArray(data["items"]) || !(data["items"] as unknown[]).length) {
      console.log("❌ 未找到视频信息");
      return null;
    }
    const item = (data["items"] as Record<string, unknown>[])[0];
    const snippet = item["snippet"] as Record<string, unknown>;
    const stats = item["statistics"] as Record<string, unknown>;
    return {
      title: snippet["title"],
      channel: snippet["channelTitle"],
      published_at: snippet["publishedAt"],
      view_count: parseInt((stats["viewCount"] as string) ?? "0"),
      like_count: parseInt((stats["likeCount"] as string) ?? "0"),
      comment_count: parseInt((stats["commentCount"] as string) ?? "0"),
    };
  }

  async get_video_comments(video_id: string, max_comments = 5): Promise<MediaComment[]> {
    const comments: MediaComment[] = [];
    let next_page_token: string | null = null;

    while (comments.length < max_comments) {
      const params: Record<string, unknown> = {
        part: "snippet,replies",
        videoId: video_id,
        maxResults: Math.min(100, max_comments - comments.length),
        key: this.api_key,
        order: "relevance",
      };
      if (next_page_token) params["pageToken"] = next_page_token;

      const data = await this._make_request(`${this.base_url}/commentThreads`, params);
      if (!data || !Array.isArray(data["items"])) break;

      for (const item of data["items"] as Record<string, unknown>[]) {
        if (comments.length >= max_comments) break;

        const snippetObj = item["snippet"] as Record<string, unknown>;
        const top_comment = (snippetObj["topLevelComment"] as Record<string, unknown>)["snippet"] as Record<string, unknown>;
        const total_reply_count = (snippetObj["totalReplyCount"] as number) || 0;

        comments.push({
          createdAtUTC: new Date(top_comment["publishedAt"] as string).getTime(),
          body: top_comment["textDisplay"] as string,
          upvotes: top_comment["likeCount"] as number,
          replyCount: total_reply_count,
        });

        if ("replies" in item && total_reply_count > 0) {
          const replies = ((item["replies"] as Record<string, unknown>)["comments"] as Record<string, unknown>[]);
          if (Array.isArray(replies)) {
            for (const reply of replies) {
              if (comments.length >= max_comments) break;
              const rs = reply["snippet"] as Record<string, unknown>;
              comments.push({
                createdAtUTC: new Date(rs["publishedAt"] as string).getTime(),
                body: rs["textDisplay"] as string,
                upvotes: rs["likeCount"] as number,
                replyCount: 0,
              });
            }
          }
        }
      }

      next_page_token = (data["nextPageToken"] as string) ?? null;
      if (!next_page_token) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    return comments.slice(0, max_comments);
  }
}

// ==================== YoutubeClient ====================
export class YoutubeClient implements SocialMediaService {
  static SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
  static CLIENT_SECRETS_FILE = process.env.YOUTUBE_CLIENT_SECRETS_FILE || "config/youtube_client.json";
  static TOKEN_PICKLE_FILE = process.env.YOUTUBE_TOKEN_FILE || "config/youtube_token.json";

  constructor() {}

  // ─── 1. 加载并验证凭证 ────────────────────────────────
  async _get_authenticated_service(): Promise<OAuth2Client> {
    const keyFile = JSON.parse(fs.readFileSync(YoutubeClient.CLIENT_SECRETS_FILE, "utf8"));
    const clientConfig = keyFile.web ?? keyFile.installed;
    if (!clientConfig) {
      throw new Error(`客户端密钥文件格式错误，当前字段: ${Object.keys(keyFile).join(", ")}`);
    }

    const redirectUri = clientConfig.redirect_uris?.[0] ?? "http://localhost:8080/";
    const oauth2Client = new google.auth.OAuth2(
      clientConfig.client_id,
      clientConfig.client_secret,
      redirectUri
    );

    if (!fs.existsSync(YoutubeClient.TOKEN_PICKLE_FILE)) {
      throw new Error(`未找到 token 文件: ${YoutubeClient.TOKEN_PICKLE_FILE}，请先运行 auth_setup.ts`);
    }

    const tokenData = JSON.parse(fs.readFileSync(YoutubeClient.TOKEN_PICKLE_FILE, "utf8"));
    oauth2Client.setCredentials(tokenData);

    // token 过期时用 axios 手动刷新（走代理）
    const expiry = oauth2Client.credentials.expiry_date;
    if (expiry && expiry <= Date.now()) {
      if (!oauth2Client.credentials.refresh_token) {
        throw new Error("Token 已过期且没有 refresh_token，请重新运行 auth_setup.ts");
      }
      console.log("Token 已过期，正在刷新...");
      const refreshRes = await axiosWithProxy.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          client_id: clientConfig.client_id,
          client_secret: clientConfig.client_secret,
          refresh_token: oauth2Client.credentials.refresh_token,
          grant_type: "refresh_token",
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 30000 }
      );
      const newTokens = {
        ...tokenData,
        access_token: refreshRes.data.access_token,
        expiry_date: Date.now() + refreshRes.data.expires_in * 1000,
      };
      oauth2Client.setCredentials(newTokens);
      fs.writeFileSync(YoutubeClient.TOKEN_PICKLE_FILE, JSON.stringify(newTokens, null, 2));
      console.log("✅ Token 刷新成功");
    } else {
      console.log("✅ Token 有效");
    }

    return oauth2Client;
  }

  // ─── 2. 创建可续传上传会话 ────────────────────────────
  async _create_resumable_session(
    accessToken: string,
    metadata: Record<string, unknown>
  ): Promise<string | null> {
    const url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
    try {
      console.log("正在创建上传会话...");
      // ✅ 用 axiosWithProxy，不用 proxy 字段
      const response = await axiosWithProxy.post(url, JSON.stringify(metadata), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "video/*",
        },
        timeout: 30000,
      });
      const uploadUrl = response.headers["location"];
      if (!uploadUrl) {
        console.log("❌ 响应中没有找到上传 URL");
        return null;
      }
      console.log("✅ 上传会话创建成功");
      return uploadUrl;
    } catch (e) {
      console.error("❌ 创建上传会话失败:", e);
      return null;
    }
  }

  // ─── 3. 分块上传（接收文件路径，Node.js 服务端专用）────
  async _upload_file_with_progress(
    uploadUrl: string,
    filePath: string,
    accessToken: string,
    onProgress?: (percent: number) => void
  ): Promise<Record<string, unknown> | null> {
    const fileSize = fs.statSync(filePath).size;
    const chunkSize = 5 * 1024 * 1024; // 5MB
    let uploaded = 0;
    const fd = fs.openSync(filePath, "r");

    console.log(`📦 文件大小: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    try {
      while (uploaded < fileSize) {
        const buf = Buffer.alloc(Math.min(chunkSize, fileSize - uploaded));
        const bytesRead = fs.readSync(fd, buf, 0, buf.length, uploaded);
        if (bytesRead === 0) break;

        const chunk = buf.slice(0, bytesRead);
        const end = uploaded + chunk.length - 1;

        try {
          // ✅ 用 axiosWithProxy
          const response = await axiosWithProxy.put(uploadUrl, chunk, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "video/*",
              "Content-Length": String(chunk.length),
              "Content-Range": `bytes ${uploaded}-${end}/${fileSize}`,
            },
            timeout: 120000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          });

          if (response.status === 200 || response.status === 201) {
            onProgress?.(100);
            console.log("✅ 上传完成 100%");
            return response.data;
          }
        } catch (e: unknown) {
          if (axios.isAxiosError(e) && e.response?.status === 308) {
            uploaded += chunk.length;
            const percent = Math.floor((uploaded / fileSize) * 100);
            onProgress?.(percent);
            console.log(`⬆️  进度: ${percent}%`);
          } else {
            console.error("❌ 分块上传出错:", e);
            return null;
          }
        }
      }
    } finally {
      fs.closeSync(fd);
    }

    return null;
  }

  // ─── 4. 上传入口 ──────────────────────────────────────
  // Next.js API Route 里传过来的是 File 对象（内存中）
  // 需要先把 File 写到临时文件，再用路径上传
  async uploadVideo(
    file: File,
    video_info: VideoInfo,
    platform?: MediaPlatform,
    credentials?: OAuth2Client
  ): Promise<boolean> {
    const client = credentials ?? await this._get_authenticated_service();
    const accessToken = client.credentials.access_token!;

    // 加这行看看 token 到底是什么
    console.log("🔍 access_token:", client.credentials.access_token);
    console.log("🔍 credentials 完整内容:", JSON.stringify(client.credentials, null, 2));


    const tmpPath = path.join(os.tmpdir(), `yt_upload_${Date.now()}_${file.name}`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(tmpPath, Buffer.from(arrayBuffer));

      const metadata = {
        snippet: {
          title: video_info.title,
          description: video_info.description ?? "",
          tags: video_info.tags ?? [],
          categoryId: video_info.categoryId ?? "22",
        },
        status: {
          privacyStatus: video_info.privacyStatus ?? "public",
          madeForKids: false,
        },
      };

      const uploadUrl = await this._create_resumable_session(accessToken, metadata);
      if (!uploadUrl) return false;

      const result = await this._upload_file_with_progress(uploadUrl, tmpPath, accessToken);
      if (result) {
        console.log(`✅ 上传成功！视频ID: ${result["id"]}`);
        console.log(`   视频URL: https://youtu.be/${result["id"]}`);
        return true;
      }
      console.log("❌ 上传失败");
      return false;
    } finally {
      // 清理临时文件
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  // ─── 其余方法 ─────────────────────────────────────────
  private _extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/shorts\/([^?]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  }

  getPlatformName(): MediaPlatform {
    return MediaPlatform.YouTube;
  }

  async getComments(video_url: string): Promise<MediaComment[]> {
    const collector = new YouTubeCommentCollector(API_KEY);
    return collector.get_video_comments(video_url);
  }

  async getVideoData(video_url: string): Promise<VideoData> {
    const video_id = this._extractVideoId(video_url);
    if (!video_id) throw new Error("无效的 YouTube 视频 URL");

    if (!process.env.YOUTUBE_API_KEY) throw new Error("未设置 YOUTUBE_API_KEY");

    // ✅ 用 axiosWithProxy
    const videoResponse = await axiosWithProxy.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: { part: "snippet,statistics", id: video_id, key: process.env.YOUTUBE_API_KEY },
        timeout: 30000,
      }
    );

    if (!videoResponse.data.items?.length) throw new Error("未找到视频数据");

    const { snippet, statistics } = videoResponse.data.items[0];
    const comments = await this.getComments(video_url);

    return {
      name: snippet.title,
      viewCount: parseInt(statistics.viewCount || "0"),
      likeCount: parseInt(statistics.likeCount || "0"),
      shareCount: 0,
      commentCount: parseInt(statistics.commentCount || "0"),
      comments,
      createTime: new Date(snippet.publishedAt).getTime(),
    };
  }

  uploadArticle(file: File, metadata: ArticleInfo): Promise<boolean> {
    return Promise.resolve(true);
  }

  async getArticleData(article_url: string): Promise<ArticleData> {
    return Promise.resolve({} as ArticleData);
  }
}