import os
import logging
from pathlib import Path

from app.core.aigc.imageclient import ImageClient

# 配置日志格式，让输出更清晰
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def test_image_client():
    """测试 ImageClient 类的两个函数"""

    # 创建客户端实例
    client = ImageClient()

    # 测试用的参考图片路径（你提供的路径）
    ref_image_path = r"C:\Users\11252\Desktop桌面\下载.webp"
    # 检查文件是否存在
    if not os.path.exists(ref_image_path):
        logger.error(f"参考图片不存在: {ref_image_path}")
        logger.info("请检查文件路径是否正确")
        return

    logger.info(f"找到参考图片: {ref_image_path}")
    logger.info(f"文件大小: {os.path.getsize(ref_image_path)} 字节")

    # 创建结果保存目录
    output_dir = "./test_output"
    os.makedirs(output_dir, exist_ok=True)
    os.chdir(output_dir)  # 切换到输出目录
    logger.info(f"输出目录: {os.path.abspath('.')}")

    # # === 测试1: 文生图 (text2Image) ===
    # print("\n" + "=" * 60)
    # print("测试1: 文生图功能 (text2Image)")
    # print("=" * 60)
    #
    # try:
    #     text_prompt = "一个男人在吃西瓜"
    #     logger.info(f"使用提示词: {text_prompt}")
    #
    #     text_images = client.text2Image(
    #         num=1,  # 生成2张
    #         prompt=text_prompt,
    #         negative_prompt="模糊, 低质量, 卡通风格, 写实"
    #     )
    #
    #     print(f"\n文生图结果:")
    #     if text_images:
    #         print(f"✅ 成功生成 {len(text_images)} 张图片:")
    #         for i, url in enumerate(text_images):
    #             print(f"   {i + 1}. {url}")
    #     else:
    #         print("❌ 未能生成图片")
    #
    # except Exception as e:
    #     logger.error(f"文生图测试失败: {e}", exc_info=True)

    # === 测试2: 图生图 (image2image) ===
    print("\n" + "=" * 60)
    print("测试2: 图生图功能 (image2image)")
    print("=" * 60)

    try:
        # 不同风格的测试
        image_prompts = [
            "该男生穿着黑色上衣和白色短裤",
            "该男生穿着黑色上衣和白色短裤搂着一个女人"
        ]

        for idx, img_prompt in enumerate(image_prompts):
            print(f"\n--- 测试 {idx + 1}: {img_prompt} ---")

            image_images = client.image2image(
                ref_image=ref_image_path,
                num=1,  # 每种风格生成1张
                prompt=img_prompt,
                negative_prompt="模糊, 低质量, 变形, 扭曲",
                ref_img=""  # 不需要额外的参考图片
            )

            if image_images:
                print(f"✅ 生成成功:")
                for i, url in enumerate(image_images):
                    print(f"   {i + 1}. {url}")
            else:
                print(f"❌ 未能生成图片")

    except ValueError as e:
        logger.error(f"参数错误: {e}")
    except Exception as e:
        logger.error(f"图生图测试失败: {e}", exc_info=True)

    # === 测试3: 错误处理测试 ===
    # print("\n" + "=" * 60)
    # print("测试3: 错误处理测试")
    # print("=" * 60)
    #
    # # 测试3.1: 空的参考图片
    # print("\n--- 测试空参考图片 ---")
    # try:
    #     client.image2image(
    #         ref_image="",  # 空路径
    #         prompt="测试",
    #         num=1
    #     )
    # except ValueError as e:
    #     print(f"✅ 正确捕获错误: {e}")
    #
    # # 测试3.2: 不存在的文件
    # print("\n--- 测试不存在的文件 ---")
    # try:
    #     client.image2image(
    #         ref_image="C:/not/exist/path/image.jpg",
    #         prompt="测试",
    #         num=1
    #     )
    # except Exception as e:
    #     print(f"结果: {e}")
    #
    # # 切换回原目录
    # os.chdir("..")
    # print(f"\n{'=' * 60}")
    # print("测试完成！")
    # print(f"生成的图片保存在: {os.path.abspath(output_dir)}")
    #



if __name__ == "__main__":
    print("开始测试 ImageClient...")
    print("=" * 60)

    test_image_client()
