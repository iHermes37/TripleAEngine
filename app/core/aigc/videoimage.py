import requests
import json
import time
from pathlib import Path
from typing import List, Optional

class WanxVideoGenerator:
    def __init__(self):
        self.api_key = "sk-6b39789438da4cd18b824ca2fdf2c018"
        self.base_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-DashScope-Async": "enable",
            "Content-Type": "application/json"
        }

    def submit_task(self, prompt, reference_urls, size="1280*720", duration=10, audio=True):
        """提交视频生成任务"""
        payload = {
            "model": "wan2.6-r2v-flash",
            "input": {
                "prompt": prompt,
                "reference_urls": reference_urls
            },
            "parameters": {
                "size": size,
                "duration": duration,
                "audio": audio,
                "shot_type": "multi",
                "watermark": True
            }
        }
        response = requests.post(
            self.base_url,
            headers=self.headers,
            data=json.dumps(payload, ensure_ascii=False).encode('utf-8')
        )
        if response.status_code == 200:
            result = response.json()
            task_id = result.get("output", {}).get("task_id")
            print(f"✅ 任务提交成功，任务ID: {task_id}")
            return task_id
        else:
            print(f"❌ 提交失败: {response.status_code}")
            print(response.text)
            return None

    def query_task(self, task_id, interval=5, max_attempts=60):
        """查询任务状态"""
        query_url = f"https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}"
        for attempt in range(max_attempts):
            response = requests.get(
                query_url,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            if response.status_code == 200:
                result = response.json()
                status = result.get("output", {}).get("task_status")
                if status == "SUCCEEDED":
                    video_url = result.get("output", {}).get("video_url")
                    print(f"✅ 视频生成成功: {video_url}")
                    return video_url
                elif status == "FAILED":
                    error_msg = result.get("output", {}).get("message", "未知错误")
                    print(f"❌ 生成失败: {error_msg}")
                    return None
                else:
                    print(f"⏳ 生成中... ({attempt + 1}/{max_attempts})")
                    time.sleep(interval)
            else:
                print(f"❌ 查询失败: {response.status_code}")
                return None
        print("⏰ 轮询超时")
        return None

    def generate_video(self, prompt, reference_urls, **kwargs):
        """一站式生成视频"""
        task_id = self.submit_task(prompt, reference_urls, **kwargs)
        if not task_id:
            return None
        print("开始轮询结果...")
        video_url = self.query_task(task_id)
        return video_url

    def download_video(self, video_url, save_path=None):
        """下载视频到本地"""
        if not save_path:
            save_path = f"video_{int(time.time())}.mp4"
        response = requests.get(video_url, stream=True)
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"✅ 视频已保存: {save_path}")
        return save_path


class VideoClient:
    """
    视频生成客户端，封装了文生视频和图生视频功能。
    底层使用阿里云通义万相 Wan2.6-r2v-flash 模型。
    """

    def __init__(self):
        """
        初始化视频客户端。

        Args:
            api_key: 阿里云DashScope的API密钥
        """
        self.generator = WanxVideoGenerator()

    def text2video(self,
                   prompt: str,
                   size: str = "1280*720",
                   duration: int = 10,
                   audio: bool = True,
                   download: bool = False,
                   save_path: Optional[str] = None) -> Optional[str]:
        """
        根据文本提示词生成视频（文生视频）。

        Args:
            prompt: 视频内容描述文本
            size: 视频尺寸，如 "1280*720"
            duration: 视频时长（秒）
            audio: 是否生成音频
            download: 是否自动下载视频到本地
            save_path: 如果下载，指定保存路径（默认自动生成文件名）

        Returns:
            如果 download=False，返回视频URL；如果 download=True，返回本地文件路径。
            失败返回 None。
        """
        print(f"🎬 开始文生视频任务，提示词: {prompt}")
        # 文生视频时，参考素材列表为空
        video_url = self.generator.generate_video(
            prompt=prompt,
            reference_urls=[],  # 文生视频不依赖参考图
            size=size,
            duration=duration,
            audio=audio
        )

        if video_url and download:
            return self.generator.download_video(video_url, save_path)
        return video_url

    def image2video(self,
                    image_urls: List[str],
                    prompt: str = "",
                    size: str = "1280*720",
                    duration: int = 10,
                    audio: bool = True,
                    download: bool = False,
                    save_path: Optional[str] = None) -> Optional[str]:
        """
        根据参考图片生成视频（图生视频）。

        Args:
            image_urls: 参考图片的URL列表（必填）
            prompt: 额外的视频内容描述（可选，可对图片内容进行补充或动态描述）
            size: 视频尺寸，如 "1280*720"
            duration: 视频时长（秒）
            audio: 是否生成音频
            download: 是否自动下载视频到本地
            save_path: 如果下载，指定保存路径（默认自动生成文件名）

        Returns:
            如果 download=False，返回视频URL；如果 download=True，返回本地文件路径。
            失败返回 None。
        """
        if not image_urls:
            raise ValueError("图生视频必须提供至少一张参考图片的URL")

        print(f"🖼️ 开始图生视频任务，参考图片数: {len(image_urls)}")
        if prompt:
            print(f"📝 补充提示词: {prompt}")

        video_url = self.generator.generate_video(
            prompt=prompt,
            reference_urls=image_urls,
            size=size,
            duration=duration,
            audio=audio
        )

        if video_url and download:
            return self.generator.download_video(video_url, save_path)
        return video_url


# ===== 使用示例 =====
def main():

    # 初始化客户端
    client = VideoClient()

    # 示例1：文生视频
    # print("\n" + "="*50)
    # print("示例1: 文生视频")
    # print("="*50)
    # text_prompt = "一只可爱的熊猫在竹林里吃竹子，夕阳西下，温馨的氛围"
    # video_result = client.text2video(
    #     prompt=text_prompt,
    #     duration=5,
    #     download=False  # 先只获取URL
    # )
    # if video_result:
    #     print(f"文生视频URL: {video_result}")

    # 示例2：图生视频（需要你有可访问的图片URL）
    print("\n" + "="*50)
    print("示例2: 图生视频")
    print("="*50)
    # 请替换为你的真实图片URL
    reference_images = [
        "https://img.cdn1.vip/i/69b3e20f74b70_1773396495.webp"
        "https://img.cdn1.vip/i/69b3e20f71d30_1773396495.webp"
    ]
    image_prompt = '女孩看着他，摇头拒绝，然后毅然走开。刹那间，璀璨的光幕在她身后的城市楼群中如花朵般绽放。'
    video_url = client.image2video(
        image_urls=reference_images,
        prompt=image_prompt,
        duration=10,
        audio=True,
        download=True,  # 下载到本地
        save_path="my_image2video.mp4"
    )
    if video_url:
        print(f"图生视频已保存: {video_url}")


if __name__ == "__main__":
    main()