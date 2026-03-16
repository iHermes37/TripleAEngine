// 对应 test/ffpemg_test.py

import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";

function extract_first_last_frames_simple(input_file: string): void {
  /**
   * 简洁版：截取视频的首帧和尾帧
   */
  ffmpeg.ffprobe(input_file, (err, metadata) => {
    if (err) {
      console.log(`FFmpeg错误: ${err.message}`);
      return;
    }

    const video_stream = metadata.streams.find(
      (s) => s.codec_type === "video"
    );

    if (!video_stream) {
      console.log("没有找到视频流");
      return;
    }

    const duration = parseFloat(String(video_stream.duration ?? "0"));
    console.log(`视频时长: ${duration.toFixed(2)}秒`);

    // 截取首帧
    console.log("\n正在截取首帧...");
    ffmpeg(input_file)
      .seekInput(0)
      .frames(1)
      .output("first_frame.jpg")
      .on("end", () => {
        console.log("✅ 首帧已保存为: first_frame.jpg");

        // 截取尾帧
        console.log("\n正在截取尾帧...");
        // 从结尾前0.05秒开始截取，确保获取最后一帧
        const last_frame_time = Math.max(0, duration - 0.05);
        ffmpeg(input_file)
          .seekInput(last_frame_time)
          .frames(1)
          .output("last_frame.jpg")
          .on("end", () => {
            console.log("✅ 尾帧已保存为: last_frame.jpg");

            // 验证文件是否成功创建
            if (
              fs.existsSync("first_frame.jpg") &&
              fs.existsSync("last_frame.jpg")
            ) {
              const first_size = fs.statSync("first_frame.jpg").size;
              const last_size = fs.statSync("last_frame.jpg").size;
              console.log(`\n文件大小:`);
              console.log(`  - 首帧: ${(first_size / 1024).toFixed(2)} KB`);
              console.log(`  - 尾帧: ${(last_size / 1024).toFixed(2)} KB`);
              console.log("\n✨ 成功保存首帧和尾帧！");
            } else {
              console.log("❌ 文件保存可能失败");
            }
          })
          .on("error", (e) => {
            console.log(`FFmpeg错误: ${e.message}`);
          })
          .run();
      })
      .on("error", (e) => {
        console.log(`FFmpeg错误: ${e.message}`);
      })
      .run();
  });
}

// 使用示例
const input_video = "C:/Users/11252/Desktop桌面/y_image2video.mp4";

extract_first_last_frames_simple(input_video);
