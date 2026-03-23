// 对应 app/core/platform/media/youtube.py

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { VideoData, VideoInfo } from "@/types/video";

// google-auth-library 对应 google.auth / google.oauth2
import { OAuth2Client } from "google-auth-library";
import { SocialMediaService } from "@/types/media";
import { Platform } from "@/types/constant";
import { securitycenter } from "googleapis/build/src/apis/securitycenter";
import { ArticleData, ArticleInfo } from "@/types/article";
import { MediaComment } from "@/types/comment";

// ==================== 配置区域 ====================
const API_KEY = process.env.YOUTUBE_API_KEY!;
const VIDEO_URL = "https://youtu.be/uQJF5fcjFbg?si=VW-O19wOfYYnDORy---";
const VIDEO_ID = "uQJF5fcjFbg"; // 从分享链接中提取

// 代理设置（根据你的代理软件修改）
const PROXY = process.env.PROXY_URL || "http://127.0.0.1:7890";
// =================================================

const _proxyUrl = new URL(PROXY);
const proxies = {
  protocol: "http",
  host: _proxyUrl.hostname,
  port: parseInt(_proxyUrl.port, 10),
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

  // async get_video_comments(
  //   video_id: string,
  //   max_comments: number =5
  // ): Promise<MediaComment[]> {
  //   // 获取评论（包括回复）
  //   const comments: MediaComment[] = [];
  //   let next_page_token: string | null = null;

  //   while (comments.length < max_comments) {
  //     const url = `${this.base_url}/commentThreads`;
  //     const params: Record<string, unknown> = {
  //       part: "snippet,replies",
  //       videoId: video_id,
  //       maxResults: Math.min(100, max_comments - comments.length),
  //       key: this.api_key,
  //       order: "relevance",
  //     };

  //     if (next_page_token) {
  //       params["pageToken"] = next_page_token;
  //     }

  //     const data = await this._make_request(url, params);
  //     if (!data || !Array.isArray(data["items"])) {
  //       break;
  //     }

  //     for (const item of data["items"] as Record<string, unknown>[]) {
  //       if (comments.length >= max_comments) break;

  //       // 主评论
  //       const top_comment = (
  //         (item["snippet"] as Record<string, unknown>)[
  //           "topLevelComment"
  //         ] as Record<string, unknown>
  //       )["snippet"] as Record<string, unknown>;



  //       let comment : MediaComment={
  //           publishedAt: top_comment["publishedAt"] as string,
  //           textDisplay: top_comment["textDisplay"] as string,
  //           likeCount: top_comment["likeCount"] as number,
  //       }; 
          
        

  //       comments.push(comment);

  //       // 处理回复
  //       if ("replies" in item) {
  //         const replies = (
  //           (item["replies"] as Record<string, unknown>)["comments"] as Record<
  //             string,
  //             unknown
  //           >[]
  //         );
  //         for (const reply of replies) {
  //           if (comments.length >= max_comments) break;
  //           const reply_snippet = reply["snippet"] as Record<string, unknown>;

  //           let comment: MediaComment = {
  //             publishedAt: reply_snippet["publishedAt"] as string,  // ← 改为 reply_snippet
  //             textDisplay: reply_snippet["textDisplay"] as string,  // ← 改为 reply_snippet
  //             likeCount: reply_snippet["likeCount"] as number,      // ← 改为 reply_snippet
  //         };
  //         comments.push(comment);
  //         }
  //       }
  //     }

  //     next_page_token = (data["nextPageToken"] as string) ?? null;
  //     if (!next_page_token) break;

  //     await new Promise((resolve) => setTimeout(resolve, 500)); // 礼貌性延迟
  //   }

  //   return comments.slice(0, max_comments);
  // }
  //------------
  async get_video_comments(
      video_id: string,
      max_comments: number = 5
    ): Promise<MediaComment[]> {
      // 获取评论（包括回复）
      const comments: MediaComment[] = [];
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

          // 获取回复数量
          const total_reply_count = (item["snippet"] as Record<string, unknown>)["totalReplyCount"] as number || 0;

          let comment: MediaComment = {
            createdAtUTC: new Date(top_comment["publishedAt"] as string).getTime(),
            body: top_comment["textDisplay"] as string,
            upvotes: top_comment["likeCount"] as number,
            replyCount: total_reply_count,
          };

          comments.push(comment);

          // 处理回复
          if ("replies" in item && total_reply_count > 0) {
            const replies = (
              (item["replies"] as Record<string, unknown>)["comments"] as Record<
                string,
                unknown
              >[]
            );
            
            if (replies && Array.isArray(replies)) {
              for (const reply of replies) {
                if (comments.length >= max_comments) break;
                const reply_snippet = reply["snippet"] as Record<string, unknown>;

                let reply_comment: MediaComment = {
                  createdAtUTC: new Date(reply_snippet["publishedAt"] as string).getTime(),
                  body: reply_snippet["textDisplay"] as string,
                  upvotes: reply_snippet["likeCount"] as number,
                  replyCount: 0, // 回复通常没有回复，或者可以获取更深层的回复数
                };
                comments.push(reply_comment);
              }
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

export class YoutubeClient implements SocialMediaService {
  static SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
  static CLIENT_SECRETS_FILE = process.env.YOUTUBE_CLIENT_SECRETS_FILE || "config/youtube_client.json";
  static TOKEN_PICKLE_FILE = process.env.YOUTUBE_TOKEN_FILE || "youtube_token.json"; // pickle -> JSON
  static PROXY = process.env.PROXY_URL || "http://127.0.0.1:7890";
  static proxies = {
    http: YoutubeClient.PROXY,
    https: YoutubeClient.PROXY,
  };

  constructor() {}

  // async _get_authenticated_service(): Promise<OAuth2Client> {
  //   let credentials: OAuth2Client | null = null;

  //   // 1. 尝试从JSON文件加载已保存的凭证
  //   if (fs.existsSync(YoutubeClient.TOKEN_PICKLE_FILE)) {
  //     console.log("找到已保存的凭证，正在加载...");
  //     const tokenData = JSON.parse(
  //       fs.readFileSync(YoutubeClient.TOKEN_PICKLE_FILE, "utf8")
  //     );
  //     const { google } = await import("googleapis");
  //     credentials = google.auth.fromJSON(tokenData) as OAuth2Client;
  //     console.log("凭证加载成功");
  //   }

  //   // 2. 如果没有凭证或凭证无效，需要重新授权
  //   if (!credentials) {
  //     console.log("需要重新授权...");
  //     const { google } = await import("googleapis");
  //     const keyFile = JSON.parse(
  //       fs.readFileSync(YoutubeClient.CLIENT_SECRETS_FILE, "utf8")
  //     );
  //     credentials = new google.auth.OAuth2(
  //       keyFile.installed.client_id,
  //       keyFile.installed.client_secret,
  //       "http://localhost:8080"
  //     );

  //     const authUrl = credentials.generateAuthUrl({
  //       access_type: "offline",
  //       scope: YoutubeClient.SCOPES,
  //     });
  //     console.log("请在浏览器中授权...", authUrl);
  //     // NOTE: 本地server授权流程需要在实际环境中处理
  //   }

  //   // 3. 保存凭证供下次使用
  //   const tokenData = JSON.stringify(credentials.credentials);
  //   fs.writeFileSync(YoutubeClient.TOKEN_PICKLE_FILE, tokenData);
  //   console.log("凭证已保存到", YoutubeClient.TOKEN_PICKLE_FILE);

  //   return credentials;
  // }

  async _get_authenticated_service(): Promise<OAuth2Client> {
  const { google } = await import("googleapis");
  let oauth2Client: OAuth2Client | null = null;

  // 1. 尝试从文件加载已保存的 token
  if (fs.existsSync(YoutubeClient.TOKEN_PICKLE_FILE)) {
    console.log("找到已保存的凭证，正在加载...");
    try {
      const tokenData = JSON.parse(
        fs.readFileSync(YoutubeClient.TOKEN_PICKLE_FILE, "utf8")
      );
      
      // 读取客户端配置
      const keyFile = JSON.parse(
        fs.readFileSync(YoutubeClient.CLIENT_SECRETS_FILE, "utf8")
      );
      const clientSecret = keyFile.installed || keyFile.web;
      
      // 创建 OAuth2Client 实例
      oauth2Client = new google.auth.OAuth2(
        clientSecret.client_id,
        clientSecret.client_secret,
        clientSecret.redirect_uris?.[0] || "http://localhost:8080"
      );
      
      // 设置保存的凭证
      oauth2Client.setCredentials(tokenData);
      
      // 检查 token 是否过期
      const tokenExpiry = oauth2Client.credentials.expiry_date;
      const isExpired = tokenExpiry && tokenExpiry <= Date.now();
      
      if (isExpired) {
        console.log("Token 已过期，尝试刷新...");
        try {
          // 如果有 refresh_token，尝试刷新
          if (oauth2Client.credentials.refresh_token) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            // 保存刷新后的 token
            fs.writeFileSync(YoutubeClient.TOKEN_PICKLE_FILE, JSON.stringify(credentials, null, 2));
            console.log("Token 刷新成功");
          } else {
            console.log("没有 refresh_token，需要重新授权");
            oauth2Client = null;
          }
        } catch (refreshError) {
          console.log("Token 刷新失败，需要重新授权:", refreshError);
          oauth2Client = null;
        }
      } else {
        console.log("凭证加载成功，Token 有效");
      }
    } catch (error) {
      console.log("加载凭证失败:", error);
      oauth2Client = null;
    }
  }

  // 2. 如果没有有效的凭证，需要重新授权
  if (!oauth2Client) {
    console.log("需要重新授权...");
    
    if (!fs.existsSync(YoutubeClient.CLIENT_SECRETS_FILE)) {
      throw new Error(
        `找不到 OAuth 客户端密钥文件: ${YoutubeClient.CLIENT_SECRETS_FILE}\n` +
        `请从 Google Cloud Console 下载 OAuth 2.0 客户端密钥并保存到该位置`
      );
    }
    
    const keyFile = JSON.parse(
      fs.readFileSync(YoutubeClient.CLIENT_SECRETS_FILE, "utf8")
    );
    
    const clientSecret = keyFile.installed || keyFile.web;
    
    if (!clientSecret) {
      throw new Error(
        `客户端密钥文件格式错误，期望包含 "installed" 或 "web" 字段\n` +
        `当前文件包含的字段: ${Object.keys(keyFile).join(", ")}`
      );
    }
    
    console.log(`使用 ${keyFile.installed ? 'installed' : 'web'} 格式的客户端配置`);
    
    const redirectUri = clientSecret.redirect_uris?.[0] || "http://localhost:8080";
    
    oauth2Client = new google.auth.OAuth2(
      clientSecret.client_id,
      clientSecret.client_secret,
      redirectUri
    );

    // 生成授权 URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: YoutubeClient.SCOPES,
      prompt: "consent",  // 强制获取 refresh_token
    });
    
    console.log("\n========== 需要授权 ==========");
    console.log("请在浏览器中打开以下 URL 进行授权：");
    console.log(authUrl);
    console.log("================================\n");
    console.log("授权完成后，请在回调页面获取 authorization code");
    console.log("然后使用以下代码获取并保存 token：");
    console.log(`
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        '${clientSecret.client_id}',
        '${clientSecret.client_secret}',
        '${redirectUri}'
      );
      const { tokens } = await oauth2Client.getToken('YOUR_AUTHORIZATION_CODE');
      console.log(tokens);
    `);
    
    throw new Error("需要用户授权，请按照上述步骤完成授权");
  }

  return oauth2Client;
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
          host: new URL(YoutubeClient.PROXY).hostname,
          port: parseInt(new URL(YoutubeClient.PROXY).port, 10),
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

  // async _upload_file_with_progress(
  //   upload_url: string,
  //   file_path: string,
  //   access_token: string
  // ): Promise<Record<string, unknown> | null> {
  //   // 上传文件并显示进度
  //   const file_size = fs.statSync(file_path).size;

  //   const headers: Record<string, string> = {
  //     Authorization: `Bearer ${access_token}`,
  //     "Content-Type": "video/*",
  //     "Content-Length": String(file_size),
  //   };

  //   console.log(`开始上传文件 (${(file_size / 1024 / 1024).toFixed(2)} MB)...`);

  //   // 分块上传，显示进度
  //   const chunk_size = 5 * 1024 * 1024; // 5MB
  //   let uploaded = 0;

  //   const fileHandle = fs.openSync(file_path, "r");

  //   try {
  //     while (uploaded < file_size) {
  //       const chunk = Buffer.alloc(Math.min(chunk_size, file_size - uploaded));
  //       const bytesRead = fs.readSync(fileHandle, chunk, 0, chunk.length, uploaded);
  //       if (bytesRead === 0) break;

  //       const actualChunk = chunk.slice(0, bytesRead);

  //       // 计算当前块的字节范围
  //       const start = uploaded;
  //       const end = Math.min(uploaded + actualChunk.length - 1, file_size - 1);
  //       const content_range = `bytes ${start}-${end}/${file_size}`;

  //       headers["Content-Range"] = content_range;

  //       try {
  //         const response = await axios.put(upload_url, actualChunk, {
  //           headers,
  //           proxy: { host: new URL(YoutubeClient.PROXY).hostname, port: parseInt(new URL(YoutubeClient.PROXY).port, 10) },
  //           timeout: 60000,
  //         });

  //         if (response.status === 200 || response.status === 201) {
  //           // 上传完成
  //           const progress = 100;
  //           console.log(`上传进度: ${progress}%`);
  //           return response.data;
  //         } else if (response.status === 308) {
  //           // 部分上传成功，继续
  //           uploaded += actualChunk.length;
  //           const progress = Math.floor((uploaded / file_size) * 100);
  //           console.log(`上传进度: ${progress}%`);
  //         } else {
  //           console.log(`❌ 上传失败: HTTP ${response.status}`);
  //           console.log(`响应: ${response.data}`);
  //           return null;
  //         }
  //       } catch (e) {
  //         console.log(`❌ 上传出错: ${e}`);
  //         return null;
  //       }
  //     }
  //   } finally {
  //     fs.closeSync(fileHandle);
  //   }

  //   return null;
  // }

  // ---------------------------------
  async _upload_file_with_progress(
    upload_url: string,
    file: File,
    access_token: string
  ): Promise<Record<string, unknown> | null> {
    // 上传文件并显示进度
    const file_size = file.size;

    console.log(`开始上传文件 (${(file_size / 1024 / 1024).toFixed(2)} MB)...`);

    // 分块上传，显示进度
    const chunk_size = 5 * 1024 * 1024; // 5MB
    let uploaded = 0;

    try {
      while (uploaded < file_size) {
        // 读取文件块
        const chunk_end = Math.min(uploaded + chunk_size, file_size);
        const chunk = file.slice(uploaded, chunk_end);
        
        // 将 Blob 转换为 ArrayBuffer 再转换为 Buffer（如果是 Node.js 环境）
        // 如果在浏览器环境，直接使用 Blob
        let chunkData: Blob | Buffer;
        
        // 判断运行环境
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          // Node.js 环境：将 Blob 转换为 Buffer
          const arrayBuffer = await chunk.arrayBuffer();
          chunkData = Buffer.from(arrayBuffer);
        } else {
          // 浏览器环境：直接使用 Blob
          chunkData = chunk;
        }

        // 计算当前块的字节范围
        const start = uploaded;
        const end = Math.min(uploaded + chunk_size - 1, file_size - 1);
        const content_range = `bytes ${start}-${end}/${file_size}`;

        const headers: Record<string, string> = {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "video/*",
          "Content-Length": String(chunk_end - uploaded),
        };

        // 只在有 Content-Range 时添加（非第一个块或非完整上传）
        if (uploaded > 0) {
          headers["Content-Range"] = content_range;
        }

        try {
          const response = await axios.put(upload_url, chunkData, {
            headers,
            timeout: 60000,
          });

          if (response.status === 200 || response.status === 201) {
            // 上传完成
            const progress = 100;
            console.log(`上传进度: ${progress}%`);
            return response.data;
          } else if (response.status === 308) {
            // 部分上传成功，继续
            uploaded += (chunk_end - uploaded);
            const progress = Math.floor((uploaded / file_size) * 100);
            console.log(`上传进度: ${progress}%`);
          } else {
            console.log(`❌ 上传失败: HTTP ${response.status}`);
            console.log(`响应: ${JSON.stringify(response.data)}`);
            return null;
          }
        } catch (e) {
          console.log(`❌ 上传出错: ${e}`);
          return null;
        }
      }
    } catch (e) {
      console.log(`❌ 读取文件出错: ${e}`);
      return null;
    }

    return null;
  }

  // 辅助方法：从 YouTube URL 中提取视频 ID
  private _extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/shorts\/([^?]+)/, // 支持 Shorts 视频
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }
  
  //-------------------------------------
  getPlatformName(): Platform {
    return Platform.YouTube;
  }

  async uploadVideo(
    file:File,
    video_info: VideoInfo,
    credentials: OAuth2Client,
  ): Promise<boolean> {
    // 1. 准备视频元数据
    const metadata = {
        title: video_info.title,
        description: video_info.description,
        tags: video_info.tags,
        categoryId: video_info.categoryId,
        privacyStatus: video_info.privacyStatus,
    };

    // 2. 获取访问令牌
    const access_token = credentials.credentials.access_token!;

    // 3. 创建可续传上传会话
    const upload_url = await this._create_resumable_session(
      access_token,
      metadata
    );
    if (!upload_url) {
      return false;
    }

    // 4. 上传文件
    const result = await this._upload_file_with_progress(
      upload_url,
      file,
      access_token
    );

    if (result) {
      console.log("✅ 上传成功！");
      console.log(`   视频ID: ${result["id"]}`);
      console.log(`   视频URL: https://youtu.be/${result["id"]}`);
      return true;
    } else {
      console.log("❌ 上传失败");
      return false;
    }
  }

  async getComments(video_url: string): Promise<MediaComment[]> {
      const commentcollector = new YouTubeCommentCollector(API_KEY, proxies);
      const comments: MediaComment[] = await commentcollector.get_video_comments(video_url); // ← await
      return comments;
  }

  async getVideoData(video_url: string): Promise<VideoData> {
      try {
        // 从 URL 中提取视频 ID
        const video_id = this._extractVideoId(video_url);
        if (!video_id) {
          throw new Error("无效的 YouTube 视频 URL");
        }

        console.log(`正在获取视频数据: ${video_id}`);

        // 使用 YouTube Data API v3
        const api_key = process.env.YOUTUBE_API_KEY;
        if (!api_key) {
          throw new Error("未设置 YOUTUBE_API_KEY 环境变量");
        }

        // 1. 获取视频基本信息
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos`;
        const videoParams = {
          part: "snippet,statistics",
          id: video_id,
          key: api_key,
        };

        const videoResponse = await axios.get(videoUrl, {
          params: videoParams,
          proxy: {
            host: new URL(YoutubeClient.PROXY).hostname,
            port: parseInt(new URL(YoutubeClient.PROXY).port, 10),
          },
          timeout: 30000,
        });

        if (videoResponse.status !== 200 || !videoResponse.data.items || videoResponse.data.items.length === 0) {
          throw new Error("未找到视频数据");
        }

        const video = videoResponse.data.items[0];
        const snippet = video.snippet;
        const statistics = video.statistics;

        // 2. 获取视频评论
        const comments = await this.getComments(video_url);

        // 3. 构建 VideoData 对象
        const videoData: VideoData = {
          name: snippet.title,
          viewCount: parseInt(statistics.viewCount || "0"),
          likeCount: parseInt(statistics.likeCount || "0"),
          shareCount: 0, // YouTube API 不直接提供分享数，可以通过其他方式获取或设为0
          commentCount: parseInt(statistics.commentCount || "0"),
          comments: comments,
          createTime: new Date(snippet.publishedAt).getTime(), // 转换为时间戳
        };

        console.log(`✅ 成功获取视频数据: ${videoData.name}`);
        console.log(`   观看次数: ${videoData.viewCount}`);
        console.log(`   点赞数: ${videoData.likeCount}`);
        console.log(`   评论数: ${videoData.commentCount}`);
        
        return videoData;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(`❌ API 请求失败: ${error.message}`);
          if (error.response) {
            console.error(`响应状态: ${error.response.status}`);
            console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
          }
        } else {
          console.error(`❌ 获取视频数据失败: ${error}`);
        }
        throw error;
      }
    }
  // ----------------
  uploadArticle(file:File, metadata:ArticleInfo):Promise<boolean> {
    // pass
    return Promise.resolve(true);
  }

  async getArticleData(article_url: string): Promise<ArticleData> {
    return Promise.resolve({} as ArticleData);
  }
}
