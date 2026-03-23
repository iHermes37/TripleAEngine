import { SocialMediaManager } from "@/lib/manager/media_adapter";
import { Platform } from "@/types/constant";
import { VideoInfo } from "@/types/video";
import { NextRequest, NextResponse } from "next/server";

// 请求体接口（支持 FormData）
interface PublishRequest {
  video: File;
  platforms: Array<Platform>;
  post_config: {
    title: string;
    privacy: "public" | "private" | "unlisted";
    description?: string;
    tags?: string[];
    schedule_at?: Date;
    categoryId?: string;  };
}

// 发布结果接口
interface PublishResult {
  platform: Platform;
  status: "success" | "failed" | "scheduled";
  post_url?: string;
  video_id?: string;
  error?: string;
  scheduled_at?: string;
  published_at?: string;
}

// 示例
// const request: PublishRequest = {
//   media: {
//     type: "file",
//     source: "/videos/demo.mp4",  // 只接受本地路径
//   },
//   platforms: ["youtube", "bilibili"],
//   post_config: {
//     title: "我的 Vlog",
//     privacy: "public",
//   },
// };

// app/api/publish/route.ts

// 请求体接口（支持 FormData）
interface PublishRequest {
  video: File;
  platforms: Array<Platform>;
  post_config: {
    title: string;
    privacy: "public" | "private" | "unlisted";
    description?: string;
    tags?: string[];
    schedule_at?: Date;
    categoryId?: string;
  };
}

// 发布结果接口
interface PublishResult {
  platform: Platform;
  status: "success" | "failed" | "scheduled";
  post_url?: string;
  video_id?: string;
  error?: string;
  scheduled_at?: string;
  published_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 处理 FormData 上传（因为包含文件）
    const formData = await request.formData();
    
    // 提取数据
    const video = formData.get("video") as File;
    const platformsStr = formData.get("platforms") as string;
    const postConfigStr = formData.get("post_config") as string;
    
    // 验证必要参数
    if (!video) {
      return NextResponse.json(
        { code: 400, message: "请提供视频文件" },
        { status: 400 }
      );
    }
    
    if (!platformsStr) {
      return NextResponse.json(
        { code: 400, message: "请选择至少一个发布平台" },
        { status: 400 }
      );
    }
    
    // 解析 JSON 数据
    const platforms: Platform[] = JSON.parse(platformsStr);
    const post_config = JSON.parse(postConfigStr);
    
    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { code: 400, message: "请选择至少一个发布平台" },
        { status: 400 }
      );
    }
    
    // 验证视频文件类型
    const allowedVideoTypes = ["video/mp4", "video/mov", "video/avi", "video/mkv"];
    if (!allowedVideoTypes.includes(video.type)) {
      return NextResponse.json(
        { code: 400, message: "不支持的视频格式，请上传 MP4、MOV、AVI 或 MKV 格式" },
        { status: 400 }
      );
    }
    
    // 验证视频文件大小（例如限制 500MB）
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (video.size > maxSize) {
      return NextResponse.json(
        { code: 400, message: "视频文件过大，请上传小于 500MB 的视频" },
        { status: 400 }
      );
    }
    
    // 生成发布 ID
    const publish_id = `pub_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
    const isScheduled = !!post_config.schedule_at;
    
    console.log(`开始处理发布任务: ${publish_id}`);
    console.log(`目标平台: ${platforms.map(p => Platform[p]).join(", ")}`);
    console.log(`视频信息: ${video.name} (${(video.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`是否定时发布: ${isScheduled}`);
    
    // 创建社交媒体管理器
    const manager = new SocialMediaManager();
    
    // 准备视频元数据（转换为 VideoInfo 格式）
    const videoInfo: VideoInfo = {
      title: post_config.title,
      description: post_config.description || "",
      tags: post_config.tags || [],
      categoryId: post_config.categoryId || "22", // 默认 "22" 是娱乐分类
      privacyStatus: post_config.privacy, // privacy 直接对应 privacyStatus
    };
    
    // 如果是定时发布，保存到数据库
    // if (isScheduled) {
    //   await saveScheduledPublish(
    //     publish_id,
    //     video,
    //     videoInfo,
    //     platforms,
    //     post_config.schedule_at!
    //   );
      
    //   return NextResponse.json({
    //     code: 200,
    //     message: "定时发布任务已创建",
    //     data: {
    //       publish_id,
    //       status: "scheduled",
    //       scheduled_at: post_config.schedule_at,
    //       platforms: platforms.map(p => Platform[p]),
    //     },
    //   });
    // }
    
    // 立即发布：并行上传到所有平台
    const results = await Promise.allSettled(
      platforms.map(async (platform) => {
        try {
          console.log(`开始上传到平台: ${Platform[platform]}`);
          
          // 获取平台客户端
          const client = manager.getSocialMediaClient(platform);
          
          // 获取认证凭证（根据平台获取）
          let credentials;
          if (platform === Platform.YouTube) {
            credentials = await client._get_authenticated_service();
          }
          // 添加其他平台的认证逻辑
          // else if (platform === Platform.TikTok) {
          //   credentials = await getTikTokCredentials();
          // }
          
          // 上传视频
          const success = await client.uploadVideo(
            video,
            videoInfo,
            credentials
          );
          
          if (success) {
            // 这里应该从上传结果中获取实际的视频 ID 和 URL
            // 目前简化处理，实际需要根据平台返回的结果来填充
            // const postUrl = getPostUrlByPlatform(platform, "temp_id");
            
            return {
              platform,
              status: "success" as const,
              // post_url: postUrl,
              // video_id: "temp_id", // 实际应该从返回结果获取
              published_at: new Date().toISOString(),
            };
          } else {
            throw new Error("上传失败");
          }
        } catch (error) {
          console.error(`上传到 ${Platform[platform]} 失败:`, error);
          return {
            platform,
            status: "failed" as const,
            error: error instanceof Error ? error.message : "上传失败",
          };
        }
      })
    );
    
    // 整理结果
    const publishResults: PublishResult[] = results.map(result => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          platform: Platform.YouTube, // 默认值，实际不会到这里
          status: "failed",
          error: result.reason?.message || "未知错误",
        };
      }
    });
    
    // 统计成功和失败数量
    const successCount = publishResults.filter(r => r.status === "success").length;
    const failedCount = publishResults.filter(r => r.status === "failed").length;
    
    console.log(`发布完成: 成功 ${successCount}, 失败 ${failedCount}`);
    
    // 保存发布记录到数据库
    // await savePublishRecord(publish_id, publishResults);
    
    return NextResponse.json({
      code: 200,
      message: "发布完成",
      data: {
        publish_id,
        results: publishResults,
        summary: {
          total: platforms.length,
          success: successCount,
          failed: failedCount,
          platforms: platforms.map(p => Platform[p]),
        },
      },
    });
  } catch (error) {
    console.error("Publish route error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}

// 辅助函数：根据平台获取视频 URL
function getPostUrlByPlatform(platform: Platform, videoId: string): string {
  switch (platform) {
    case Platform.YouTube:
      return `https://youtu.be/${videoId}`;
    case Platform.TikTok:
      return `https://www.tiktok.com/@username/video/${videoId}`;
    case Platform.XiaoHongShu:
      return `https://www.xiaohongshu.com/explore/${videoId}`;
    case Platform.Instagram:
      return `https://www.instagram.com/p/${videoId}`;
    default:
      return "";
  }
}

// 辅助函数：保存定时发布任务到数据库
async function saveScheduledPublish(
  publishId: string,
  video: File,
  videoInfo: VideoInfo,
  platforms: Platform[],
  scheduledAt: Date
): Promise<void> {
  // TODO: 实现数据库保存逻辑
  console.log(`保存定时发布任务: ${publishId}`);
  console.log(`  - 计划时间: ${scheduledAt.toISOString()}`);
  console.log(`  - 平台: ${platforms.map(p => Platform[p]).join(", ")}`);
  console.log(`  - 视频: ${video.name}`);
  
  // 示例：保存到数据库
  // await db.scheduledPublishes.create({
  //   data: {
  //     id: publishId,
  //     videoName: video.name,
  //     videoSize: video.size,
  //     videoType: video.type,
  //     videoData: await video.arrayBuffer(), // 注意：大文件不应直接存数据库，建议存到 OSS
  //     videoInfo,
  //     platforms,
  //     scheduledAt,
  //     status: "pending",
  //     createdAt: new Date(),
  //   }
  // });
}

// 辅助函数：保存发布记录到数据库
async function savePublishRecord(publishId: string, results: PublishResult[]): Promise<void> {
  // TODO: 实现数据库保存逻辑
  console.log(`保存发布记录: ${publishId}`);
  // await db.publishRecords.create({
  //   data: {
  //     id: publishId,
  //     results,
  //     createdAt: new Date(),
  //   }
  // });
}
