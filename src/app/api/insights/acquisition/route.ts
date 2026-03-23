
import {TradewheelScraper} from "../../../../lib/crawler/tradewheelScraper"
import { NextRequest, NextResponse } from "next/server";

interface AcquisitionRequest {
  product: string;
  target_industry?: string;
  limit?: number;
  region?: string;
}

// interface Lead {
//   lead_id: string;
//   company: string;
//   contact_name: string;
//   phone_number: string;
//   email: string;
//   source_link: string;
//   industry?: string;
//   confidence_score?: number;
// }

function generateDownloadToken(data: unknown): string {
  return Buffer.from(JSON.stringify({ data, ts: Date.now() }))
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 32);
}

// async function generateLeadsWithLLM(product: string, industry: string, region: string, limit: number): Promise<Lead[]> {
//   try {
//     const { ChatOpenAI } = await import("@langchain/openai");
//     const model = new ChatOpenAI({
//       model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
//       temperature: 0.6,
//       configuration: {
//         baseURL: process.env.DEEPSEEK_API_BASE!,
//         apiKey: process.env.DEEPSEEK_API_KEY!,
//       },
//     });

//     const prompt = `你是一位B2B获客专家。请为以下产品生成 ${Math.min(limit, 10)} 条潜在目标客户线索（模拟数据，用于演示）。

// 产品：${product}
// 目标行业：${industry || "不限"}
// 目标地区：${region}

// 请以 JSON 数组格式返回，每条线索包含：
// - lead_id: "l001" 格式
// - company: 公司名称（真实感的${region}本土企业）
// - contact_name: 联系人姓名
// - phone_number: 符合${region}格式的电话
// - email: 企业邮箱
// - source_link: 来源URL（linkedin/官网等）
// - industry: 所属行业
// - confidence_score: 0.6-0.95 之间的置信度

// 只返回 JSON 数组，不要其他文字。`;

//     const res = await model.invoke(prompt);
//     const content = String(res.content).trim();
//     const jsonMatch = content.match(/\[[\s\S]*\]/);
//     if (jsonMatch) {
//       return JSON.parse(jsonMatch[0]);
//     }
//     throw new Error("No JSON array found");
//   } catch (err) {
//     console.error("LLM leads generation error:", err);
//     // Fallback mock leads
//     const regionNames: Record<string, string> = { CN: "中国", US: "美国", EU: "欧洲", SEA: "东南亚", JP: "日本", KR: "韩国" };
//     return Array.from({ length: Math.min(limit, 8) }, (_, i) => ({
//       lead_id: `l${String(i + 1).padStart(3, "0")}`,
//       company: `${regionNames[region] || region}${industry || "贸易"}有限公司 ${i + 1}`,
//       contact_name: ["张伟", "李明", "王芳", "陈强", "刘华", "赵磊", "孙丽", "周建"][i] || `联系人${i + 1}`,
//       phone_number: region === "CN" ? `+86-138${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}` : `+1-555-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
//       email: `contact${i + 1}@company${i + 1}.com`,
//       source_link: `https://www.linkedin.com/company/example-${i + 1}`,
//       industry: industry || "制造业",
//       confidence_score: parseFloat((Math.random() * 0.3 + 0.65).toFixed(2)),
//     }));
//   }
// }




export async function POST(request: NextRequest) {
  try {
    const body: AcquisitionRequest = await request.json();
    const { product, target_industry = "", limit = 20, region = "CN" } = body;

    console.log('=== Tradewheel 买家信息采集工具 ===\n');
        
    const scraper = new TradewheelScraper();

    // 初始化浏览器
    await scraper.initialize();
        
    // 处理手动验证
    await scraper.handleManualVerification();

    if (!product?.trim()) {
      return NextResponse.json({ code: 400, message: "product 不能为空" }, { status: 400 });
    }

    // const leads = await generateLeadsWithLLM(product, target_industry, region, limit);

    const leads = await scraper.searchByKeyword(product);




    const download_token = generateDownloadToken(leads);

    return NextResponse.json({
      code: 200,
      message: "success",
      data: { leads, total: leads.length, download_token },
    });
  } catch (error) {
    console.error("Acquisition route error:", error);
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}

// CSV download endpoint via query param
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ code: 400, message: "缺少 token" }, { status: 400 });
  }

  // In production, retrieve from cache/DB by token. Here we return a sample CSV.
  const csv = [
    "lead_id,company,contact_name,phone_number,email,source_link,industry,confidence_score",
    "l001,示例科技有限公司,张伟,+86-13812345678,contact@example.com,https://linkedin.com/company/example,制造业,0.87",
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads_${Date.now()}.csv"`,
    },
  });
}
