// 对应 app/core/aigc/videoimage.py

import axios from "axios";
import * as fs from "fs";
import * as path from "path";

class WanxVideoGenerator {
  private api_key: string;
  private base_url: string;
  private headers: Record<string, string>;

  constructor() {
    this.api_key = "sk-6b39789438da4cd18b824ca2fdf2c018";
    this.base_url =
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";
    this.headers = {
      Authorization: `Bearer ${this.api_key}`,
      "X-DashScope-Async": "enable",
      "Content-Type": "application/json",
    };
  }

  async submit_task(
    prompt: string,
    reference_urls: string[],
    size: string = "1280*720",
    duration: number = 10,
    audio: boolean = true
  ): Promise<string | null> {
    // 提交视频生成任务
    const payload = {
      model: "wan2.6-r2v-flash",
      input: {
        prompt,
        reference_urls,
      },
      parameters: {
        size,
        duration,
        audio,
        shot_type: "multi",
        watermark: true,
      },
    };

    const response = await axios.post(
      this.base_url,
      JSON.stringify(payload),
      { headers: this.headers }
    );

    if (response.status === 200) {
      const task_id = response.data?.output?.task_id;
      console.log(`✅ 任务提交成功，任务ID: ${task_id}`);
      return task_id ?? null;
    } else {
      console.log(`❌ 提交失败: ${response.status}`);
      console.log(response.data);
      return null;
    }
  }

  async query_task(
    task_id: string,
    interval: number = 5,
    max_attempts: number = 60
  ): Promise<string | null> {
    // 查询任务状态
    const query_url = `https://dashscope.aliyuncs.com/api/v1/tasks/${task_id}`;

    for (let attempt = 0; attempt < max_attempts; attempt++) {
      const response = await axios.get(query_url, {
        headers: { Authorization: `Bearer ${this.api_key}` },
      });

      if (response.status === 200) {
        const status = response.data?.output?.task_status;
        if (status === "SUCCEEDED") {
          const video_url = response.data?.output?.video_url;
          console.log(`✅ 视频生成成功: ${video_url}`);
          return video_url ?? null;
        } else if (status === "FAILED") {
          const error_msg = response.data?.output?.message ?? "未知错误";
          console.log(`❌ 生成失败: ${error_msg}`);
          return null;
        } else {
          console.log(`⏳ 生成中... (${attempt + 1}/${max_attempts})`);
          await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        }
      } else {
        console.log(`❌ 查询失败: ${response.status}`);
        return null;
      }
    }

    console.log("⏰ 轮询超时");
    return null;
  }

  async generate_video(
    prompt: string,
    reference_urls: string[],
    size?: string,
    duration?: number,
    audio?: boolean
  ): Promise<string | null> {
    // 一站式生成视频
    const task_id = await this.submit_task(
      prompt,
      reference_urls,
      size,
      duration,
      audio
    );
    if (!task_id) {
      return null;
    }
    console.log("开始轮询结果...");
    const video_url = await this.query_task(task_id);
    return video_url;
  }

  async download_video(
    video_url: string,
    save_path?: string
  ): Promise<string> {
    // 下载视频到本地
    if (!save_path) {
      save_path = `video_${Math.floor(Date.now() / 1000)}.mp4`;
    }

    const response = await axios.get(video_url, {
      responseType: "stream",
    });

    const writer = fs.createWriteStream(save_path);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`✅ 视频已保存: ${save_path}`);
    return save_path;
  }
}

export class VideoClient {
  /**
   * 视频生成客户端，封装了文生视频和图生视频功能。
   * 底层使用阿里云通义万相 Wan2.6-r2v-flash 模型。
   */
  private generator: WanxVideoGenerator;

  constructor() {
    /**
     * 初始化视频客户端。
     */
    this.generator = new WanxVideoGenerator();
  }

  async text2video(
    prompt: string,
    size: string = "1280*720",
    duration: number = 10,
    audio: boolean = true,
    download: boolean = false,
    save_path?: string
  ): Promise<string | null> {
    /**
     * 根据文本提示词生成视频（文生视频）。
     */
    console.log(`🎬 开始文生视频任务，提示词: ${prompt}`);
    // 文生视频时，参考素材列表为空
    const video_url = await this.generator.generate_video(
      prompt,
      [], // 文生视频不依赖参考图
      size,
      duration,
      audio
    );

    if (video_url && download) {
      return this.generator.download_video(video_url, save_path);
    }
    return video_url;
  }

  async image2video(
    image_urls: string[],
    prompt: string = "",
    size: string = "1280*720",
    duration: number = 10,
    audio: boolean = true,
    download: boolean = false,
    save_path?: string
  ): Promise<string | null> {
    /**
     * 根据参考图片生成视频（图生视频）。
     */
    if (!image_urls || image_urls.length === 0) {
      throw new Error("图生视频必须提供至少一张参考图片的URL");
    }

    console.log(`🖼️ 开始图生视频任务，参考图片数: ${image_urls.length}`);
    if (prompt) {
      console.log(`📝 补充提示词: ${prompt}`);
    }

    const video_url = await this.generator.generate_video(
      prompt,
      image_urls,
      size,
      duration,
      audio
    );

    if (video_url && download) {
      return this.generator.download_video(video_url, save_path);
    }
    return video_url;
  }
}

// ===== 使用示例 =====
async function main() {
  const client = new VideoClient();

  // 示例1：文生视频
  // console.log("\n" + "=".repeat(50));
  // console.log("示例1: 文生视频");
  // console.log("=".repeat(50));
  // const text_prompt = "一只可爱的熊猫在竹林里吃竹子，夕阳西下，温馨的氛围";
  // const video_result = await client.text2video({ prompt: text_prompt, duration: 5, download: false });
  // if (video_result) {
  //   console.log(`文生视频URL: ${video_result}`);
  // }

  // 示例2：图生视频（需要你有可访问的图片URL）
  console.log("\n" + "=".repeat(50));
  console.log("示例2: 图生视频");
  console.log("=".repeat(50));
  // 请替换为你的真实图片URL
  const reference_images = [
    "https://img.cdn1.vip/i/69b3e20f74b70_1773396495.webp" +
      "https://img.cdn1.vip/i/69b3e20f71d30_1773396495.webp",
  ];
  const image_prompt =
    "女孩看着他，摇头拒绝，然后毅然走开。刹那间，璀璨的光幕在她身后的城市楼群中如花朵般绽放。";
  const video_url = await client.image2video(
    reference_images,
    image_prompt,
    "1280*720",
    10,
    true,
    true, // 下载到本地
    "my_image2video.mp4"
  );
  if (video_url) {
    console.log(`图生视频已保存: ${video_url}`);
  }
}

if (require.main === module) {
  main();
}
