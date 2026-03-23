
export interface ArticleData {
    title: string;              // 文章标题
    readCount: number;          // 阅读量（对应观看数量）
    likeCount: number;          // 点赞数
    shareCount: number;         // 转发/分享数
    commentCount: number;       // 评论数
    collectCount?: number;      // 收藏数（文章常用）
    createTime?: number;        // 发布时间戳
}


export interface ArticleInfo {
    title: string;           // 文章标题，最多100字符
    categoryId: string;      // 视频分类ID（如 1:影视, 10:音乐, 20:游戏）
    privacyStatus: string;               // 隐私状态: public/private/unlisted
}