// app/api/marketing/route.ts
import { VideoClient } from '@/lib/models/aigc/videoimage';
import { NextRequest, NextResponse } from 'next/server';

interface GenerateVideoRequest {
    imageUrl: string[];
    prompt: string;
    duration?: number;
    resolution?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateVideoRequest = await request.json();

        // 验证至少一张图片
        if (!body.imageUrl || body.imageUrl.length === 0) {
            return NextResponse.json(
                { error: '至少需要一张图片' },
                { status: 400 }
            );
        }

        // 验证第一张图片URL
        try {
            new URL(body.imageUrl[0]);
        } catch {
            return NextResponse.json(
                { error: '图片URL格式不正确' },
                { status: 400 }
            );
        }

        console.log('接收到请求:', {
            imageUrl: body.imageUrl,
            prompt: body.prompt,
            duration: body.duration || 5,
            resolution: body.resolution || '720p'
        });

        // 确保 image2video 是异步的
        const videoClient = new VideoClient();
        const videoUrl = await videoClient.image2video(body.imageUrl, body.prompt);

        return NextResponse.json({
            success: true,
            videoUrl: videoUrl,
            message: '视频生成成功'
        });

    } catch (error) {
        console.error('视频生成失败:', error);
        return NextResponse.json(
            { 
                success: false,
                error: '视频生成失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}