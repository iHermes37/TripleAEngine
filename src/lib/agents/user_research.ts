// 对应 app/service/insights/team/user_research.py

import { rebbitClient } from "../media/reddit";
import { RedditPost } from "../../types/user";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from 'fs';
import csv from 'csv-parser';


async function analyzeWithLLM(commentsText: string): Promise<string> {
  // 这里调用您之前设置的大模型
  const model = new ChatOpenAI({
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    temperature: 0.1,
    configuration: {
      baseURL: process.env.DEEPSEEK_API_BASE!,
      apiKey: process.env.DEEPSEEK_API_KEY!,
    },
  });
  
  const prompt = `请分析以下用户评论，总结用户对产品的看法、痛点、需求和改进建议：
  ${commentsText}
  请从以下角度分析：
  1. 用户主要关注的方面（价格、质量、舒适度等）
  2. 正面评价
  3. 负面评价和痛点
  4. 改进建议
  5. 用户画像分析`;

    const response = await model.invoke(prompt);
    return String(response.content);
}


export async function collect_comments(question: string): Promise<RedditPost[]> {
  const client = new rebbitClient();
  const ids = await client.get_post_ids(question);

  console.log(ids);
  
  const posts: RedditPost[] = [];
  for (const id of ids) {
    const redditpost = await new rebbitClient().get_post(id);
    posts.push(redditpost);
  }
  return posts;
}

// 简化版：只提取评论文本
async function extractCommentBodiesAsString(csvFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let commentBodies: string[] = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.comments_json) {
          try {
            const comments = JSON.parse(row.comments_json);
            comments.forEach((comment: any) => {
              if (comment.body) {
                commentBodies.push(comment.body);
              }
            });
          } catch (error) {
            // 忽略解析错误
          }
        }
      })
      .on('end', () => {
        // 合并所有评论文本
        const result = commentBodies.join('\n\n---\n\n');
        console.log(`共提取 ${commentBodies.length} 条评论文本`);
        resolve(result);
      })
      .on('error', reject);
  });
}

export async function save(): Promise<void> {
  const posts = await collect_comments("shoes");
  const filepath=await new rebbitClient().save_posts_with_comments_json(posts, "shoes");
  const commentsText = await extractCommentBodiesAsString(filepath);

  const analysis = await analyzeWithLLM(commentsText);
  console.log("分析结果:", analysis);
}

save();
