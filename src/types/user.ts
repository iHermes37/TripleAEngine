// 对应 app/schemas/user.py

export interface RedditComment {
  created_utc: number;
  body: string; // min_length=1
  score: number;
  replies?: RedditComment[];
}

// 对应 @property created_datetime
export function getCreatedDatetime(comment: RedditComment): Date {
  return new Date(comment.created_utc * 1000);
}

export interface RedditPost {
  id: string;
  title: string; // min_length=1
  created_utc: number;
  selftext: string; // default=""
  comments: RedditComment[]; // default=[]
}

// 对应 @property created_datetime
export function getPostCreatedDatetime(post: RedditPost): Date {
  return new Date(post.created_utc * 1000);
}
