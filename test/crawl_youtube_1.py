import googleapiclient.discovery
import googleapiclient.errors
import pandas as pd
from datetime import datetime, timedelta
import isodate
import os

# 你的API密钥
API_KEY = 'AIzaSyBaZWu2nCKhhNB_FhYGX5P1XWSzAYX4mOM'


class YouTubeHotVideos:
    """YouTube热门视频获取器"""

    def __init__(self, api_key, proxy_host='127.0.0.1', proxy_port=7890):
        self.api_key = api_key
        self.proxy_host = proxy_host
        self.proxy_port = proxy_port

        # 设置代理（如果需要）
        if proxy_host and proxy_port:
            os.environ['HTTP_PROXY'] = f'http://{proxy_host}:{proxy_port}'
            os.environ['HTTPS_PROXY'] = f'http://{proxy_host}:{proxy_port}'

        # 构建YouTube服务
        self.youtube = googleapiclient.discovery.build(
            'youtube', 'v3',
            developerKey=self.api_key
        )

        # 视频类别映射（常见类别）
        self.video_categories = {
            '1': 'Film & Animation',
            '2': 'Autos & Vehicles',
            '10': 'Music',
            '15': 'Pets & Animals',
            '17': 'Sports',
            '18': 'Short Movies',
            '19': 'Travel & Events',
            '20': 'Gaming',
            '21': 'Videoblogging',
            '22': 'People & Blogs',
            '23': 'Comedy',
            '24': 'Entertainment',
            '25': 'News & Politics',
            '26': 'Howto & Style',
            '27': 'Education',
            '28': 'Science & Technology',
            '29': 'Nonprofits & Activism',
            '30': 'Movies',
            '31': 'Anime/Animation',
            '32': 'Action/Adventure',
            '33': 'Classics',
            '34': 'Comedy',
            '35': 'Documentary',
            '36': 'Drama',
            '37': 'Family',
            '38': 'Foreign',
            '39': 'Horror',
            '40': 'Sci-Fi/Fantasy',
            '41': 'Thriller',
            '42': 'Shorts',
            '43': 'Shows',
            '44': 'Trailers'
        }

    # ============ 方法1: 获取全球热门视频 ============
    def get_most_popular_videos(self, max_results=50, region_code='US'):
        """
        获取全球/地区热门视频

        Args:
            max_results: 返回结果数量 (1-50)
            region_code: 地区代码 (US, JP, KR, CN, TW, HK等)
        """
        try:
            request = self.youtube.videos().list(
                part='snippet,contentDetails,statistics',
                chart='mostPopular',  # 关键参数：热门视频
                regionCode=region_code,
                maxResults=max_results
            )
            response = request.execute()

            videos = []
            for item in response['items']:
                video = self._parse_video_item(item)
                videos.append(video)

            return videos

        except Exception as e:
            print(f"获取热门视频失败: {e}")
            return []

    # ============ 方法2: 按类别获取热门视频 ============
    def get_popular_by_category(self, category_id, region_code='US', max_results=50):
        """
        获取特定类别的热门视频
        """
        try:
            request = self.youtube.videos().list(
                part='snippet,contentDetails,statistics',
                chart='mostPopular',
                regionCode=region_code,
                videoCategoryId=str(category_id),
                maxResults=max_results
            )
            response = request.execute()

            videos = []
            for item in response['items']:
                video = self._parse_video_item(item)
                videos.append(video)

            return videos

        except Exception as e:
            print(f"获取类别{category_id}热门视频失败: {e}")
            return []

    # ============ 方法3: 按时间范围搜索热门 ============
    def search_hot_videos_by_time(self, query=None, published_after=None,
                                  published_before=None, max_results=50,
                                  order='viewCount'):
        """
        按时间范围搜索热门视频

        Args:
            query: 搜索关键词（可选）
            published_after: 发布时间起始
            published_before: 发布时间结束
            order: 排序方式 (viewCount, date, rating, relevance)
        """
        try:
            # 构建搜索请求
            search_request = self.youtube.search().list(
                part='snippet',
                q=query,
                type='video',
                order=order,
                publishedAfter=published_after,
                publishedBefore=published_before,
                maxResults=max_results
            )
            search_response = search_request.execute()

            # 获取视频详细信息
            video_ids = [item['id']['videoId'] for item in search_response['items']]

            if not video_ids:
                return []

            videos_request = self.youtube.videos().list(
                part='snippet,contentDetails,statistics',
                id=','.join(video_ids)
            )
            videos_response = videos_request.execute()

            videos = []
            for item in videos_response['items']:
                video = self._parse_video_item(item)
                videos.append(video)

            return videos

        except Exception as e:
            print(f"搜索热门视频失败: {e}")
            return []

    # ============ 方法4: 获取趋势视频（结合多个维度） ============
    def get_trending_videos(self, region_code='US', category_id=None,
                            days=7, min_views=100000, max_results=50):
        """
        获取趋势视频（自定义规则）

        结合观看量、点赞率、发布时间等多个维度判断趋势
        """
        try:
            # 计算时间范围
            published_after = (datetime.now() - timedelta(days=days)).isoformat() + 'Z'

            # 搜索视频
            search_request = self.youtube.search().list(
                part='snippet',
                type='video',
                regionCode=region_code,
                publishedAfter=published_after,
                maxResults=50,  # 先获取更多再筛选
                order='viewCount'  # 按观看量排序
            )

            if category_id:
                search_request.videoCategoryId = str(category_id)

            search_response = search_request.execute()

            # 获取视频详细信息
            video_ids = [item['id']['videoId'] for item in search_response['items']]

            if not video_ids:
                return []

            videos_request = self.youtube.videos().list(
                part='snippet,contentDetails,statistics',
                id=','.join(video_ids)
            )
            videos_response = videos_request.execute()

            # 计算趋势分数并排序
            trending_videos = []
            for item in videos_response['items']:
                stats = item['statistics']
                view_count = int(stats.get('viewCount', 0))
                like_count = int(stats.get('likeCount', 0))
                comment_count = int(stats.get('commentCount', 0))

                # 只保留超过最低观看量的视频
                if view_count < min_views:
                    continue

                # 计算趋势分数
                # 公式: (观看量 * 0.4 + 点赞数 * 0.4 + 评论数 * 0.2) / 视频存在天数
                published_at = item['snippet']['publishedAt']
                days_old = (datetime.now() - datetime.fromisoformat(published_at.replace('Z', '+00:00'))).days
                days_old = max(1, days_old)  # 避免除以0

                trend_score = (view_count * 0.4 + like_count * 0.4 + comment_count * 0.2) / days_old

                video = self._parse_video_item(item)
                video['trend_score'] = trend_score
                trending_videos.append(video)

            # 按趋势分数排序
            trending_videos.sort(key=lambda x: x['trend_score'], reverse=True)

            return trending_videos[:max_results]

        except Exception as e:
            print(f"获取趋势视频失败: {e}")
            return []

    # ============ 辅助方法：解析视频数据 ============
    def _parse_video_item(self, item):
        """解析视频项为统一格式"""
        snippet = item['snippet']
        statistics = item.get('statistics', {})

        # 解析时长
        duration = item.get('contentDetails', {}).get('duration', 'PT0S')
        try:
            duration_seconds = isodate.parse_duration(duration).total_seconds()
            duration_str = str(timedelta(seconds=int(duration_seconds)))
        except:
            duration_seconds = 0
            duration_str = '00:00'

        # 获取类别名称
        category_id = snippet.get('categoryId', '')
        category_name = self.video_categories.get(category_id, 'Unknown')

        return {
            'video_id': item['id'],
            'title': snippet['title'],
            'channel': snippet['channelTitle'],
            'channel_id': snippet['channelId'],
            'published_at': snippet['publishedAt'],
            'category_id': category_id,
            'category_name': category_name,
            'view_count': int(statistics.get('viewCount', 0)),
            'like_count': int(statistics.get('likeCount', 0)),
            'comment_count': int(statistics.get('commentCount', 0)),
            'duration_seconds': duration_seconds,
            'duration_str': duration_str,
            'url': f'https://youtu.be/{item["id"]}',
            'thumbnail': snippet['thumbnails']['high']['url']
        }

    # ============ 获取所有视频类别 ============
    def get_video_categories(self, region_code='US'):
        """
        获取指定地区的视频类别
        """
        try:
            request = self.youtube.videoCategories().list(
                part='snippet',
                regionCode=region_code
            )
            response = request.execute()

            categories = []
            for item in response['items']:
                categories.append({
                    'id': item['id'],
                    'name': item['snippet']['title'],
                    'assignable': item['snippet']['assignable']
                })

            return categories

        except Exception as e:
            print(f"获取类别失败: {e}")
            return []


def main():
    """主函数：演示各种获取热门视频的方法"""
    print("=" * 80)
    print("YouTube热门视频获取器")
    print("=" * 80)

    # 初始化（如果需要代理）
    collector = YouTubeHotVideos(
        api_key=API_KEY,
        proxy_host='127.0.0.1',
        proxy_port=7890  # 你的代理端口
    )

    # ============ 方法1: 获取美国地区热门视频 ============
    print("\n1️⃣ 美国地区热门视频 (Top 10):")
    print("-" * 60)

    us_hot = collector.get_most_popular_videos(max_results=10, region_code='US')

    for i, video in enumerate(us_hot, 1):
        print(f"\n{i}. {video['title']}")
        print(f"   频道: {video['channel']}")
        print(f"   观看: {video['view_count']:,}")
        print(f"   点赞: {video['like_count']:,}")
        print(f"   类别: {video['category_name']}")
        print(f"   时长: {video['duration_str']}")

    # ============ 方法2: 获取日本地区热门视频 ============
    print("\n\n2️⃣ 日本地区热门视频:")
    print("-" * 60)

    jp_hot = collector.get_most_popular_videos(max_results=5, region_code='JP')

    for i, video in enumerate(jp_hot, 1):
        print(f"\n{i}. {video['title']}")
        print(f"   频道: {video['channel']}")
        print(f"   观看: {video['view_count']:,}")

    # ============ 方法3: 按类别获取热门 ============
    print("\n\n3️⃣ 音乐类别热门视频:")
    print("-" * 60)

    music_hot = collector.get_popular_by_category(
        category_id=10,  # 音乐类别
        region_code='US',
        max_results=5
    )

    for i, video in enumerate(music_hot, 1):
        print(f"\n{i}. {video['title']}")
        print(f"   频道: {video['channel']}")
        print(f"   观看: {video['view_count']:,}")

    # ============ 方法4: 搜索本周热门 ============
    print("\n\n4️⃣ 本周热门视频（按观看量排序）:")
    print("-" * 60)

    # 计算时间范围（最近7天）
    week_ago = (datetime.now() - timedelta(days=7)).isoformat() + 'Z'

    weekly_hot = collector.search_hot_videos_by_time(
        query=None,  # 不限制关键词
        published_after=week_ago,
        max_results=5,
        order='viewCount'  # 按观看量排序
    )

    for i, video in enumerate(weekly_hot, 1):
        print(f"\n{i}. {video['title']}")
        print(f"   频道: {video['channel']}")
        print(f"   观看: {video['view_count']:,}")
        print(f"   发布时间: {video['published_at'][:10]}")

    # ============ 方法5: 自定义趋势视频 ============
    print("\n\n5️⃣ 趋势视频分析（自定义算法）:")
    print("-" * 60)

    trending = collector.get_trending_videos(
        region_code='US',
        days=3,  # 最近3天发布的视频
        min_views=50000,  # 最低5万观看
        max_results=5
    )

    for i, video in enumerate(trending, 1):
        print(f"\n{i}. {video['title']}")
        print(f"   频道: {video['channel']}")
        print(f"   观看: {video['view_count']:,}")
        print(f"   点赞: {video['like_count']:,}")
        print(f"   趋势分: {video['trend_score']:.0f}")

    # ============ 保存数据到CSV ============
    print("\n\n💾 保存数据到CSV...")

    # 合并所有视频
    all_videos = us_hot + jp_hot + music_hot + weekly_hot + trending

    if all_videos:
        df = pd.DataFrame(all_videos)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"youtube_hot_videos_{timestamp}.csv"
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"✅ 已保存 {len(all_videos)} 个视频到: {filename}")

        # 显示统计信息
        print(f"\n📊 统计信息:")
        print(f"总视频数: {len(df)}")
        print(f"总观看量: {df['view_count'].sum():,}")
        print(f"平均观看: {df['view_count'].mean():,.0f}")
        print(f"平均点赞: {df['like_count'].mean():,.0f}")

        # 按类别统计
        print(f"\n📈 按类别统计:")
        category_stats = df.groupby('category_name').size().sort_values(ascending=False)
        for category, count in category_stats.items():
            print(f"  {category}: {count}个视频")


if __name__ == "__main__":
    main()