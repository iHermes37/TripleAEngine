// 对应 test/crawl_youtube_1.py

import { google } from "googleapis";
import * as fs from "fs";
import { parse as parseDuration } from "iso8601-duration";

const API_KEY = "AIzaSyBaZWu2nCKhhNB_FhYGX5P1XWSzAYX4mOM";

const VIDEO_CATEGORIES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "18": "Short Movies",
  "19": "Travel & Events",
  "20": "Gaming",
  "21": "Videoblogging",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
  "30": "Movies",
  "31": "Anime/Animation",
  "32": "Action/Adventure",
  "33": "Classics",
  "34": "Comedy",
  "35": "Documentary",
  "36": "Drama",
  "37": "Family",
  "38": "Foreign",
  "39": "Horror",
  "40": "Sci-Fi/Fantasy",
  "41": "Thriller",
  "42": "Shorts",
  "43": "Shows",
  "44": "Trailers",
};

// 设置代理
process.env.HTTP_PROXY = "http://127.0.0.1:7890";
process.env.HTTPS_PROXY = "http://127.0.0.1:7890";

export class YouTubeHotVideos {
  // YouTube热门视频获取器
  private api_key: string;
  private proxy_host: string;
  private proxy_port: number;
  private youtube: ReturnType<typeof google.youtube>;
  private video_categories: Record<string, string>;

  constructor(
    api_key: string,
    proxy_host: string = "127.0.0.1",
    proxy_port: number = 7890
  ) {
    this.api_key = api_key;
    this.proxy_host = proxy_host;
    this.proxy_port = proxy_port;

    // 设置代理（如果需要）
    if (proxy_host && proxy_port) {
      process.env.HTTP_PROXY = `http://${proxy_host}:${proxy_port}`;
      process.env.HTTPS_PROXY = `http://${proxy_host}:${proxy_port}`;
    }

    // 构建YouTube服务
    this.youtube = google.youtube({ version: "v3", auth: this.api_key });

    // 视频类别映射（常见类别）
    this.video_categories = VIDEO_CATEGORIES;
  }

  // ============ 方法1: 获取全球热门视频 ============
  async get_most_popular_videos(
    max_results: number = 50,
    region_code: string = "US"
  ): Promise<Record<string, unknown>[]> {
    /**
     * 获取全球/地区热门视频
     */
    try {
      const response = await this.youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        chart: "mostPopular",
        regionCode: region_code,
        maxResults: max_results,
      });

      const videos: Record<string, unknown>[] = [];
      for (const item of response.data.items ?? []) {
        const video = this._parse_video_item(item);
        videos.push(video);
      }

      return videos;
    } catch (e) {
      console.log(`获取热门视频失败: ${e}`);
      return [];
    }
  }

  // ============ 方法2: 按类别获取热门视频 ============
  async get_popular_by_category(
    category_id: number,
    region_code: string = "US",
    max_results: number = 50
  ): Promise<Record<string, unknown>[]> {
    /**
     * 获取特定类别的热门视频
     */
    try {
      const response = await this.youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        chart: "mostPopular",
        regionCode: region_code,
        videoCategoryId: String(category_id),
        maxResults: max_results,
      });

      const videos: Record<string, unknown>[] = [];
      for (const item of response.data.items ?? []) {
        const video = this._parse_video_item(item);
        videos.push(video);
      }

      return videos;
    } catch (e) {
      console.log(`获取类别${category_id}热门视频失败: ${e}`);
      return [];
    }
  }

  // ============ 方法3: 按时间范围搜索热门 ============
  async search_hot_videos_by_time(
    query: string | null = null,
    published_after: string | null = null,
    published_before: string | null = null,
    max_results: number = 50,
    order: string = "viewCount"
  ): Promise<Record<string, unknown>[]> {
    /**
     * 按时间范围搜索热门视频
     */
    try {
      // 构建搜索请求
      const search_response = await this.youtube.search.list({
        part: ["snippet"],
        q: query ?? undefined,
        type: ["video"],
        order: order as "viewCount",
        publishedAfter: published_after ?? undefined,
        publishedBefore: published_before ?? undefined,
        maxResults: max_results,
      });

      // 获取视频详细信息
      const video_ids = (search_response.data.items ?? []).map(
        (item) => item.id?.videoId ?? ""
      ).filter(Boolean);

      if (!video_ids.length) {
        return [];
      }

      const videos_response = await this.youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        id: video_ids,
      });

      const videos: Record<string, unknown>[] = [];
      for (const item of videos_response.data.items ?? []) {
        const video = this._parse_video_item(item);
        videos.push(video);
      }

      return videos;
    } catch (e) {
      console.log(`搜索热门视频失败: ${e}`);
      return [];
    }
  }

  // ============ 方法4: 获取趋势视频（结合多个维度） ============
  async get_trending_videos(
    region_code: string = "US",
    category_id: number | null = null,
    days: number = 7,
    min_views: number = 100000,
    max_results: number = 50
  ): Promise<Record<string, unknown>[]> {
    /**
     * 获取趋势视频（自定义规则）
     * 结合观看量、点赞率、发布时间等多个维度判断趋势
     */
    try {
      // 计算时间范围
      const published_after =
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // 搜索视频
      const search_params: Parameters<typeof this.youtube.search.list>[0] = {
        part: ["snippet"],
        type: ["video"],
        regionCode: region_code,
        publishedAfter: published_after,
        maxResults: 50, // 先获取更多再筛选
        order: "viewCount", // 按观看量排序
      };

      if (category_id) {
        (search_params as Record<string, unknown>).videoCategoryId = String(category_id);
      }

      const search_response = await this.youtube.search.list(search_params);

      // 获取视频详细信息
      const video_ids = (search_response.data.items ?? []).map(
        (item) => item.id?.videoId ?? ""
      ).filter(Boolean);

      if (!video_ids.length) {
        return [];
      }

      const videos_response = await this.youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        id: video_ids,
      });

      // 计算趋势分数并排序
      const trending_videos: Record<string, unknown>[] = [];
      for (const item of videos_response.data.items ?? []) {
        const stats = item.statistics ?? {};
        const view_count = parseInt(stats.viewCount ?? "0");
        const like_count = parseInt(stats.likeCount ?? "0");
        const comment_count = parseInt(stats.commentCount ?? "0");

        // 只保留超过最低观看量的视频
        if (view_count < min_views) {
          continue;
        }

        // 计算趋势分数
        // 公式: (观看量 * 0.4 + 点赞数 * 0.4 + 评论数 * 0.2) / 视频存在天数
        const published_at = item.snippet?.publishedAt ?? "";
        const days_old = Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(published_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );

        const trend_score =
          (view_count * 0.4 + like_count * 0.4 + comment_count * 0.2) /
          days_old;

        const video = this._parse_video_item(item);
        video["trend_score"] = trend_score;
        trending_videos.push(video);
      }

      // 按趋势分数排序
      trending_videos.sort(
        (a, b) => (b["trend_score"] as number) - (a["trend_score"] as number)
      );

      return trending_videos.slice(0, max_results);
    } catch (e) {
      console.log(`获取趋势视频失败: ${e}`);
      return [];
    }
  }

  // ============ 辅助方法：解析视频数据 ============
  private _parse_video_item(item: Record<string, unknown>): Record<string, unknown> {
    // 解析视频项为统一格式
    const snippet = (item["snippet"] as Record<string, unknown>) ?? {};
    const statistics = (item["statistics"] as Record<string, unknown>) ?? {};

    // 解析时长
    const duration =
      ((item["contentDetails"] as Record<string, unknown>)?.["duration"] as string) ?? "PT0S";
    let duration_seconds = 0;
    let duration_str = "00:00";
    try {
      const parsed = parseDuration(duration);
      duration_seconds =
        (parsed.hours ?? 0) * 3600 +
        (parsed.minutes ?? 0) * 60 +
        (parsed.seconds ?? 0);
      const h = Math.floor(duration_seconds / 3600);
      const m = Math.floor((duration_seconds % 3600) / 60);
      const s = duration_seconds % 60;
      duration_str = h
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;
    } catch {
      duration_seconds = 0;
      duration_str = "00:00";
    }

    // 获取类别名称
    const category_id = (snippet["categoryId"] as string) ?? "";
    const category_name = this.video_categories[category_id] ?? "Unknown";

    return {
      video_id: item["id"] as string,
      title: snippet["title"] as string,
      channel: snippet["channelTitle"] as string,
      channel_id: snippet["channelId"] as string,
      published_at: snippet["publishedAt"] as string,
      category_id,
      category_name,
      view_count: parseInt((statistics["viewCount"] as string) ?? "0"),
      like_count: parseInt((statistics["likeCount"] as string) ?? "0"),
      comment_count: parseInt((statistics["commentCount"] as string) ?? "0"),
      duration_seconds,
      duration_str,
      url: `https://youtu.be/${item["id"]}`,
      thumbnail: (
        (snippet["thumbnails"] as Record<string, Record<string, string>>)?.["high"]
      )?.["url"] ?? "",
    };
  }

  // ============ 获取所有视频类别 ============
  async get_video_categories(
    region_code: string = "US"
  ): Promise<Record<string, unknown>[]> {
    /**
     * 获取指定地区的视频类别
     */
    try {
      const response = await this.youtube.videoCategories.list({
        part: ["snippet"],
        regionCode: region_code,
      });

      const categories: Record<string, unknown>[] = [];
      for (const item of response.data.items ?? []) {
        categories.push({
          id: item.id,
          name: item.snippet?.title,
          assignable: item.snippet?.assignable,
        });
      }

      return categories;
    } catch (e) {
      console.log(`获取类别失败: ${e}`);
      return [];
    }
  }
}

async function main(): Promise<void> {
  // 主函数：演示各种获取热门视频的方法
  console.log("=".repeat(80));
  console.log("YouTube热门视频获取器");
  console.log("=".repeat(80));

  // 初始化（如果需要代理）
  const collector = new YouTubeHotVideos(API_KEY, "127.0.0.1", 7890);

  // ============ 方法1: 获取美国地区热门视频 ============
  console.log("\n1️⃣ 美国地区热门视频 (Top 10):");
  console.log("-".repeat(60));

  const us_hot = await collector.get_most_popular_videos(10, "US");

  for (let i = 0; i < us_hot.length; i++) {
    const video = us_hot[i];
    console.log(`\n${i + 1}. ${video["title"]}`);
    console.log(`   频道: ${video["channel"]}`);
    console.log(`   观看: ${Number(video["view_count"]).toLocaleString()}`);
    console.log(`   点赞: ${Number(video["like_count"]).toLocaleString()}`);
    console.log(`   类别: ${video["category_name"]}`);
    console.log(`   时长: ${video["duration_str"]}`);
  }

  // ============ 方法2: 获取日本地区热门视频 ============
  console.log("\n\n2️⃣ 日本地区热门视频:");
  console.log("-".repeat(60));

  const jp_hot = await collector.get_most_popular_videos(5, "JP");

  for (let i = 0; i < jp_hot.length; i++) {
    const video = jp_hot[i];
    console.log(`\n${i + 1}. ${video["title"]}`);
    console.log(`   频道: ${video["channel"]}`);
    console.log(`   观看: ${Number(video["view_count"]).toLocaleString()}`);
  }

  // ============ 方法3: 按类别获取热门 ============
  console.log("\n\n3️⃣ 音乐类别热门视频:");
  console.log("-".repeat(60));

  const music_hot = await collector.get_popular_by_category(10, "US", 5);

  for (let i = 0; i < music_hot.length; i++) {
    const video = music_hot[i];
    console.log(`\n${i + 1}. ${video["title"]}`);
    console.log(`   频道: ${video["channel"]}`);
    console.log(`   观看: ${Number(video["view_count"]).toLocaleString()}`);
  }

  // ============ 方法4: 搜索本周热门 ============
  console.log("\n\n4️⃣ 本周热门视频（按观看量排序）:");
  console.log("-".repeat(60));

  // 计算时间范围（最近7天）
  const week_ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const weekly_hot = await collector.search_hot_videos_by_time(
    null, // 不限制关键词
    week_ago,
    null,
    5,
    "viewCount" // 按观看量排序
  );

  for (let i = 0; i < weekly_hot.length; i++) {
    const video = weekly_hot[i];
    console.log(`\n${i + 1}. ${video["title"]}`);
    console.log(`   频道: ${video["channel"]}`);
    console.log(`   观看: ${Number(video["view_count"]).toLocaleString()}`);
    console.log(`   发布时间: ${String(video["published_at"]).slice(0, 10)}`);
  }

  // ============ 方法5: 自定义趋势视频 ============
  console.log("\n\n5️⃣ 趋势视频分析（自定义算法）:");
  console.log("-".repeat(60));

  const trending = await collector.get_trending_videos(
    "US",
    null,
    3,    // 最近3天发布的视频
    50000, // 最低5万观看
    5
  );

  for (let i = 0; i < trending.length; i++) {
    const video = trending[i];
    console.log(`\n${i + 1}. ${video["title"]}`);
    console.log(`   频道: ${video["channel"]}`);
    console.log(`   观看: ${Number(video["view_count"]).toLocaleString()}`);
    console.log(`   点赞: ${Number(video["like_count"]).toLocaleString()}`);
    console.log(`   趋势分: ${Math.round(video["trend_score"] as number)}`);
  }

  // ============ 保存数据到CSV ============
  console.log("\n\n💾 保存数据到CSV...");

  // 合并所有视频
  const all_videos = [
    ...us_hot,
    ...jp_hot,
    ...music_hot,
    ...weekly_hot,
    ...trending,
  ];

  if (all_videos.length) {
    const headers = Object.keys(all_videos[0]).join(",");
    const csvRows = all_videos.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = "\uFEFF" + [headers, ...csvRows].join("\n");

    const timestamp = new Date()
      .toISOString()
      .replace(/[:\-T]/g, "")
      .slice(0, 15);
    const filename = `youtube_hot_videos_${timestamp}.csv`;
    require("fs").writeFileSync(filename, csv, "utf8");
    console.log(`✅ 已保存 ${all_videos.length} 个视频到: ${filename}`);

    // 显示统计信息
    const total_views = all_videos.reduce(
      (sum, v) => sum + (v["view_count"] as number),
      0
    );
    const avg_views = total_views / all_videos.length;
    const avg_likes =
      all_videos.reduce((sum, v) => sum + (v["like_count"] as number), 0) /
      all_videos.length;

    console.log(`\n📊 统计信息:`);
    console.log(`总视频数: ${all_videos.length}`);
    console.log(`总观看量: ${total_views.toLocaleString()}`);
    console.log(`平均观看: ${Math.round(avg_views).toLocaleString()}`);
    console.log(`平均点赞: ${Math.round(avg_likes).toLocaleString()}`);

    // 按类别统计
    console.log(`\n📈 按类别统计:`);
    const category_stats: Record<string, number> = {};
    for (const v of all_videos) {
      const cat = v["category_name"] as string;
      category_stats[cat] = (category_stats[cat] ?? 0) + 1;
    }
    const sorted = Object.entries(category_stats).sort((a, b) => b[1] - a[1]);
    for (const [category, count] of sorted) {
      console.log(`  ${category}: ${count}个视频`);
    }
  }
}

if (require.main === module) {
  main();
}
