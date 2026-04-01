import { NextResponse } from 'next/server';
import { getFeishuClient } from './feishu-client';

const VERIFICATION_TOKEN = process.env.FEISHU_VERIFICATION_TOKEN || '';

// ============ 事件处理器接口 ============
export interface EventHandler {
    canHandle(eventType: string): boolean;
    handle(body: any): Promise<NextResponse | void>;
}

// ============ URL 验证处理器 ============
export class UrlVerificationHandler implements EventHandler {
    canHandle(eventType: string): boolean {
        return eventType === 'url_verification';
    }
    
    async handle(body: any): Promise<NextResponse> {
        console.log("🔐 URL 验证请求");
    
        if (body.token && body.token !== VERIFICATION_TOKEN) {
            console.log("⚠️ Token 验证失败");
            console.log("期望:", VERIFICATION_TOKEN);
            console.log("收到:", body.token);
            return NextResponse.json({ error: "Invalid token" }, { status: 403 });
        }
    
        console.log("✅ Token 验证通过");
        return NextResponse.json({ challenge: body.challenge });
    }
}
// ============ 机器人进群处理器 ============
export class BotAddedHandler implements EventHandler {
    canHandle(eventType: string): boolean {
        return eventType === 'im.chat.member.bot.added_v1';
    }
    
    async handle(body: any): Promise<NextResponse> {
        console.log("✅ 机器人被加入群聊");
        
        const event = body.event;
        const chat_id = event.chat_id;
        const operator_id = event.operator_id;
        
        console.log("📝 群ID:", chat_id);
        console.log("👤 操作者:", JSON.stringify(operator_id, null, 2));
        
        // 异步发送欢迎消息（不阻塞响应）
        this.sendWelcomeMessage(chat_id).catch(console.error);
        
        // 立即返回响应
        return NextResponse.json({ code: 0, msg: 'success' });
    }
    
    private async sendWelcomeMessage(chat_id: string) {
        try {
            const client = getFeishuClient();
            await client.im.message.create({
                params: { receive_id_type: "chat_id" },
                data: {
                    receive_id: chat_id,
                    msg_type: "text",
                    content: JSON.stringify({
                        text: "大家好，我是机器人 🤖\n在群里 @我 就可以和我对话啦！",
                    }),
                },
            });
            console.log("✅ 欢迎消息发送成功");
        } catch (error) {
            console.error("❌ 发送欢迎消息失败:", error);
        }
    }
}

// ============ 消息接收处理器 ============
export class MessageReceiveHandler implements EventHandler {
    canHandle(eventType: string): boolean {
        return eventType === 'im.message.receive_v1';
    }
    
    async handle(body: any): Promise<NextResponse> {
        console.log("💬 收到消息事件");
        
        const event = body.event;
        const message = event.message;
        const sender = event.sender;
        
        this.logMessageDetails(message, sender);
        
        // 解析消息内容
        const text = this.parseMessageContent(message);
        
        // 判断是否需要回复
        const shouldReply = this.shouldReply(message, text);
        
        // 异步处理回复（不阻塞响应）
        if (shouldReply) {
            this.sendReply(message, sender, text).catch(console.error);
        }
        
        // 立即返回响应
        return NextResponse.json({ code: 0, msg: 'success' });
    }
    
    private logMessageDetails(message: any, sender: any): void {
        console.log("\n=== 消息详情 ===");
        console.log("📱 chat_id:", message.chat_id);
        console.log("💬 chat_type:", message.chat_type);
        console.log("📝 message_type:", message.message_type);
        console.log("📄 content:", message.content);
        console.log("👤 sender:", JSON.stringify(sender, null, 2));
    }
    
    private parseMessageContent(message: any): string {
        try {
            const content = JSON.parse(message.content);
            return content.text || "";
        } catch {
            return message.content;
        }
    }
    
    private shouldReply(message: any, text: string): boolean {
        // 私聊：直接回复
        if (message.chat_type === "p2p") {
            console.log("✅ 私聊消息，准备回复");
            return true;
        }
        
        // 群聊：检查是否被 @
        if (message.chat_type === "group") {
            console.log("\n=== 群聊@检测 ===");
            console.log("🔍 text包含@_user_:", text.includes("@_user_"));
            console.log("🔍 text包含@_all:", text.includes("@_all"));
            console.log("🔍 mentions存在:", !!message.mentions);
            console.log("🔍 mentions数量:", message.mentions?.length || 0);
            
            if (text.includes("@_user_") || text.includes("@_all")) {
                console.log("✅ 通过文本标记判断为需要回复");
                return true;
            }
            
            if (message.mentions && message.mentions.length > 0) {
                console.log("✅ 通过 mentions 判断为需要回复");
                return true;
            }
            
            console.log("❌ 未检测到@机器人，不回复");
        }
        
        return false;
    }
    
    private async sendReply(message: any, sender: any, text: string): Promise<void> {
        try {
            const client = getFeishuClient();
            let replyText = "hello 你好";
            
            // 群聊时 @ 发送者
            if (message.chat_type === "group" && sender?.sender_id?.open_id) {
                replyText = `<at user_id="${sender.sender_id.open_id}">${sender.sender_id.open_id}</at> hello 你好`;
            }
            
            await client.im.message.create({
                params: { receive_id_type: "chat_id" },
                data: {
                    receive_id: message.chat_id,
                    msg_type: "text",
                    content: JSON.stringify({ text: replyText }),
                },
            });
            console.log("✅ 消息发送成功");
        } catch (error) {
            console.error("❌ 发送消息失败:", error);
        }
    }
}

// ============ 默认处理器 ============
export class DefaultHandler implements EventHandler {
    canHandle(eventType: string): boolean {
        return true;
    }
    
    async handle(body: any): Promise<NextResponse> {
        console.log("📌 其他事件:", body.type || body.header?.event_type);
        return NextResponse.json({ code: 0, msg: 'success' });
    }
}

// ============ 事件处理器工厂 ============
export class HandlerFactory {
    static create(eventType: string): EventHandler {
        switch(eventType) {
            case 'url_verification':
                return new UrlVerificationHandler();
            case 'im.chat.member.bot.added_v1':
                return new BotAddedHandler();
            case 'im.message.receive_v1':
                return new MessageReceiveHandler();
            default:
                return new DefaultHandler();
        }
    }
}