import logging
import os
from http import HTTPStatus
from pathlib import PurePosixPath
from typing import List
from urllib.parse import urlparse, unquote

from dashscope import ImageSynthesis
from jsonref import requests

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageClient:
    def __init__(self):
        self.base_http_api_url='https://dashscope.aliyuncs.com/api/v1'
        self.api_key = "sk-6b39789438da4cd18b824ca2fdf2c018"

    def text2Image(self,num:int=1,negative_prompt:str='',prompt:str='')->list[str]:
        images:list[str]=[]
        try:
            rsp = ImageSynthesis.call(api_key=self.api_key,
                                      model="qwen-image-plus",  # 当前仅qwen-image-plus、qwen-image模型支持异步接口
                                      prompt=prompt,
                                      negative_prompt=negative_prompt,
                                      n=num,
                                      size='1664*928',
                                      prompt_extend=True,
                                      watermark=False)

            if rsp.status_code == HTTPStatus.OK:
                for result in rsp.output.results:
                    images.append(result.url)
            else:
                print(f"API 调用失败: {rsp.status_code}")
        except requests.exceptions.RequestException as e:
            # 网络请求异常
            print(f"网络请求异常: {e}")
        except AttributeError as e:
            # 属性访问异常（如 rsp.output 不存在）
            print(f"响应数据格式异常: {e}")
        except IOError as e:
            # 文件读写异常
            print(f"文件保存异常: {e}")
        except Exception as e:
            # 其他未预期的异常
            print(f"未知异常: {e}")

        return images

    def image2image(
            self,
            ref_image: str,  # 参考图片（用于图生图）
            num: int = 1,
            negative_prompt: str = '',
            prompt: str = '',
            ref_img: str = ''  # 可能是另一个参考图片参数
    ) -> List[str]:
        """
        图生图函数 - 基于参考图片生成新图片

        Args:
            ref_image: 参考图片URL或本地路径（必须）
            num: 生成图片数量，默认1张
            negative_prompt: 反向提示词，描述不想要的内容
            prompt: 正向提示词，描述想要生成的内容
            ref_img: 额外的参考图片（某些API可能需要）

        Returns:
            List[str]: 生成的图片URL列表

        Raises:
            ValueError: 当必要参数缺失或无效时
        """
        images: List[str] = []

        # === 1. 参数验证 ===
        if not ref_image:
            logger.error("参考图片不能为空")
            raise ValueError("参考图片参数 ref_image 是必需的")

        if not prompt:
            logger.warning("提示词为空，可能影响生成效果")

        if num < 1 or num > 10:  # 假设API限制最多10张
            logger.warning(f"请求图片数量 {num} 可能超出API限制")

        # 检查参考图片是否存在（如果是本地文件）
        if os.path.exists(ref_image):
            logger.info(f"使用本地图片: {ref_image}")
        else:
            logger.info(f"使用远程图片URL: {ref_image}")

        # === 2. 调用API生成图片 ===
        try:
            logger.info(f"开始图生图处理，提示词: {prompt[:50]}...")

            rsp = ImageSynthesis.call(
                api_key=self.api_key,
                model="qwen-image-plus",  # 或其他支持图生图的模型
                prompt=prompt,
                negative_prompt=negative_prompt,
                n=num,
                ref_image=ref_image,  # 主要参考图片
                ref_img=ref_img if ref_img else None,  # 额外的参考图片
                size='1664*928',
                prompt_extend=True,
                watermark=False
            )

            # === 3. 处理响应 ===
            if not hasattr(rsp, 'status_code'):
                raise ValueError("API返回的响应对象缺少status_code属性")

            if rsp.status_code == HTTPStatus.OK:
                # 检查响应数据结构
                if not hasattr(rsp, 'output') or not hasattr(rsp.output, 'results'):
                    raise ValueError("API响应数据格式异常")

                # 处理生成的图片
                total_results = len(rsp.output.results)
                logger.info(f"成功生成 {total_results} 张图片")

                for i, result in enumerate(rsp.output.results):
                     # === 4. 处理每张图片 ===
                    images.append(result.url)
            else:
                # 处理API错误响应
                error_msg = f"API调用失败，状态码: {rsp.status_code}"
                if hasattr(rsp, 'message'):
                    error_msg += f", 错误信息: {rsp.message}"
                elif hasattr(rsp, 'error'):
                    error_msg += f", 错误: {rsp.error}"
                logger.error(error_msg)
                # 根据状态码给出具体建议
                if rsp.status_code == 401:
                    logger.error("API密钥无效或已过期，请检查 api_key")
                elif rsp.status_code == 403:
                    logger.error("没有权限使用此功能")
                elif rsp.status_code == 429:
                    logger.error("请求频率过高，请稍后重试")
                elif rsp.status_code >= 500:
                    logger.error("服务器内部错误，请稍后重试")
        # === 5. 异常处理 ===
        except requests.exceptions.Timeout as e:
            logger.error(f"API请求超时: {e}")
        except requests.exceptions.ConnectionError as e:
            logger.error(f"网络连接错误: {e}")
        except requests.exceptions.RequestException as e:
            logger.error(f"网络请求异常: {e}")
        except ValueError as e:
            logger.error(f"数据格式异常: {e}")
        except AttributeError as e:
            logger.error(f"响应对象属性异常: {e}")
        except KeyError as e:
            logger.error(f"缺少必要的键: {e}")
        except FileNotFoundError as e:
            logger.error(f"文件不存在: {e}")
        except PermissionError as e:
            logger.error(f"文件权限错误: {e}")
        except Exception as e:
            logger.error(f"未知异常: {e}", exc_info=True)

        if not images:
            logger.warning("未能成功生成任何图片")

        return images
