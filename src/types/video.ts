import { MediaComment } from "./comment";

/**
 * YouTube 视频片段信息
 */
export interface VideoSnippet {
  title: string;           // 视频标题，最多100字符
  description: string;     // 视频描述，最多5000字符
  tags: string[];          // 视频标签列表，用于SEO优化
  categoryId: string;      // 视频分类ID（如 1:影视, 10:音乐, 20:游戏）
}


/**
 * YouTube 视频状态配置
 */
export interface VideoStatus {
  privacyStatus: string;               // 隐私状态: public/private/unlisted
  embeddable: boolean;                 // 是否允许嵌入其他网站，默认 true
  license: string;                     // 许可证类型: "youtube" 或 "creativeCommon"
  publicStatsViewable: boolean;        // 是否公开统计数据，默认 true
  selfDeclaredMadeForKids: boolean;    // 是否为儿童内容，默认 false
}




/**
 * 完整的视频信息
 */
// export interface VideoInfo {
//   video_file_path: string;                           // 视频文件本地路径或URL
//   snippet: VideoSnippet;                             // 视频元数据信息
//   status: VideoStatus;                               // 视频状态配置
//   recording_location?: Record<string, unknown> | null; // 拍摄地点信息（可选）
// }

export interface VideoInfo {
    // video_file_path: string;
    schedule_at?: Date;       // 视频发布时间
    title: string;           // 视频标题，最多100字符
    description: string;     // 视频描述，最多5000字符
    tags: string[];          // 视频标签列表，用于SEO优化
    categoryId: string;      // 视频分类ID（如 1:影视, 10:音乐, 20:游戏）
    privacyStatus: string;               // 隐私状态: public/private/unlisted
}


/**
 * 视频评论信息
 */
export interface VideoComments {
  publishedAt: string | null;      // 评论发布时间（ISO 8601格式）
  textDisplay: string | null;      // 评论文本内容（纯文本格式）
  likeCount: number | null;        // 评论点赞数量
}




export interface VideoData {
    name: string;           // 视频名称/标题
    viewCount: number;      // 观看数量
    likeCount: number;      // 点赞数
    shareCount: number;     // 转发数
    commentCount: number;   // 评论数
    comments: MediaComment[]; // 评论列表
    createTime?: number;    // 创建时间戳
}