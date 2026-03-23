import * as fs from "fs";
import * as path from "path";
import { RedditComment, RedditPost, getCreatedDatetime, getPostCreatedDatetime } from "../../types/user";
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const PROXY_URL = process.env.PROXY_URL || 'http://127.0.0.1:7890';
const httpsAgent = new HttpsProxyAgent(PROXY_URL);

const proxyAxios = axios.create({
  httpsAgent,
  proxy: false,
  timeout: 30000,
  headers: {
    'User-Agent': process.env.REDDIT_USER_AGENT || 'nodejs:sentiment-analysis:v1.0.0 (by /u/user)',
    'Accept': 'application/json',
  }
});

export class rebbitClient {

  constructor() {
    console.log('🌐 使用代理:', PROXY_URL);
    console.log('✅ Reddit 客户端初始化成功（JSON API 模式）');
  }

  // ─── 核心：搜索帖子 ID ────────────────────────────────────────────────────

  async get_post_ids(
    question: string,
    limit: number = 1
  ): Promise<string[]> {
    if (!question) throw new Error("no question");
    question = question.trim();

    const post_ids: string[] = [];

    try {
      console.log(`\n🔍 搜索 Reddit: "${question}"`);

      const url = `https://www.reddit.com/search.json`;
      const response = await proxyAxios.get(url, {
        params: {
          q: question,
          sort: 'relevance',
          limit: Math.min(limit, 100),
          raw_json: 1,
        }
      });

      const posts = response.data?.data?.children ?? [];
      const limited = posts.slice(0, limit);

      console.log(`✅ 找到 ${limited.length} 个帖子:`);

      for (const item of limited) {
        const p = item.data;
        post_ids.push(p.id);
        console.log(`  - ${p.title?.slice(0, 60)}`);
        console.log(`    r/${p.subreddit_name_prefixed} | 👍 ${p.score} | 💬 ${p.num_comments}`);
      }

    } catch (e: any) {
      console.error(`❌ 搜索时出错:`, e.message);
    }

    return post_ids;
  }

  // ─── 在指定 subreddit 中搜索 ─────────────────────────────────────────────

  async search_in_subreddit(
    keyword: string,
    subreddit_name: string,
    limit: number = 1
  ): Promise<Record<string, unknown>[]> {
    keyword = keyword.trim();

    try {
      console.log(`在 r/${subreddit_name} 中搜索 '${keyword}'...`);

      const url = `https://www.reddit.com/r/${subreddit_name}/search.json`;
      const response = await proxyAxios.get(url, {
        params: {
          q: keyword,
          sort: 'relevance',
          restrict_sr: true,
          limit: Math.min(limit, 100),
          raw_json: 1,
        }
      });

      const posts = response.data?.data?.children ?? [];

      return posts.slice(0, limit).map((item: any) => {
        const p = item.data;
        return {
          title: p.title,
          score: p.score,
          id: p.id,
          url: p.url,
          num_comments: p.num_comments,
          created_utc: new Date(p.created_utc * 1000),
          subreddit: p.subreddit_name_prefixed,
          author: p.author ?? '[deleted]',
          selftext: p.selftext?.length > 200
            ? p.selftext.slice(0, 200) + '...'
            : (p.selftext ?? ''),
          permalink: `https://reddit.com${p.permalink}`,
        };
      });

    } catch (e: any) {
      console.log(`搜索时出错: ${e.message}`);
      return [];
    }
  }

  // ─── 获取帖子的所有评论 ───────────────────────────────────────────────────

  async get_all_comments(
    post_id: string,
    limit: number = 100
  ): Promise<RedditComment[]> {
    try {
      console.log(`获取帖子 ${post_id} 的评论...`);

      const url = `https://www.reddit.com/comments/${post_id}.json`;
      const response = await proxyAxios.get(url, {
        params: { limit, raw_json: 1 }
      });

      // response.data 是一个数组：[帖子信息, 评论列表]
      const commentData = response.data?.[1]?.data?.children ?? [];
      const comments: RedditComment[] = [];

      const extract = (children: any[]) => {
        for (const item of children) {
          if (item.kind === 'more') continue;
          const c = item.data;
          if (c?.body) {
            comments.push({
              body: c.body,
              score: c.score ?? 0,
              created_utc: c.created_utc ?? 0,
            });
            // 递归处理嵌套回复
            if (c.replies?.data?.children?.length) {
              extract(c.replies.data.children);
            }
          }
        }
      };

      extract(commentData);
      console.log(`✅ 共提取到 ${comments.length} 条评论`);
      return comments;

    } catch (e: any) {
      console.error(`❌ 获取评论失败:`, e.message);
      return [];
    }
  }

  // ─── 获取单个帖子（含评论）────────────────────────────────────────────────

  async get_post(post_id: string): Promise<RedditPost> {
    if (!post_id) throw new Error("post_id 不能为空");

    console.log(`获取帖子 ${post_id}...`);

    const url = `https://www.reddit.com/comments/${post_id}.json`;
    const response = await proxyAxios.get(url, {
      params: { raw_json: 1 }
    });

    const postData = response.data?.[0]?.data?.children?.[0]?.data;

    const post: RedditPost = {
      id: post_id,
      title: postData?.title ?? '',
      created_utc: postData?.created_utc ?? 0,
      selftext: postData?.selftext ?? '',
      comments: [],
    };

    try {
      post.comments = await this.get_all_comments(post_id);
    } catch (e) {
      console.log(`获取评论时出错: ${e}`);
    }

    return post;
  }

  // ─── 保存到 CSV ───────────────────────────────────────────────────────────

  async save_posts_with_comments_json(
    posts: RedditPost[],
    filename: string
  ): Promise<string> {
    if (!posts || posts.length === 0) {
      console.log("没有数据可保存");
      return '';
    }

    const rows = [];
    for (const post of posts) {
      const comments_list = post.comments.map(comment => ({
        body: comment.body,
        score: comment.score,
        created_datetime: getCreatedDatetime(comment)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
      }));

      rows.push({
        post_id: post.id,
        post_title: post.title,
        post_created_datetime: getPostCreatedDatetime(post)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
        post_selftext: post.selftext,
        comments_json: JSON.stringify(comments_list),
      });
    }

    const save_dir = "reddit_data";
    fs.mkdirSync(save_dir, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:\-T]/g, "")
      .slice(0, 15);
    const filepath = path.join(save_dir, `${filename}_json_${timestamp}.csv`);

    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map(row =>
      Object.values(row)
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers, ...csvRows].join("\n");

    fs.writeFileSync(filepath, "\uFEFF" + csv, "utf8");
    console.log(`已保存 ${posts.length} 个帖子到: ${filepath}`);
    console.log(`提示：'comments_json'字段包含完整的评论列表JSON`);

    return filepath;
  }
}