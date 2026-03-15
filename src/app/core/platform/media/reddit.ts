// 对应 app/core/platform/media/reddit.py

import Snoowrap from "snoowrap";
import * as fs from "fs";
import * as path from "path";
import { RedditComment, RedditPost, getCreatedDatetime, getPostCreatedDatetime } from "@/app/schemas/user";

export class rebbitClient {
  private reddit: Snoowrap;

  constructor() {
    this.reddit = new Snoowrap({
      clientId: "AVTpZ5kVrjWo67D848ghWw",
      clientSecret: "DJ4Aylrklhbq-2XCA-iqOfz-EnSwdA",
      userAgent: "sentiment analysis by /u/Party_Tank_2416",
      accessToken: "", // snoowrap requires accessToken or username/password
    });
  }

  async search_in_subreddit(
    keyword: string,
    subreddit_name: string,
    limit: number = 10
  ): Promise<Record<string, unknown>[]> {
    /**
     * 在特定subreddit中搜索帖子
     */
    try {
      console.log(`在 r/${subreddit_name} 中搜索 '${keyword}'...`);
      const subreddit = this.reddit.getSubreddit(subreddit_name);
      const results = await subreddit.search({
        query: keyword,
        limit,
        time: "all", // time_filter可以是'all', 'day', 'week', 'month', 'year'
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
    /**
     * 获取帖子的所有评论（包括嵌套评论）
     */
    try {
      const submission = await this.reddit.getSubmission(post_id).fetch();
      // limit=None表示获取所有评论
      const commentList = await submission.comments.fetchMore({ amount: limit });

      const comments: RedditComment[] = [];

      function extract_comments(comment_list: Snoowrap.Listing<Snoowrap.Comment | Snoowrap.MoreComments>, depth: number = 0): void {
        for (const comment of comment_list) {
          if ("body" in comment) {
            const comment_data: RedditComment = {
              body: (comment as Snoowrap.Comment).body,
              score: (comment as Snoowrap.Comment).score,
              created_utc: (comment as Snoowrap.Comment).created_utc,
            };
            comments.push(comment_data);

            // 递归获取回复
            if ("replies" in comment && (comment as Snoowrap.Comment).replies) {
              extract_comments((comment as Snoowrap.Comment).replies as unknown as Snoowrap.Listing<Snoowrap.Comment | Snoowrap.MoreComments>, depth + 1);
            }
          }
        }
      }

      extract_comments(commentList as unknown as Snoowrap.Listing<Snoowrap.Comment | Snoowrap.MoreComments>);
      return comments;
    } catch (e) {
      console.log(`获取评论时出错: ${e}`);
      return [];
    }
  }

  async get_post(post_id: string): Promise<RedditPost> {
    if (!post_id) {
      throw new Error("post_id 不能为空");
    }

    const submission = await this.reddit.getSubmission(post_id).fetch();

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
      const search_results = await this.reddit.getSubreddit("all").search({
        query: question,
        limit,
        sort: "relevance", // 按相关度排序
      });

      for (const submission of search_results) {
        post_ids.push(submission.id);
        console.log(`找到帖子: ${submission.title.slice(0, 50)}... (r/${submission.subreddit_name_prefixed})`);
      }
    } catch (e) {
      console.log(`搜索时出错: ${e}`);
    }

    return post_ids;
  }

  async save_posts_with_comments_json(
    posts: RedditPost[],
    filename: string
  ): Promise<string | null> {
    /**
     * 保存帖子和评论到同一个CSV文件（使用JSON字段存储评论列表）
     */
    if (!posts || posts.length === 0) {
      console.log("没有数据可保存");
      return null;
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
