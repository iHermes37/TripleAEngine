

import { HandlerFactory } from '@/lib/platform/chat/feishu/handlers';
import { NextRequest, NextResponse } from 'next/server';

// 详细日志中间件（Next.js 中直接在路由中实现）
async function logRequest(req: NextRequest) {
    const body = await req.clone().json().catch(() => null);
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.nextUrl.pathname}`);
    if (body && Object.keys(body).length > 0) {
        console.log("Body:", JSON.stringify(body, null, 2));
    }
    return body;
}

// POST 方法处理 Webhook
export async function POST(req: NextRequest) {
    console.log("\n========== 收到飞书回调 ==========");
    
    try {
        // 记录日志并获取请求体
        const body = await logRequest(req);
        
        if (!body) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }
        
        // 获取事件类型
        const eventType = body.type || body.header?.event_type;
        console.log("📌 事件类型:", eventType);
        
        // 创建处理器并执行
        const handler = HandlerFactory.create(eventType);
        const response = await handler.handle(body);
        
        return response;
        
    } catch (error) {
        console.error("❌ Webhook 处理失败:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET 方法用于健康检查
export async function GET(req: NextRequest) {
    return new NextResponse('Webhook endpoint is ready. Please use POST method.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
    });
}