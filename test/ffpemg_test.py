import ffmpeg
import os
import subprocess
import json


def extract_first_last_frames_simple(input_file):
    """
    简洁版：截取视频的首帧和尾帧
    """
    try:
        # 获取视频信息
        probe = ffmpeg.probe(input_file)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)

        if video_stream is None:
            print("没有找到视频流")
            return

        # 获取视频时长
        duration = float(video_stream['duration'])
        print(f"视频时长: {duration:.2f}秒")

        # 截取首帧
        print("\n正在截取首帧...")
        (
            ffmpeg
            .input(input_file, ss=0)
            .output('first_frame.jpg', vframes=1)
            .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        )
        print("✅ 首帧已保存为: first_frame.jpg")

        # 截取尾帧
        print("\n正在截取尾帧...")
        # 从结尾前0.05秒开始截取，确保获取最后一帧
        last_frame_time = max(0, duration - 0.05)
        (
            ffmpeg
            .input(input_file, ss=last_frame_time)
            .output('last_frame.jpg', vframes=1)
            .run(overwrite_output=True, capture_stdout=True, capture_stderr=True)
        )
        print("✅ 尾帧已保存为: last_frame.jpg")

        # 验证文件是否成功创建
        if os.path.exists('first_frame.jpg') and os.path.exists('last_frame.jpg'):
            first_size = os.path.getsize('first_frame.jpg')
            last_size = os.path.getsize('last_frame.jpg')
            print(f"\n文件大小:")
            print(f"  - 首帧: {first_size / 1024:.2f} KB")
            print(f"  - 尾帧: {last_size / 1024:.2f} KB")
            print("\n✨ 成功保存首帧和尾帧！")
        else:
            print("❌ 文件保存可能失败")

    except ffmpeg.Error as e:
        print(f"FFmpeg错误: {e.stderr.decode() if e.stderr else str(e)}")
    except Exception as e:
        print(f"其他错误: {e}")


# 使用示例
input_video = r'D:\Workbench\Application\Agent\TripleAEngine\app\core\aigc\my_image2video.mp4'
extract_first_last_frames_simple(input_video)