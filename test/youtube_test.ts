// 对应 test/youtube_test.py

import axios from "axios";
import * as fs from "fs";

// ==================== 配置区域 ====================
const API_KEY = "AIzaSyBaZWu2nCKhhNB_FhYGX5P1XWSzAYX4mOM";
const VIDEO_URL = "https://youtu.be/uQJF5fcjFbg?si=VW-O19wOfYYnDORy---";
const VIDEO_ID = "uQJF5fcjFbg"; // 从分享链接中提取

// 代理设置（根据你的代理软件修改）
const PROXY = "http://127.0.0.1:7890"; // 你的Clash端口
// =================================================

const proxies = {
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
    max_comments: number = 500
  ): Promise<Record<string, unknown>[]> {
    // 获取评论（包括回复）
    const comments: Record<string, unknown>[] = [];
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

        comments.push({
          comment_id: item["id"],
          author: top_comment["authorDisplayName"],
          text: top_comment["textDisplay"],
          like_count: top_comment["likeCount"],
          published_at: top_comment["publishedAt"],
          reply_count: (item["snippet"] as Record<string, unknown>)[
            "totalReplyCount"
          ],
          is_reply: false,
          parent_id: null,
        });

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
            comments.push({
              comment_id: reply["id"],
              author: reply_snippet["authorDisplayName"],
              text: reply_snippet["textDisplay"],
              like_count: reply_snippet["likeCount"],
              published_at: reply_snippet["publishedAt"],
              reply_count: 0,
              is_reply: true,
              parent_id: item["id"],
            });
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

async function test_proxy(): Promise<boolean> {
  // 测试代理是否可用
  console.log(`\n🔍 测试代理 ${PROXY}...`);
  try {
    const r = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos?part=id&id=uQJF5fcjFbg",
      { proxy: proxies, timeout: 10000 }
    );
    console.log(`✅ 代理工作正常 (状态码: ${r.status})`);
    return true;
  } catch (e) {
    console.log(`❌ 代理测试失败: ${e}`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("YouTube评论采集器 (axios版)");
  console.log("=".repeat(60));

  // 1. 测试代理
  if (!(await test_proxy())) {
    console.log("\n⚠️  代理测试失败，请检查：");
    console.log("   1. 代理软件是否开启");
    console.log("   2. 代理端口是否为 7890");
    console.log("   3. 尝试关闭代理直接运行（如果网络直连可用）");
    return;
  }

  // 2. 初始化采集器
  const collector = new YouTubeCommentCollector(API_KEY, proxies);

  // 3. 获取视频信息
  console.log(`\n📹 获取视频信息...`);
  const video_info = await collector.get_video_info(VIDEO_ID);

  if (!video_info) {
    console.log("❌ 无法获取视频信息");
    return;
  }

  console.log(`\n📊 视频信息:`);
  console.log(`标题: ${video_info["title"]}`);
  console.log(`频道: ${video_info["channel"]}`);
  console.log(`发布时间: ${video_info["published_at"]}`);
  console.log(`观看次数: ${Number(video_info["view_count"]).toLocaleString()}`);
  console.log(`点赞数: ${Number(video_info["like_count"]).toLocaleString()}`);
  console.log(`评论数: ${Number(video_info["comment_count"]).toLocaleString()}`);

  // 4. 获取评论
  console.log(`\n💬 获取评论...`);
  const max_comments = Math.min(500, video_info["comment_count"] as number);
  console.log(`目标获取: ${max_comments} 条`);

  const comments = await collector.get_video_comments(VIDEO_ID, max_comments);

  if (comments.length) {
    // 统计
    const main_c = comments.filter((c) => !c["is_reply"]);
    const replies = comments.filter((c) => c["is_reply"]);

    console.log(`\n📈 统计:`);
    console.log(`总获取: ${comments.length} 条`);
    console.log(`主评论: ${main_c.length} 条`);
    console.log(`回复: ${replies.length} 条`);
    console.log(`API请求: ${collector.request_count} 次`);

    // 保存
    collector.save_to_csv(comments, video_info, `iran_economy_${VIDEO_ID}`);

    // 显示示例
    console.log("\n📝 前3条热门评论:");
    const top3 = [...comments]
      .sort((a, b) => (b["like_count"] as number) - (a["like_count"] as number))
      .slice(0, 3);
    for (let i = 0; i < top3.length; i++) {
      const c = top3[i];
      console.log(`\n${i + 1}. ${c["author"]} (👍 ${c["like_count"]})`);
      console.log(`   ${String(c["text"]).slice(0, 150)}...`);
    }
  } else {
    console.log("❌ 未获取到评论");
    console.log("\n可能原因:");
    console.log("- 视频关闭了评论");
    console.log("- API配额用完");
    console.log("- 需要登录才能查看");
  }
}

if (require.main === module) {
  main();
}
