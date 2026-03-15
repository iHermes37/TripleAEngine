// 对应 test/youtube_upload.py

import axios from "axios";
import * as fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

// 代理设置（根据你的VPN调整）
const PROXY = "http://127.0.0.1:7890";
const proxies = {
  host: "127.0.0.1",
  port: 7890,
};

// 设置OAuth 2.0的范围
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const CLIENT_SECRETS_FILE =
  "D:\\Workbench\\Application\\Agent\\TripleAEngine\\config\\youtube_client.json";
const TOKEN_JSON_FILE = "youtube_token.json"; // pickle -> JSON

async function get_authenticated_service(): Promise<OAuth2Client> {
  // 获取认证凭证
  let credentials: OAuth2Client | null = null;

  // 1. 尝试从JSON文件加载已保存的凭证
  if (fs.existsSync(TOKEN_JSON_FILE)) {
    console.log("找到已保存的凭证，正在加载...");
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_JSON_FILE, "utf8"));
    credentials = google.auth.fromJSON(tokenData) as OAuth2Client;
    console.log("凭证加载成功");
  }

  // 2. 如果没有凭证或凭证无效，需要重新授权
  if (!credentials) {
    console.log("需要重新授权...");
    const keyFile = JSON.parse(fs.readFileSync(CLIENT_SECRETS_FILE, "utf8"));
    credentials = new google.auth.OAuth2(
      keyFile.installed.client_id,
      keyFile.installed.client_secret,
      "http://localhost:8080"
    );

    const authUrl = credentials.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("请在浏览器中授权...", authUrl);
    // NOTE: 本地server授权流程需要在实际环境中处理
  }

  // 3. 保存凭证供下次使用
  const tokenData = JSON.stringify(credentials.credentials);
  fs.writeFileSync(TOKEN_JSON_FILE, tokenData);
  console.log("凭证已保存到", TOKEN_JSON_FILE);

  return credentials;
}

async function create_resumable_session(
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
      proxy: proxies,
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
      } else if (e.message?.toLowerCase().includes("proxy")) {
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

async function upload_file_with_progress(
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
          proxy: proxies,
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

async function upload_video_with_requests(
  credentials: OAuth2Client,
  video_info: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  // 使用axios库上传视频的主函数

  // 1. 准备视频元数据
  const metadata = {
    snippet: {
      title: video_info["title"],
      description: video_info["description"],
      tags: video_info["tags"] ?? [],
      categoryId: video_info["category"],
    },
    status: {
      privacyStatus: video_info["privacyStatus"],
      madeForKids: video_info["madeForKids"] ?? false,
    },
  };

  // 2. 获取访问令牌
  const access_token = credentials.credentials.access_token!;

  // 3. 创建可续传上传会话
  const upload_url = await create_resumable_session(access_token, metadata);
  if (!upload_url) {
    return null;
  }

  // 4. 上传文件
  const result = await upload_file_with_progress(
    upload_url,
    video_info["file"] as string,
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

async function test_proxy_connection(): Promise<boolean> {
  // 测试代理连接是否正常
  try {
    console.log("正在测试代理连接...");
    const response = await axios.get(
      "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest",
      { proxy: proxies, timeout: 10000 }
    );
    console.log(`✅ 代理连接正常 (HTTP ${response.status})`);
    return true;
  } catch (e) {
    console.log(`❌ 代理连接失败: ${e}`);
    return false;
  }
}

async function main(): Promise<void> {
  // 1. 测试代理连接
  if (!(await test_proxy_connection())) {
    console.log("请检查代理设置后重试");
    return;
  }

  // 2. 获取认证
  console.log("\n正在获取YouTube认证...");
  const credentials = await get_authenticated_service();
  console.log("✅ 认证成功！");

  // 3. 视频信息配置
  const video_files = [
    {
      file: "D:\\Temporary\\594171c2-3a4d-4ba8-aa56-b1c9ab235936.mp4",
      title: "静夜思：李白笔下的月光、乡愁与无尽思绪",
      description: "静夜思：李白笔下的月光、乡愁与无尽思绪",
      category: "27", // 27是教育
      tags: ["李白", "静夜思", "古诗鉴赏"],
      privacyStatus: "public",
      madeForKids: false,
    },
  ];

  // 4. 上传视频
  for (let i = 0; i < video_files.length; i++) {
    const video = video_files[i];
    console.log(`\n${"=".repeat(50)}`);
    console.log(`开始处理第 ${i + 1} 个视频`);
    console.log(`文件: ${video.file}`);

    // 检查文件
    if (!fs.existsSync(video.file)) {
      console.log(`❌ 文件不存在: ${video.file}`);
      continue;
    }

    // 上传
    await upload_video_with_requests(credentials, video);
  }
}

if (require.main === module) {
  main();
}
