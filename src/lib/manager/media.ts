import { SocialMediaService } from "@/types/media";
import { YoutubeClient } from "../media/youtube";
import { Platform } from "@/types/constant";
import { VideoData, VideoInfo } from "@/types/video";
import { OAuth2Client } from "google-auth-library";
import { ArticleData, ArticleInfo } from "@/types/article";
import { MediaComment } from "@/types/comment";


export class SocialMediaManager {
    private youtube_client: YoutubeClient;
    private social_media_map: Map<Platform, SocialMediaService>;
    private current_media: SocialMediaService | null;

    constructor() {
        this.social_media_map = new Map<Platform, SocialMediaService>();
        this.current_media = null;
        this.youtube_client = new YoutubeClient();

         // 在构造函数中注册所有平台
        this._registerAllPlatforms();
    }

    // /**
    //  * 注册社交媒体服务
    //  * @param media 社交媒体服务实例数组
    //  * @returns 是否注册成功
    //  */
    // registerSocialMedias(media: SocialMediaService[]): boolean {
    //     try {
    //         for (const service of media) {
    //             const platform = service.getPlatformName();
    //             this.social_media_map.set(platform, service);
    //             console.log(`✅ 已注册平台: ${Platform[platform]}`);
    //         }
    //         console.log(`✅ 成功注册 ${media.length} 个社交媒体平台`);
    //         return true;
    //     } catch (error) {
    //         console.error(`❌ 注册社交媒体服务失败: ${error}`);
    //         return false;
    //     }
    // }
    private _registerAllPlatforms(): void {
        try {
            // 注册 YouTube
            this.social_media_map.set(Platform.YouTube, this.youtube_client);
            console.log(`✅ 已注册平台: ${Platform[Platform.YouTube]}`);
            
            // 可以在这里添加其他平台
            // 例如：注册 TikTok
            // const tiktokClient = new TikTokClient();
            // this.social_media_map.set(Platform.TikTok, tiktokClient);
            // console.log(`✅ 已注册平台: ${Platform[Platform.TikTok]}`);
            
            // 注册小红书
            // const xhsClient = new XiaoHongShuClient();
            // this.social_media_map.set(Platform.XiaoHongShu, xhsClient);
            // console.log(`✅ 已注册平台: ${Platform[Platform.XiaoHongShu]}`);
            
            // 注册 Instagram
            // const instagramClient = new InstagramClient();
            // this.social_media_map.set(Platform.Instagram, instagramClient);
            // console.log(`✅ 已注册平台: ${Platform[Platform.Instagram]}`);
            
            console.log(`✅ 成功注册 ${this.social_media_map.size} 个社交媒体平台`);
        } catch (error) {
            console.error(`❌ 注册社交媒体服务失败: ${error}`);
            throw error;
        }
    }

    /**
     * 获取指定平台的社交媒体客户端
     * @param platform 平台类型
     * @returns 社交媒体服务实例
     */
    getSocialMediaClient(platform: Platform): SocialMediaService {
        const client = this.social_media_map.get(platform);
        if (!client) {
            throw new Error(`未找到平台 ${Platform[platform]} 的客户端，请先注册`);
        }
        return client;
    }

    /**
     * 设置当前使用的社交媒体平台
     * @param platform 平台类型
     */
    setCurrentPlatform(platform: Platform): void {
        this.current_media = this.getSocialMediaClient(platform);
        console.log(`已切换到平台: ${Platform[platform]}`);
    }

    /**
     * 获取当前平台
     * @returns 当前平台实例
     */
    getCurrentPlatform(): SocialMediaService | null {
        return this.current_media;
    }

    /**
     * 获取所有已注册的平台
     * @returns 已注册的平台列表
     */
    getRegisteredPlatforms(): Platform[] {
        return Array.from(this.social_media_map.keys());
    }

    /**
     * 检查平台是否已注册
     * @param platform 平台类型
     * @returns 是否已注册
     */
    isPlatformRegistered(platform: Platform): boolean {
        return this.social_media_map.has(platform);
    }

    /**
     * 上传视频到指定平台
     * @param file 视频文件
     * @param videoInfo 视频信息
     * @param platform 目标平台（可选，默认使用当前平台）
     * @param credentials OAuth2凭证（可选）
     * @returns 是否上传成功
     */
    async uploadVideo(
        file: File,
        videoInfo: VideoInfo,
        platform?: Platform,
        credentials?: OAuth2Client
    ): Promise<boolean> {
        try {
            let client: SocialMediaService;
            
            if (platform !== undefined) {
                client = this.getSocialMediaClient(platform);
            } else if (this.current_media) {
                client = this.current_media;
            } else {
                throw new Error("未指定平台且未设置当前平台");
            }

            console.log(`正在上传视频到 ${Platform[client.getPlatformName()]}...`);
            return await client.uploadVideo(file, videoInfo, credentials);
        } catch (error) {
            console.error(`❌ 上传视频失败: ${error}`);
            return false;
        }
    }

    /**
     * 上传文章到指定平台
     * @param file 文章文件
     * @param articleInfo 文章信息
     * @param platform 目标平台（可选，默认使用当前平台）
     * @returns 是否上传成功
     */
    async uploadArticle(
        file: File,
        articleInfo: ArticleInfo,
        platform?: Platform
    ): Promise<boolean> {
        try {
            let client: SocialMediaService;
            
            if (platform !== undefined) {
                client = this.getSocialMediaClient(platform);
            } else if (this.current_media) {
                client = this.current_media;
            } else {
                throw new Error("未指定平台且未设置当前平台");
            }

            console.log(`正在上传文章到 ${Platform[client.getPlatformName()]}...`);
            return await client.uploadArticle(file, articleInfo);
        } catch (error) {
            console.error(`❌ 上传文章失败: ${error}`);
            return false;
        }
    }

    /**
     * 获取视频数据
     * @param url 视频URL
     * @param platform 目标平台（可选，默认使用当前平台）
     * @returns 视频数据
     */
    async getVideoData(url: string, platform?: Platform): Promise<VideoData> {
        try {
            let client: SocialMediaService;
            
            if (platform !== undefined) {
                client = this.getSocialMediaClient(platform);
            } else if (this.current_media) {
                client = this.current_media;
            } else {
                throw new Error("未指定平台且未设置当前平台");
            }

            return await client.getVideoData(url);
        } catch (error) {
            console.error(`❌ 获取视频数据失败: ${error}`);
            throw error;
        }
    }

    /**
     * 获取文章数据
     * @param url 文章URL
     * @param platform 目标平台（可选，默认使用当前平台）
     * @returns 文章数据
     */
    async getArticleData(url: string, platform?: Platform): Promise<ArticleData> {
        try {
            let client: SocialMediaService;
            
            if (platform !== undefined) {
                client = this.getSocialMediaClient(platform);
            } else if (this.current_media) {
                client = this.current_media;
            } else {
                throw new Error("未指定平台且未设置当前平台");
            }

            return await client.getArticleData(url);
        } catch (error) {
            console.error(`❌ 获取文章数据失败: ${error}`);
            throw error;
        }
    }

    /**
     * 获取评论
     * @param url 内容URL
     * @param platform 目标平台（可选，默认使用当前平台）
     * @returns 评论列表
     */
    async getComments(url: string, platform?: Platform): Promise<MediaComment[]> {
        try {
            let client: SocialMediaService;
            
            if (platform !== undefined) {
                client = this.getSocialMediaClient(platform);
            } else if (this.current_media) {
                client = this.current_media;
            } else {
                throw new Error("未指定平台且未设置当前平台");
            }

            return await client.getComments(url);
        } catch (error) {
            console.error(`❌ 获取评论失败: ${error}`);
            return [];
        }
    }

    /**
     * 移除平台
     * @param platform 要移除的平台
     * @returns 是否移除成功
     */
    unregisterPlatform(platform: Platform): boolean {
        const removed = this.social_media_map.delete(platform);
        if (removed && this.current_media?.getPlatformName() === platform) {
            this.current_media = null;
        }
        return removed;
    }

    /**
     * 清空所有平台
     */
    clearAllPlatforms(): void {
        this.social_media_map.clear();
        this.current_media = null;
        console.log("已清空所有平台");
    }
}



// // 创建管理器实例（自动注册所有平台）
// const manager = new SocialMediaManager();

// // 直接使用 YouTube 客户端（无需注册）
// const credentials = await manager.getYoutubeClient()._get_authenticated_service();

// // 设置当前平台
// manager.setCurrentPlatform(Platform.YouTube);

// // 上传视频
// const videoInfo: VideoInfo = {
//     title: "我的视频",
//     description: "视频描述",
//     tags: ["tag1", "tag2"],
//     categoryId: "22",
//     privacyStatus: "public"
// };

// await manager.uploadVideo(file, videoInfo, undefined, credentials);

// // 获取视频数据
// const videoData = await manager.getVideoData("https://youtu.be/xxx");

// // 获取评论
// const comments = await manager.getComments("https://youtu.be/xxx");

// // 检查已注册的平台
// console.log(manager.getRegisteredPlatforms()); // [Platform.YouTube]
// console.log(manager.getPlatformCount()); // 1