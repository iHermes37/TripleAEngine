import { VideoComments } from "../../types/video";
import { youtubeClient } from "../media/youtube";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

// 1. 用 zod 定义结构（对应你的 interface）
export const HolidayGreetingsSchema = z.object({
    holiday: z.string().describe("节日名称，如 Christmas Day"),
    time:    z.string().describe("节日日期，格式 YYYY-MM-DD"),
    greeting: z.string().describe("针对该节日的外贸祝福语，英文"),
});


const model = new ChatOpenAI({
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    temperature: 0.1,
    maxTokens: 2000,
    configuration: {
        baseURL: process.env.DEEPSEEK_API_BASE!,
        apiKey: process.env.DEEPSEEK_API_KEY!,
    },
    maxRetries: 3,
    timeout: 60000,
})


async function analyzeVideoComments(videoId: string): Promise<string> {
    // 从 URL 中提取纯 Video ID
    const extractVideoId = (input: string): string => {
        // 匹配 youtu.be/XXXX 或 v=XXXX 格式
        const match = input.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : input; // 如果匹配不到就原样返回（已经是纯ID）
    };

    const youtubeclient = new youtubeClient();
    const cleanVideoId = extractVideoId(videoId);
    
    const comments: VideoComments[] = await youtubeclient.crawl_video_comments(cleanVideoId); // ← await
    console.log(`获取到 ${comments.length} 条评论`);
    console.log(comments.slice(0, 3)); // 只打印前3条看看
    
    return "This is a test report";
}

export async function generateHolidayGreeting(
    holiday: string,
    date: string
): Promise<HolidayGreetings> {
    const response = await model.invoke([
        {
            role: "system",
            content: `你是外贸助手，只输出 JSON，不要有任何多余文字和markdown。
格式严格如下：
{
  "holiday": "节日英文名",
  "time": "YYYY-MM-DD",
  "greeting": "英文祝福语"
}`,
        },
        {
            role: "user",
            content: `为 ${holiday}（${date}）生成一条专业的外贸客户祝福语。`,
        },
    ]);

    // ✅ 强转为 string
    const raw = response.content as string;
    
    return extractJSON(raw);
}

function extractJSON(text: string): HolidayGreetings {
    try {
        return JSON.parse(text.trim());
    } catch {}

    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);

    throw new Error(`无法解析 JSON: ${text}`);
}

// 测试
// async function main() {
//     const greeting = await generateHolidayGreeting("St. Patrick's Day", "2026-03-17");
//     console.log(greeting);
// }

// main().catch(console.error);

// =================================

class AICustomerService{
    constructor(){

    }

    initializeSmartBot(){

    }

    generateAIResponse(){

    }

    handoffToHumanService(){

    }

    handleCustomerMessage(){

    }

}