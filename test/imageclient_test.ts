// 对应 test/imageclient.py

import * as fs from "fs";
import * as path from "path";
import { ImageClient } from "../src/lib/models/aigc/imageclient";

const logger = {
  info: (msg: string) => console.info(`[INFO] ${msg}`),
  error: (msg: string, extra?: unknown) =>
    console.error(`[ERROR] ${msg}`, extra ?? ""),
};

async function test_image_client(): Promise<void> {
  // 测试 ImageClient 类的两个函数

  // 创建客户端实例
  const client = new ImageClient();

  // 测试用的参考图片路径（你提供的路径）
  const ref_image_path = "C:\\Users\\11252\\Desktop桌面\\下载.webp";

  // 检查文件是否存在
  if (!fs.existsSync(ref_image_path)) {
    logger.error(`参考图片不存在: ${ref_image_path}`);
    logger.info("请检查文件路径是否正确");
    return;
  }

  logger.info(`找到参考图片: ${ref_image_path}`);
  logger.info(`文件大小: ${fs.statSync(ref_image_path).size} 字节`);

  // 创建结果保存目录
  const output_dir = "./test_output";
  fs.mkdirSync(output_dir, { recursive: true });
  process.chdir(output_dir); // 切换到输出目录
  logger.info(`输出目录: ${path.resolve(".")}`);

  // // === 测试1: 文生图 (text2Image) ===
  console.log("\n" + "=".repeat(60));
  console.log("测试1: 文生图功能 (text2Image)");
  console.log("=".repeat(60));
  
  try {
    const text_prompt = "一个男人在吃西瓜";
    logger.info(`使用提示词: ${text_prompt}`);
  
    const text_images = await client.text2Image(1, "模糊, 低质量, 卡通风格, 写实", text_prompt);
  
    console.log(`\n文生图结果:`);
    if (text_images.length) {
      console.log(`✅ 成功生成 ${text_images.length} 张图片:`);
      text_images.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
    } else {
      console.log("❌ 未能生成图片");
    }
  } catch (e) {
    logger.error(`文生图测试失败: ${e}`, e);
  }

  // === 测试2: 图生图 (image2image) ===
  // console.log("\n" + "=".repeat(60));
  // console.log("测试2: 图生图功能 (image2image)");
  // console.log("=".repeat(60));

  // try {
  //   // 不同风格的测试
  //   const image_prompts = [
  //     "该男生穿着黑色上衣和白色短裤",
  //     "该男生穿着黑色上衣和白色短裤搂着一个女人",
  //   ];

  //   for (let idx = 0; idx < image_prompts.length; idx++) {
  //     const img_prompt = image_prompts[idx];
  //     console.log(`\n--- 测试 ${idx + 1}: ${img_prompt} ---`);

  //     const image_images = await client.image2image(
  //       ref_image_path,
  //       1, // 每种风格生成1张
  //       "模糊, 低质量, 变形, 扭曲",
  //       img_prompt,
  //       "" // 不需要额外的参考图片
  //     );

  //     if (image_images.length) {
  //       console.log(`✅ 生成成功:`);
  //       image_images.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
  //     } else {
  //       console.log(`❌ 未能生成图片`);
  //     }
  //   }
  // } catch (e: unknown) {
  //   if (e instanceof Error && e.message.includes("必需")) {
  //     logger.error(`参数错误: ${e}`);
  //   } else {
  //     logger.error(`图生图测试失败: ${e}`, e);
  //   }
  // }

  // === 测试3: 错误处理测试 ===
  // console.log("\n" + "=".repeat(60));
  // console.log("测试3: 错误处理测试");
  // console.log("=".repeat(60));
  //
  // // 测试3.1: 空的参考图片
  // console.log("\n--- 测试空参考图片 ---");
  // try {
  //   await client.image2image("", "测试", 1);
  // } catch (e) {
  //   console.log(`✅ 正确捕获错误: ${e}`);
  // }
  //
  // // 测试3.2: 不存在的文件
  // console.log("\n--- 测试不存在的文件 ---");
  // try {
  //   await client.image2image("C:/not/exist/path/image.jpg", "测试", 1);
  // } catch (e) {
  //   console.log(`结果: ${e}`);
  // }
  //
  // process.chdir("..");
  // console.log(`\n${"=".repeat(60)}`);
  // console.log("测试完成！");
  // console.log(`生成的图片保存在: ${path.resolve(output_dir)}`);
}

if (require.main === module) {
  console.log("开始测试 ImageClient...");
  console.log("=".repeat(60));
  test_image_client();
}
