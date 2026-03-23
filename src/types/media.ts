import { OAuth2Client } from "google-auth-library/build/src/auth/oauth2client";
import { ArticleData, ArticleInfo } from "./article";
import { MediaComment } from "./comment";
import { Platform } from "./constant";
import { VideoData, VideoInfo } from "./video";

export interface SocialMediaService {
    // 
    getPlatformName(): Platform;

    //
    getComments(url: string): Promise<MediaComment[]>;

    // 
    getVideoData(url: string): Promise<VideoData>;
    getArticleData(url: string):Promise<ArticleData>;

    // 上传
    uploadArticle(file:File, metadata:ArticleInfo): Promise<boolean>;
    uploadVideo(file: File, metadata:VideoInfo,credentials?: OAuth2Client): Promise<boolean>;


    // 
    _get_authenticated_service(): Promise<OAuth2Client>;
}
