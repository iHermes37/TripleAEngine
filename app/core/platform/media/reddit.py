import os
from datetime import datetime

import pandas as pd
import praw


class rebbitClient:
    def __init__(self):
        self.reddit = praw.praw.Reddit(
            client_id='AVTpZ5kVrjWo67D848ghWw',
            client_secret='DJ4Aylrklhbq-2XCA-iqOfz-EnSwdA',
            user_agent='sentiment analysis by /u/Party_Tank_2416'
        )

    def search_in_subreddit(self,keyword, subreddit_name, limit=10):
        """
        在特定subreddit中搜索帖子
        """
        try:
            print(f"在 r/{subreddit_name} 中搜索 '{keyword}'...")
            subreddit = self.reddit.subreddit(subreddit_name)
            results = subreddit.search(keyword, limit=limit,
                                       time_filter='all')  # time_filter可以是'all', 'day', 'week', 'month', 'year'

            posts = []
            for post in results:
                post_data = {
                    'title': post.title,
                    'score': post.score,
                    'id': post.id,
                    'url': post.url,
                    'num_comments': post.num_comments,
                    'created_utc': datetime.fromtimestamp(post.created_utc),
                    'subreddit': post.subreddit.display_name,
                    'author': str(post.author) if post.author else '[deleted]',
                    'selftext': post.selftext[:200] + '...' if len(post.selftext) > 200 else post.selftext,
                    'permalink': f"https://reddit.com{post.permalink}"
                }
                posts.append(post_data)

            return posts
        except Exception as e:
            print(f"搜索时出错: {e}")
            return []

    def get_all_comments(self,post_id, post_title, limit=None):
        """
        获取帖子的所有评论（包括嵌套评论）
        """
        try:
            submission = self.reddit.submission(id=post_id)
            submission.comments.replace_more(limit=limit)  # limit=None表示获取所有评论

            comments = []

            def extract_comments(comment_list, depth=0):
                for comment in comment_list:
                    if isinstance(comment, praw.models.MoreComments):
                        continue

                    if hasattr(comment, 'body'):
                        comment_data = {
                            'post_id': post_id,
                            'post_title': post_title,
                            'comment_id': comment.id,
                            'body': comment.body,
                            'score': comment.score,
                            'author': str(comment.author) if comment.author else '[deleted]',
                            'created_utc': datetime.fromtimestamp(comment.created_utc),
                            'depth': depth,  # 评论嵌套深度
                            'parent_id': comment.parent_id.split('_')[1] if comment.parent_id else None,
                            'permalink': f"https://reddit.com{comment.permalink}"
                        }
                        comments.append(comment_data)

                        # 递归获取回复
                        if hasattr(comment, 'replies'):
                            extract_comments(comment.replies, depth + 1)

            extract_comments(submission.comments)
            return comments
        except Exception as e:
            print(f"获取评论时出错: {e}")
            return []

    def save_to_csv(data, filename):
            """
            保存数据到CSV文件
            """
            if not data:
                print("没有数据可保存")
                return None

            df = pd.DataFrame(data)

            # 创建保存目录
            save_dir = 'reddit_data'
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)

            # 生成文件名（包含时间戳）
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(save_dir, f"{filename}_{timestamp}.csv")

            # 保存CSV，处理中文编码
            df.to_csv(filepath, index=False, encoding='utf-8-sig')
            print(f"数据已保存到: {filepath}")
            print(f"共保存 {len(data)} 条记录")

            return filepath