// 对应 app/service/insights/team/user_research.py

import { rebbitClient } from "@/app/core/platform/media/reddit";
import { RedditPost } from "@/app/schemas/user";

export async function collect_comments(question: string): Promise<RedditPost[]> {
  const client = new rebbitClient();
  const ids = await client.get_post_ids(question);
  const posts: RedditPost[] = [];
  for (const id of ids) {
    const redditpost = await new rebbitClient().get_post(id);
    posts.push(redditpost);
  }
  return posts;
}

export async function save(): Promise<void> {
  const posts = await collect_comments("shoes");
  await new rebbitClient().save_posts_with_comments_json(posts, "shoes");
}

save();
