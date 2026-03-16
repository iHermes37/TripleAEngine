// 对应 app/core/platform/media/youtube.py

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { VideoInfo } from "@/app/schemas/video";

// google-auth-library 对应 google.auth / google.oauth2
import { OAuth2Client } from "google-auth-library";
import {VideoComments} from "../../../schemas/video"


// ==================== 配置区域 ====================
const API_KEY = "AIzaSyBaZWu2nCKhhNB_FhYGX5P1XWSzAYX4mOM";
const VIDEO_URL = "https://youtu.be/uQJF5fcjFbg?si=VW-O19wOfYYnDORy---";
const VIDEO_ID = "uQJF5fcjFbg"; // 从分享链接中提取

// 代理设置（根据你的代理软件修改）
const PROXY = "https://127.0.0.1:7890"; // 你的Clash端口
// =================================================

const proxies = {
  protocol: "http",
  host: "127.0.0.1",
  port: 7890,
};

export class YouTubeCommentCollector {
  // 使用axios的YouTube评论采集器
  private api_key: string;
  private proxies: { host: string; port: number } | null;
  private base_url: string;
  public request_count: number;

  constructor(
    api_key: string,
    proxies: { host: string; port: number } | null = null
  ) {
    this.api_key = api_key;
    this.proxies = proxies;
    this.base_url = "https://www.googleapis.com/youtube/v3";
    this.request_count = 0;
  }

  
  async _make_request(
    url: string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    // 发送带代理的请求
    try {
      const response = await axios.get(url, {
        params,
        proxy: this.proxies ?? undefined,
        timeout: 30000,
      });
      this.request_count += 1;
      return response.data;
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (e.message?.toLowerCase().includes("proxy")) {
          console.log(`❌ 代理错误: ${e}`);
          console.log(`   请确认代理 ${PROXY} 是否可用`);
        } else if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND") {
          console.log(`❌ 连接错误: ${e}`);
        } else if (e.code === "ETIMEDOUT") {
          console.log("❌ 请求超时");
        } else {
          console.log(`❌ 请求失败: ${e}`);
        }
      } else {
        console.log(`❌ 请求失败: ${e}`);
      }
      return null;
    }
  }

  async get_video_info(
    video_id: string
  ): Promise<Record<string, unknown> | null> {
    // 获取视频信息
    const url = `${this.base_url}/videos`;
    const params = {
      part: "snippet,statistics",
      id: video_id,
      key: this.api_key,
    };

    const data = await this._make_request(url, params);
    if (
      !data ||
      !Array.isArray(data["items"]) ||
      (data["items"] as unknown[]).length === 0
    ) {
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

  async get_video_comments(
    video_id: string,
    max_comments: number =5
  ): Promise<VideoComments[]> {
    // 获取评论（包括回复）
    const comments: VideoComments[] = [];
    let next_page_token: string | null = null;

    while (comments.length < max_comments) {
      const url = `${this.base_url}/commentThreads`;
      const params: Record<string, unknown> = {
        part: "snippet,replies",
        videoId: video_id,
        maxResults: Math.min(100, max_comments - comments.length),
        key: this.api_key,
        order: "relevance",
      };

      if (next_page_token) {
        params["pageToken"] = next_page_token;
      }

      const data = await this._make_request(url, params);
      if (!data || !Array.isArray(data["items"])) {
        break;
      }

      for (const item of data["items"] as Record<string, unknown>[]) {
        if (comments.length >= max_comments) break;

        // 主评论
        const top_comment = (
          (item["snippet"] as Record<string, unknown>)[
            "topLevelComment"
          ] as Record<string, unknown>
        )["snippet"] as Record<string, unknown>;



        let comment : VideoComments={
            publishedAt: top_comment["publishedAt"] as string,
            textDisplay: top_comment["textDisplay"] as string,
            likeCount: top_comment["likeCount"] as number,
        }; 
          
        

        comments.push(comment);

        // 处理回复
        if ("replies" in item) {
          const replies = (
            (item["replies"] as Record<string, unknown>)["comments"] as Record<
              string,
              unknown
            >[]
          );
          for (const reply of replies) {
            if (comments.length >= max_comments) break;
            const reply_snippet = reply["snippet"] as Record<string, unknown>;

            let comment: VideoComments = {
              publishedAt: reply_snippet["publishedAt"] as string,  // ← 改为 reply_snippet
              textDisplay: reply_snippet["textDisplay"] as string,  // ← 改为 reply_snippet
              likeCount: reply_snippet["likeCount"] as number,      // ← 改为 reply_snippet
          };
          comments.push(comment);
          }
        }
      }

      next_page_token = (data["nextPageToken"] as string) ?? null;
      if (!next_page_token) break;

      await new Promise((resolve) => setTimeout(resolve, 500)); // 礼貌性延迟
    }

    return comments.slice(0, max_comments);
  }

  save_to_csv(
    comments: Record<string, unknown>[],
    video_info: Record<string, unknown> | null,
    filename_prefix: string = "youtube_comments"
  ): void {
    // 保存数据
    if (!comments.length) {
      console.log("没有评论可保存");
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:\-T]/g, "")
      .slice(0, 15);

    // 保存评论
    const headers = Object.keys(comments[0]).join(",");
    const csvRows = comments.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = "\uFEFF" + [headers, ...csvRows].join("\n");

    const comments_file = `${filename_prefix}_comments_${timestamp}.csv`;
    fs.writeFileSync(comments_file, csv, "utf8");
    console.log(`✅ 已保存 ${comments.length} 条评论到: ${comments_file}`);

    // 保存视频信息
    if (video_info) {
      const info_headers = Object.keys(video_info).join(",");
      const info_row = Object.values(video_info)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",");
      const info_csv = "\uFEFF" + [info_headers, info_row].join("\n");

      const info_file = `${filename_prefix}_info_${timestamp}.csv`;
      fs.writeFileSync(info_file, info_csv, "utf8");
      console.log(`✅ 已保存视频信息到: ${info_file}`);
    }
  }
}

export class youtubeClient {
  static SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
  static CLIENT_SECRETS_FILE = "D:\\Workbench\\Application\\Agent\\TripleAEngine\\config\\youtube_client.json";
  static TOKEN_PICKLE_FILE = "youtube_token.json"; // pickle -> JSON
  static PROXY = "http://127.0.0.1:7890";
  static proxies = {
    http: youtubeClient.PROXY,
    https: youtubeClient.PROXY,
  };

  constructor() {}

  async _get_authenticated_service(): Promise<OAuth2Client> {
    let credentials: OAuth2Client | null = null;

    // 1. 尝试从JSON文件加载已保存的凭证
    if (fs.existsSync(youtubeClient.TOKEN_PICKLE_FILE)) {
      console.log("找到已保存的凭证，正在加载...");
      const tokenData = JSON.parse(
        fs.readFileSync(youtubeClient.TOKEN_PICKLE_FILE, "utf8")
      );
      const { google } = await import("googleapis");
      credentials = google.auth.fromJSON(tokenData) as OAuth2Client;
      console.log("凭证加载成功");
    }

    // 2. 如果没有凭证或凭证无效，需要重新授权
    if (!credentials) {
      console.log("需要重新授权...");
      const { google } = await import("googleapis");
      const keyFile = JSON.parse(
        fs.readFileSync(youtubeClient.CLIENT_SECRETS_FILE, "utf8")
      );
      credentials = new google.auth.OAuth2(
        keyFile.installed.client_id,
        keyFile.installed.client_secret,
        "http://localhost:8080"
      );

      const authUrl = credentials.generateAuthUrl({
        access_type: "offline",
        scope: youtubeClient.SCOPES,
      });
      console.log("请在浏览器中授权...", authUrl);
      // NOTE: 本地server授权流程需要在实际环境中处理
    }

    // 3. 保存凭证供下次使用
    const tokenData = JSON.stringify(credentials.credentials);
    fs.writeFileSync(youtubeClient.TOKEN_PICKLE_FILE, tokenData);
    console.log("凭证已保存到", youtubeClient.TOKEN_PICKLE_FILE);

    return credentials;
  }

  async _create_resumable_session(
    access_token: string,
    metadata: Record<string, unknown>
  ): Promise<string | null> {
    // 创建可续传上传会话
    const url =
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Type": "video/*",
    };

    try {
      console.log("正在创建上传会话...");
      const response = await axios.post(url, JSON.stringify(metadata), {
        headers,
        proxy: {
          host: "127.0.0.1",
          port: 7890,
        },
        timeout: 30000,
      });

      if (response.status === 200) {
        const upload_url = response.headers["location"];
        if (upload_url) {
          console.log("✅ 上传会话创建成功");
          return upload_url;
        } else {
          console.log("❌ 响应中没有找到上传URL");
          return null;
        }
      } else {
        console.log(`❌ 创建会话失败: HTTP ${response.status}`);
        console.log(`响应内容: ${response.data}`);
        return null;
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (e.code === "ETIMEDOUT") {
          console.log("❌ 连接超时，请检查代理设置");
        } else if (e.message?.includes("proxy")) {
          console.log(`❌ 代理错误: ${e}`);
        } else {
          console.log(`❌ 创建会话时发生错误: ${e}`);
        }
      } else {
        console.log(`❌ 创建会话时发生错误: ${e}`);
      }
      return null;
    }
  }

  async _upload_file_with_progress(
    upload_url: string,
    file_path: string,
    access_token: string
  ): Promise<Record<string, unknown> | null> {
    // 上传文件并显示进度
    const file_size = fs.statSync(file_path).size;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "video/*",
      "Content-Length": String(file_size),
    };

    console.log(`开始上传文件 (${(file_size / 1024 / 1024).toFixed(2)} MB)...`);

    // 分块上传，显示进度
    const chunk_size = 5 * 1024 * 1024; // 5MB
    let uploaded = 0;

    const fileHandle = fs.openSync(file_path, "r");

    try {
      while (uploaded < file_size) {
        const chunk = Buffer.alloc(Math.min(chunk_size, file_size - uploaded));
        const bytesRead = fs.readSync(fileHandle, chunk, 0, chunk.length, uploaded);
        if (bytesRead === 0) break;

        const actualChunk = chunk.slice(0, bytesRead);

        // 计算当前块的字节范围
        const start = uploaded;
        const end = Math.min(uploaded + actualChunk.length - 1, file_size - 1);
        const content_range = `bytes ${start}-${end}/${file_size}`;

        headers["Content-Range"] = content_range;

        try {
          const response = await axios.put(upload_url, actualChunk, {
            headers,
            proxy: { host: "127.0.0.1", port: 7890 },
            timeout: 60000,
          });

          if (response.status === 200 || response.status === 201) {
            // 上传完成
            const progress = 100;
            console.log(`上传进度: ${progress}%`);
            return response.data;
          } else if (response.status === 308) {
            // 部分上传成功，继续
            uploaded += actualChunk.length;
            const progress = Math.floor((uploaded / file_size) * 100);
            console.log(`上传进度: ${progress}%`);
          } else {
            console.log(`❌ 上传失败: HTTP ${response.status}`);
            console.log(`响应: ${response.data}`);
            return null;
          }
        } catch (e) {
          console.log(`❌ 上传出错: ${e}`);
          return null;
        }
      }
    } finally {
      fs.closeSync(fileHandle);
    }

    return null;
  }

  // ---------------------------------
  async upload_video(
    credentials: OAuth2Client,
    video_info: VideoInfo
  ): Promise<Record<string, unknown> | null> {
    // 1. 准备视频元数据
    const metadata = {
      snippet: {
        title: video_info.snippet.title,
        description: video_info.snippet.description,
        tags: video_info.snippet.tags,
        categoryId: video_info.snippet.categoryId,
      },
      status: {
        privacyStatus: video_info.status.privacyStatus,
        madeForKids: video_info.status.selfDeclaredMadeForKids,
      },
    };

    // 2. 获取访问令牌
    const access_token = credentials.credentials.access_token!;

    // 3. 创建可续传上传会话
    const upload_url = await this._create_resumable_session(
      access_token,
      metadata
    );
    if (!upload_url) {
      return null;
    }

    // 4. 上传文件
    const result = await this._upload_file_with_progress(
      upload_url,
      video_info.video_file_path,
      access_token
    );

    if (result) {
      console.log("✅ 上传成功！");
      console.log(`   视频ID: ${result["id"]}`);
      console.log(`   视频URL: https://youtu.be/${result["id"]}`);
      return result;
    } else {
      console.log("❌ 上传失败");
      return null;
    }
  }

async crawl_video_comments(video_id: string): Promise<VideoComments[]> {
    const commentcollector = new YouTubeCommentCollector(API_KEY, proxies);
    const comments: VideoComments[] = await commentcollector.get_video_comments(video_id); // ← await
    return comments;
}

  async get_video_info(video_id: string): Promise<void> {
    // pass
  }
}
