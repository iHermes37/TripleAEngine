import requests
import pandas as pd
from datetime import datetime
import time
import os

# ==================== 配置区域 ====================
API_KEY = 'AIzaSyBaZWu2nCKhhNB_FhYGX5P1XWSzAYX4mOM'
VIDEO_URL = 'https://youtu.be/uQJF5fcjFbg?si=VW-O19wOfYYnDORy---'
VIDEO_ID = 'uQJF5fcjFbg'  # 从分享链接中提取

# 代理设置（根据你的代理软件修改）
PROXY = 'http://127.0.0.1:7890'  # 你的Clash端口
# =================================================

proxies = {
    'http': PROXY,
    'https': PROXY
}


class YouTubeCommentCollector:
    """使用requests的YouTube评论采集器"""

    def __init__(self, api_key, proxies=None):
        self.api_key = api_key
        self.proxies = proxies
        self.base_url = "https://www.googleapis.com/youtube/v3"
        self.request_count = 0

    def _make_request(self, url, params):
        """发送带代理的请求"""
        try:
            response = requests.get(
                url,
                params=params,
                proxies=self.proxies,
                timeout=30
            )
            self.request_count += 1
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ProxyError as e:
            print(f"❌ 代理错误: {e}")
            print(f"   请确认代理 {PROXY} 是否可用")
            return None
        except requests.exceptions.ConnectionError as e:
            print(f"❌ 连接错误: {e}")
            return None
        except requests.exceptions.Timeout:
            print("❌ 请求超时")
            return None
        except Exception as e:
            print(f"❌ 请求失败: {e}")
            return None

    def get_video_info(self, video_id):
        """获取视频信息"""
        url = f"{self.base_url}/videos"
        params = {
            'part': 'snippet,statistics',
            'id': video_id,
            'key': self.api_key
        }

        data = self._make_request(url, params)
        if not data or 'items' not in data or not data['items']:
            print("❌ 未找到视频信息")
            return None

        item = data['items'][0]
        snippet = item['snippet']
        stats = item['statistics']

        return {
            'title': snippet['title'],
            'channel': snippet['channelTitle'],
            'published_at': snippet['publishedAt'],
            'view_count': int(stats.get('viewCount', 0)),
            'like_count': int(stats.get('likeCount', 0)),
            'comment_count': int(stats.get('commentCount', 0))
        }

    def get_video_comments(self, video_id, max_comments=500):
        """获取评论（包括回复）"""
        comments = []
        next_page_token = None

        while len(comments) < max_comments:
            url = f"{self.base_url}/commentThreads"
            params = {
                'part': 'snippet,replies',
                'videoId': video_id,
                'maxResults': min(100, max_comments - len(comments)),
                'key': self.api_key,
                'order': 'relevance'
            }
            if next_page_token:
                params['pageToken'] = next_page_token

            data = self._make_request(url, params)
            if not data or 'items' not in data:
                break

            for item in data['items']:
                if len(comments) >= max_comments:
                    break

                # 主评论
                top_comment = item['snippet']['topLevelComment']['snippet']
                comments.append({
                    'comment_id': item['id'],
                    'author': top_comment['authorDisplayName'],
                    'text': top_comment['textDisplay'],
                    'like_count': top_comment['likeCount'],
                    'published_at': top_comment['publishedAt'],
                    'reply_count': item['snippet']['totalReplyCount'],
                    'is_reply': False,
                    'parent_id': None
                })

                # 处理回复
                if 'replies' in item:
                    for reply in item['replies']['comments']:
                        if len(comments) >= max_comments:
                            break
                        reply_snippet = reply['snippet']
                        comments.append({
                            'comment_id': reply['id'],
                            'author': reply_snippet['authorDisplayName'],
                            'text': reply_snippet['textDisplay'],
                            'like_count': reply_snippet['likeCount'],
                            'published_at': reply_snippet['publishedAt'],
                            'reply_count': 0,
                            'is_reply': True,
                            'parent_id': item['id']
                        })

            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break

            time.sleep(0.5)  # 礼貌性延迟

        return comments[:max_comments]

    def save_to_csv(self, comments, video_info, filename_prefix='youtube_comments'):
        """保存数据"""
        if not comments:
            print("没有评论可保存")
            return

        df = pd.DataFrame(comments)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # 保存评论
        comments_file = f"{filename_prefix}_comments_{timestamp}.csv"
        df.to_csv(comments_file, index=False, encoding='utf-8-sig')
        print(f"✅ 已保存 {len(comments)} 条评论到: {comments_file}")

        # 保存视频信息
        if video_info:
            info_file = f"{filename_prefix}_info_{timestamp}.csv"
            pd.DataFrame([video_info]).to_csv(info_file, index=False, encoding='utf-8-sig')
            print(f"✅ 已保存视频信息到: {info_file}")

        return comments_file


def test_proxy():
    """测试代理是否可用"""
    print(f"\n🔍 测试代理 {PROXY}...")
    try:
        r = requests.get(
            'https://www.googleapis.com/youtube/v3/videos?part=id&id=uQJF5fcjFbg',
            proxies=proxies,
            timeout=10
        )
        print(f"✅ 代理工作正常 (状态码: {r.status_code})")
        return True
    except Exception as e:
        print(f"❌ 代理测试失败: {e}")
        return False


def main():
    print("=" * 60)
    print("YouTube评论采集器 (requests版)")
    print("=" * 60)

    # 1. 测试代理
    if not test_proxy():
        print("\n⚠️  代理测试失败，请检查：")
        print("   1. 代理软件是否开启")
        print("   2. 代理端口是否为 7890")
        print("   3. 尝试关闭代理直接运行（如果网络直连可用）")
        return

    # 2. 初始化采集器
    collector = YouTubeCommentCollector(API_KEY, proxies=proxies)

    # 3. 获取视频信息
    print(f"\n📹 获取视频信息...")
    video_info = collector.get_video_info(VIDEO_ID)

    if not video_info:
        print("❌ 无法获取视频信息")
        return

    print(f"\n📊 视频信息:")
    print(f"标题: {video_info['title']}")
    print(f"频道: {video_info['channel']}")
    print(f"发布时间: {video_info['published_at']}")
    print(f"观看次数: {video_info['view_count']:,}")
    print(f"点赞数: {video_info['like_count']:,}")
    print(f"评论数: {video_info['comment_count']:,}")

    # 4. 获取评论
    print(f"\n💬 获取评论...")
    max_comments = min(500, video_info['comment_count'])
    print(f"目标获取: {max_comments} 条")

    comments = collector.get_video_comments(VIDEO_ID, max_comments)

    if comments:
        # 统计
        main_c = [c for c in comments if not c['is_reply']]
        replies = [c for c in comments if c['is_reply']]

        print(f"\n📈 统计:")
        print(f"总获取: {len(comments)} 条")
        print(f"主评论: {len(main_c)} 条")
        print(f"回复: {len(replies)} 条")
        print(f"API请求: {collector.request_count} 次")

        # 保存
        collector.save_to_csv(comments, video_info, f"iran_economy_{VIDEO_ID}")

        # 显示示例
        print("\n📝 前3条热门评论:")
        for i, c in enumerate(sorted(comments, key=lambda x: -x['like_count'])[:3]):
            print(f"\n{i + 1}. {c['author']} (👍 {c['like_count']})")
            print(f"   {c['text'][:150]}...")
    else:
        print("❌ 未获取到评论")
        print("\n可能原因:")
        print("- 视频关闭了评论")
        print("- API配额用完")
        print("- 需要登录才能查看")


if __name__ == "__main__":
    main()