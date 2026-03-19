import Snoowrap from "snoowrap";
import * as fs from "fs";
import * as path from "path";
import { RedditComment, RedditPost, getCreatedDatetime, getPostCreatedDatetime } from "../../types/user";
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// 配置代理
const PROXY_URL = process.env.PROXY_URL || 'http://127.0.0.1:7890';
const httpsAgent = new HttpsProxyAgent(PROXY_URL);

// 创建支持代理的 axios 实例
const proxyAxios = axios.create({
  httpsAgent,
  proxy: false, // 禁用内置代理，使用 agent
  timeout: 60000 // 30秒超时
});


export class rebbitClient {
  private reddit: Snoowrap;


  constructor() {

    // 设置全局代理
    const proxyUrl = process.env.PROXY_URL || 'http://127.0.0.1:7890';
    console.log('使用代理:', proxyUrl);
    
    // 方法1：设置环境变量（最可靠）
    process.env.HTTPS_PROXY = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    process.env.ALL_PROXY = proxyUrl;


    this.reddit = new Snoowrap({
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      userAgent: process.env.REDDIT_USER_AGENT!,
      username: process.env.REDDIT_USERNAME!,
      password: process.env.REDDIT_PASSWORD!,
    });

        // 覆盖 snoowrap 的请求方法，使用代理
    (this.reddit as any).request = async (options: any) => {
      try {
        console.log(`🌐 请求: ${options.method} ${options.url}`);
        
        const response = await proxyAxios({
          method: options.method,
          url: options.url,
          headers: options.headers,
          data: options.body,
          timeout: 30000
        });

        return {
          status: response.status,
          body: response.data,
          headers: response.headers
        };
      } catch (error: any) {
        console.error(`❌ 请求失败:`, error.message);
        throw error;
      }
    };


  }

  async search_in_subreddit(
    keyword: string,
    subreddit_name: string,
    limit: number = 1
  ): Promise<Record<string, unknown>[]> {
    /**
     * 在特定subreddit中搜索帖子
     */
    try {
      console.log(`在 r/${subreddit_name} 中搜索 '${keyword}'...`);
      const subreddit = this.reddit.getSubreddit(subreddit_name);
      const searchListing = await this.reddit.getSubreddit(subreddit_name).search({
        query: keyword,
        sort: "relevance"
      });

      const results = await searchListing.fetchMore({ 
        amount: limit 
      });

      const posts: Record<string, unknown>[] = [];
      for (const post of results) {
        const post_data = {
          title: post.title,
          score: post.score,
          id: post.id,
          url: post.url,
          num_comments: post.num_comments,
          created_utc: new Date(post.created_utc * 1000),
          subreddit: post.subreddit_name_prefixed,
          author: post.author ? post.author.name : "[deleted]",
          selftext:
            post.selftext.length > 200
              ? post.selftext.slice(0, 200) + "..."
              : post.selftext,
          permalink: `https://reddit.com${post.permalink}`,
        };
        posts.push(post_data);
      }

      return posts;
    } catch (e) {
      console.log(`搜索时出错: ${e}`);
      return [];
    }
  }

  async get_all_comments(
  post_id: string,
  limit: number = 1
): Promise<RedditComment[]> {
  try {
    console.log(`获取帖子 ${post_id} 的评论...`);
    const submissionPromise: any = this.reddit.getSubmission(post_id);
    const submission = await submissionPromise.fetch();
    
    // 获取评论
    await submission.comments.fetchMore({ amount: limit });

    const comments: RedditComment[] = [];

    // 递归函数：把所有评论（包括嵌套的）都放到 comments 数组里
    const extractAllComments = (commentList: any) => {
      // 如果没数据就返回
      if (!commentList) return;
      
      // 确保是数组
      if (!Array.isArray(commentList)) return;

      for (const item of commentList) {
        // 跳过 "加载更多" 的占位符
        if (item.count !== undefined) continue;
        
        // 获取评论数据
        const comment = item.data || item;
        
        // 如果是有效评论
        if (comment.body) {
          // 加到结果数组
          comments.push({
            body: comment.body,
            score: comment.score || 0,
            created_utc: comment.created_utc || 0,
          });

          // 如果有回复，递归处理
          if (comment.replies) {
            // replies 可能是数组，也可能是对象
            if (Array.isArray(comment.replies)) {
              extractAllComments(comment.replies);
            } else if (comment.replies.data?.children) {
              extractAllComments(comment.replies.data.children);
            }
          }
        }
      }
    };

    // 开始提取所有评论
    extractAllComments(submission.comments);
    
    console.log(`✅ 共提取到 ${comments.length} 条评论`);
    return comments;

  } catch (e: any) {
    console.error(`❌ 获取评论失败:`, e.message);
    return [];
  }
}
  

  async get_post(post_id: string): Promise<RedditPost> {
    if (!post_id) {
      throw new Error("post_id 不能为空");
    }

    const submissionPromise: any = this.reddit.getSubmission(post_id);
    const submission = await submissionPromise.fetch();

    console.log(`获取帖子 ${post_id}...`);  

    const post: RedditPost = {
      id: post_id,
      title: submission.title,
      created_utc: submission.created_utc,
      selftext: submission.selftext,
      comments: [],
    };

    try {
      const comments = await this.get_all_comments(post_id);
      post.comments = comments;
    } catch (e) {
      console.log(`获取评论时出错: ${e}`);
    }

    return post;
  }

  async get_post_ids(
    question: string,
    limit: number = 1
  ): Promise<string[]> {
    if (!question) {
      throw new Error("no question");
    }

    const post_ids: string[] = [];

    try {
      console.log(`\n🔍 搜索 Reddit: "${question}"`);
      
      // 添加延迟避免限流
      await new Promise(resolve => setTimeout(resolve, 2000));

      const searchListing = await this.reddit.getSubreddit("all").search({
        query: question,
        sort: "relevance"
      });

      const search_results = await searchListing.fetchMore({ 
        amount: limit 
      });

      // 手动截取前 limit 条
      const limited_results = search_results.slice(0, limit);

      console.log(`✅ 找到 ${limited_results.length} 个帖子:`);
      
      for (const submission of limited_results) {
        post_ids.push(submission.id);
        console.log(`  - ${submission.title?.slice(0, 60)}`);
        console.log(`    r/${submission.subreddit_name_prefixed} | 👍 ${submission.score} | 💬 ${submission.num_comments}`);
      }

    } catch (e: any) {
      console.error(`❌ 搜索时出错:`, e.message);
      console.error(`❌ 搜索时出错:`);
    
    // 详细打印 AggregateError
    if (e.name === 'AggregateError') {
      console.error('这是一个聚合错误，包含多个子错误:');
      if (e.errors) {
        e.errors.forEach((err: any, index: number) => {
          console.error(`\n--- 错误 ${index + 1} ---`);
          console.error('消息:', err.message);
          console.error('状态码:', err.statusCode);
          console.error('状态信息:', err.statusMessage);
          console.error('URL:', err.options?.url);
          console.error('方法:', err.options?.method);
          if (err.response) {
            console.error('响应数据:', err.response.body);
          }
        });
      }
    } else {
      console.error('错误名称:', e.name);
      console.error('错误消息:', e.message);
      console.error('状态码:', e.statusCode);
      console.error('完整错误:', e);
    }
  }

  return post_ids;
}

  async save_posts_with_comments_json(
    posts: RedditPost[],
    filename: string
  ): Promise<string> {
    /**
     * 保存帖子和评论到同一个CSV文件（使用JSON字段存储评论列表）
     */
    if (!posts || posts.length === 0) {
      console.log("没有数据可保存");
      return  '';
    }

    const rows = [];
    for (const post of posts) {
      // 将评论转换为可JSON序列化的格式
      const comments_list = [];
      for (const comment of post.comments) {
        comments_list.push({
          body: comment.body,
          score: comment.score,
          created_datetime: getCreatedDatetime(comment)
            .toISOString()
            .replace("T", " ")
            .slice(0, 19),
        });
      }

      rows.push({
        post_id: post.id,
        post_title: post.title,
        post_created_datetime: getPostCreatedDatetime(post)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
        post_selftext: post.selftext,
        // 使用JSON格式存储完整评论列表
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

    // CSV序列化
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers, ...csvRows].join("\n");

    fs.writeFileSync(filepath, "\uFEFF" + csv, "utf8"); // utf-8-sig
    console.log(`已保存 ${posts.length} 个帖子到: ${filepath}`);
    console.log(`提示：'comments_json'字段包含完整的评论列表JSON`);

    return filepath;
  }
}
