// 对应 app/core/platform/media/youtube.py

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { VideoInfo } from "@/app/schemas/video";

// google-auth-library 对应 google.auth / google.oauth2
import { OAuth2Client } from "google-auth-library";

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

  async crawl_video_comments(video_id: string): Promise<void> {
    // pass
  }

  async get_video_info(video_id: string): Promise<void> {
    // pass
  }
}
