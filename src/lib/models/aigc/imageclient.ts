// 对应 app/core/aigc/imageclient.py
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
// import dotenv from "dotenv";

// // 加载环境变量
// dotenv.config();

const logger = {
  info: (msg: string) => console.info(`[INFO] ${msg}`),
  warning: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string, extra?: unknown) => console.error(`[ERROR] ${msg}`, extra ?? ""),
};

interface GenerationResult {
  url: string;
  [key: string]: any;
}

export class ImageClient {
  private base_http_api_url: string;
  private api_key: string;

  constructor() {
    this.base_http_api_url = process.env.DASHSCOPE_API_BASE || "https://dashscope.aliyuncs.com/api/v1";
    // ✅ 从环境变量读取 API Key
    this.api_key = process.env.DASHSCOPE_API_KEY || "";
    
    if (!this.api_key) {
      logger.error("请设置 DASHSCOPE_API_KEY 环境变量");
      throw new Error("API Key 未配置");
    }
  }

  /**
   * 文生图 - 使用 qwen-image-2.0-pro 多模态模型
   */
  async text2Image(
    num: number = 1,
    negative_prompt: string = "",
    prompt: string = ""
  ): Promise<string[]> {
    const images: string[] = [];
    
    if (!prompt) {
      logger.error("提示词不能为空");
      return images;
    }

    try {
      logger.info(`开始文生图处理，提示词: ${prompt.slice(0, 50)}...`);
      
      // ✅ 修正1: 按照 API 要求的格式构造请求体
      const requestBody = {
        model: process.env.DASHSCOPE_IMAGE_MODEL || "qwen-image-2.0-pro",
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  text: prompt  // prompt 放在这里
                }
              ]
            }
          ]
        },
        parameters: {
          // ✅ 修正2: negative_prompt 放在 parameters 里
          negative_prompt: negative_prompt || "低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，蜡像感，人脸无细节，过度光滑，画面具有AI感。构图混乱。文字模糊，扭曲。",
          prompt_extend: true,
          watermark: false,
          size: "1024*1024",  // qwen-image-2.0-pro 支持: 1024*1024, 768*1344, 1344*768 等
          // n: num  // ⚠️ qwen-image-2.0-pro 可能不支持 n 参数，一次只生成一张
        }
      };

      const response = await axios.post(
        `${this.base_http_api_url}/services/aigc/multimodal-generation/generation`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.api_key}`,
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60秒超时
        }
      );

      if (response.status === 200) {
        // ✅ 修正3: 正确处理响应格式
        if (response.data?.output?.choices) {
          // 新格式
          for (const choice of response.data.output.choices) {
            if (choice.message?.content?.[0]?.image) {
              images.push(choice.message.content[0].image);
            }
          }
        } else if (response.data?.output?.results) {
          // 旧格式
          for (const result of response.data.output.results) {
            images.push(result.url || result.image);
          }
        } else if (response.data?.output?.task_id) {
          // 异步任务
          logger.info(`任务已提交，task_id: ${response.data.output.task_id}`);
          // 这里可以添加轮询逻辑
        }
        
        logger.info(`成功生成 ${images.length} 张图片`);
      }
    } catch (e: unknown) {
      this.handleError(e, "text2Image");
    }
    
    return images;
  }

  /**
   * 图生图 - 使用通义万相模型
   */
  async image2image(
    ref_image: string,
    num: number = 1,
    negative_prompt: string = "",
    prompt: string = "",
    ref_img: string = ""
  ): Promise<string[]> {
    const images: string[] = [];

    // === 1. 参数验证 ===
    if (!ref_image) {
      logger.error("参考图片不能为空");
      throw new Error("参考图片参数 ref_image 是必需的");
    }

    if (!prompt) {
      logger.warning("提示词为空，可能影响生成效果");
    }

    // === 2. 处理参考图片 ===
    let imageData: string = ref_image;
    if (fs.existsSync(ref_image)) {
      logger.info(`使用本地图片: ${ref_image}`);
      // 如果是本地文件，读取并转换为 base64
      try {
        const imageBuffer = fs.readFileSync(ref_image);
        const base64Image = imageBuffer.toString('base64');
        const ext = path.extname(ref_image).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        imageData = `data:${mimeType};base64,${base64Image}`;
        logger.info(`已转换为 base64 格式`);
      } catch (err) {
        logger.error(`读取本地图片失败: ${err}`);
        throw err;
      }
    } else {
      logger.info(`使用远程图片URL: ${ref_image}`);
    }

    // === 3. 调用API生成图片 ===
    try {
      logger.info(`开始图生图处理，提示词: ${prompt.slice(0, 50)}...`);

      // ✅ 修正4: 图生图的正确格式
      const requestBody = {
        model: process.env.DASHSCOPE_TEXT2IMAGE_MODEL || "wanx-v1",  // 通义万相模型
        input: {
          prompt: prompt,
          negative_prompt: negative_prompt || "",
          ref_img: imageData,  // 参考图片
        },
        parameters: {
          n: num,
          size: "1024*1024",
          prompt_extend: true,
          watermark: false,
          style: "<auto>",  // 可选: <auto>, <photography>, <portrait>, <3d>, <anime>
        },
      };

      const response = await axios.post(
        `${this.base_http_api_url}/services/aigc/text2image/image-synthesis`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.api_key}`,
            "Content-Type": "application/json",
          },
          timeout: 120000, // 图生图可能更慢，120秒超时
        }
      );

      // === 4. 处理响应 ===
      if (response.status === 200) {
        if (response.data?.output?.task_id) {
          // 异步任务
          logger.info(`任务已提交，task_id: ${response.data.output.task_id}`);
          // 这里可以添加轮询逻辑获取结果
          const taskResult = await this.pollTaskResult(response.data.output.task_id);
          if (taskResult?.output?.results) {
            for (const result of taskResult.output.results) {
              images.push(result.url);
            }
          }
        } else if (response.data?.output?.results) {
          // 同步结果
          for (const result of response.data.output.results) {
            images.push(result.url);
          }
        }

        logger.info(`成功生成 ${images.length} 张图片`);
      }
    } catch (e: unknown) {
      this.handleError(e, "image2image");
    }

    if (images.length === 0) {
      logger.warning("未能成功生成任何图片");
    }

    return images;
  }

  /**
   * 轮询异步任务结果
   */
  private async pollTaskResult(taskId: string, maxAttempts: number = 30): Promise<any> {
    const url = `${this.base_http_api_url}/tasks/${taskId}`;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${this.api_key}`,
          },
        });

        if (response.data?.output?.task_status === 'SUCCEEDED') {
          logger.info(`任务 ${taskId} 完成`);
          return response.data;
        } else if (response.data?.output?.task_status === 'FAILED') {
          logger.error(`任务 ${taskId} 失败: ${response.data.output.message}`);
          return null;
        } else {
          logger.info(`任务 ${taskId} 处理中... (${i + 1}/${maxAttempts})`);
        }
      } catch (error) {
        logger.error(`轮询任务状态失败: ${error}`);
      }
    }
    
    logger.warning(`任务 ${taskId} 轮询超时`);
    return null;
  }

  /**
   * 统一错误处理
   */
  private handleError(e: unknown, method: string): void {
    const errorPrefix = `[${method}]`;
    
    if (axios.isAxiosError(e)) {
      if (e.code === "ETIMEDOUT" || e.code === "ECONNABORTED") {
        logger.error(`${errorPrefix} API请求超时`, e.message);
      } else if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND") {
        logger.error(`${errorPrefix} 网络连接错误`, e.message);
      } else if (e.response) {
        // 服务器返回了错误状态码
        logger.error(`${errorPrefix} API错误 [${e.response.status}]`, {
          data: e.response.data,
          status: e.response.status,
          headers: e.response.headers,
        });
        
        // 特定状态码提示
        switch (e.response.status) {
          case 400:
            logger.error("请求参数错误，请检查请求格式");
            break;
          case 401:
            logger.error("API密钥无效或已过期，请检查环境变量 DASHSCOPE_API_KEY");
            break;
          case 403:
            logger.error("没有权限使用此功能，请在控制台开通服务");
            break;
          case 429:
            logger.error("请求频率过高，请稍后重试");
            break;
          case 500:
          case 502:
          case 503:
            logger.error("服务器内部错误，请稍后重试");
            break;
        }
      } else if (e.request) {
        // 请求已发送但没有收到响应
        logger.error(`${errorPrefix} 未收到响应`, e.message);
      } else {
        logger.error(`${errorPrefix} 请求配置错误`, e.message);
      }
    } else if (e instanceof TypeError) {
      logger.error(`${errorPrefix} 类型错误: ${e.message}`);
    } else if (e instanceof Error) {
      logger.error(`${errorPrefix} ${e.message}`);
    } else {
      logger.error(`${errorPrefix} 未知异常`, e);
    }
  }
}

// 导出默认实例
export default ImageClient;