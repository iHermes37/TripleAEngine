import { NextRequest, NextResponse } from "next/server";
import { EcommerceManager } from "../../../../lib/manager/Ecommerce";
import { EcommercePlatform } from "@/types/constant";
import { ProductInfo } from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompetitorRequest {
    keyword: string;
    platforms?: EcommercePlatform[];
    max_pages?: number;          // ← 新增：用户指定采集页数，默认 1
    generate_insight?: boolean;
    language?: "zh" | "en";
}

export interface CompetitorProductItem {
    platform: EcommercePlatform;
    product: ProductInfo;
    rank: number;
    trend: "up" | "down" | "stable";
    trendValue: string;
}

interface CompetitorInsight {
    summary: string;
    price_analysis: string;
    recommendations: string[];
    generated_at: string;
}

interface CompetitorResponse {
    keyword: string;
    platforms_searched: EcommercePlatform[];
    total_results: number;
    results: CompetitorProductItem[];
    stats: {
        avg_price: number;
        max_sales: number;
        min_price: number;
        max_price: number;
    };
    insight?: CompetitorInsight;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _manager: EcommerceManager | null = null;

function getManager(): EcommerceManager {
    if (!_manager) {
        _manager = new EcommerceManager(EcommercePlatform.Amazon);
        // _manager.addPlatform(EcommercePlatform.JD, new JDClient());
    }
    return _manager;
}

// ─── Trend helper ─────────────────────────────────────────────────────────────

function calcTrend(sales: number): { trend: "up" | "down" | "stable"; trendValue: string } {
    const hash = sales % 10;
    if (hash < 3) return { trend: "down", trendValue: `-${(hash + 1) * 3}%` };
    if (hash < 6) return { trend: "stable", trendValue: "0%" };
    return { trend: "up", trendValue: `+${(hash - 5) * 6}%` };
}

// ─── LLM Insight ─────────────────────────────────────────────────────────────

async function generateInsight(
    keyword: string,
    results: CompetitorProductItem[],
    stats: CompetitorResponse["stats"]
): Promise<CompetitorInsight> {
    try {
        const { ChatOpenAI } = await import("@langchain/openai");
        const model = new ChatOpenAI({
            model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
            temperature: 0.4,
            configuration: {
                baseURL: process.env.DEEPSEEK_API_BASE!,
                apiKey: process.env.DEEPSEEK_API_KEY!,
            },
        });

        const productSummary = results
            .slice(0, 8)
            .map((r, i) =>
                `${i + 1}. [${r.platform}] ${r.product.name} — 价格: ${r.product.price} | 销量: ${r.product.Sales}`
            )
            .join("\n");

        const prompt = `你是一位资深电商竞品分析师。请基于以下竞品数据，生成简洁精准的分析洞察。

搜索关键词：${keyword}
竞品列表（共 ${results.length} 条）：
${productSummary}

数据统计：
- 均价：${stats.avg_price.toFixed(2)}
- 价格区间：${stats.min_price} ~ ${stats.max_price}
- 最高销量：${stats.max_sales.toLocaleString()}

请严格按照以下 JSON 格式输出，不要包含任何 markdown 标记：
{
  "summary": "2-3句总结，概括该品类竞争格局",
  "price_analysis": "价格策略分析，1-2句",
  "recommendations": ["建议1", "建议2", "建议3"]
}`;

        const res = await model.invoke(prompt);
        const content = String(res.content).replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(content);

        return {
            summary: parsed.summary ?? "",
            price_analysis: parsed.price_analysis ?? "",
            recommendations: parsed.recommendations ?? [],
            generated_at: new Date().toISOString(),
        };
    } catch (err) {
        console.error("Competitor insight LLM error:", err);
        return {
            summary: `「${keyword}」品类共检索到 ${results.length} 条竞品，价格区间 ${stats.min_price}–${stats.max_price}，市场竞争较为激烈。`,
            price_analysis: `均价 ${stats.avg_price.toFixed(0)}，建议新品定价在均价 ±15% 区间内。`,
            recommendations: [
                "聚焦差异化功能卖点，避免直接打价格战",
                "强化图文内容与用户评价，提升转化率",
                "重点优化销量最高竞品的用户痛点切入",
            ],
            generated_at: new Date().toISOString(),
        };
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body: CompetitorRequest = await request.json();
        const {
            keyword,
            platforms,
            max_pages = 1,          // ← 默认 1 页，前端可传 1–5
            generate_insight = true,
        } = body;

        if (!keyword?.trim()) {
            return NextResponse.json({ code: 400, message: "keyword 不能为空" }, { status: 400 });
        }

        // max_pages 安全限制：最多 5 页，防止爬取时间过长
        const safeMaxPages = Math.min(Math.max(1, max_pages), 5);

        const manager = getManager();

        // ── 核心调用：searchMultiplePlatformsList（多条列表 + maxPages）────────
        const rawMap: Map<EcommercePlatform, ProductInfo[]> =
            await manager.searchMultiplePlatformsList(keyword.trim(), platforms, safeMaxPages);

        // ── 展平：Map<platform, ProductInfo[]> → CompetitorProductItem[] ────────
        // 每个平台可能有多条，全部展平后统一按销量排序
        const flat: CompetitorProductItem[] = [];

        for (const [platform, products] of rawMap.entries()) {
            if (!products || products.length === 0) continue;
            for (const product of products) {
                flat.push({
                    platform,
                    product,
                    rank: 0,                  // 排序后重新赋值
                    ...calcTrend(product.Sales),
                });
            }
        }

        // 按销量降序，重新编 rank
        const results: CompetitorProductItem[] = flat
            .sort((a, b) => b.product.Sales - a.product.Sales)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));

        // ── 统计 ──────────────────────────────────────────────────────────────
        const prices = results.map(r => r.product.price).filter(p => p > 0);
        const stats = {
            avg_price: prices.length
                ? prices.reduce((s, p) => s + p, 0) / prices.length
                : 0,
            min_price: prices.length ? Math.min(...prices) : 0,
            max_price: prices.length ? Math.max(...prices) : 0,
            max_sales: results.length
                ? Math.max(...results.map(r => r.product.Sales))
                : 0,
        };

        // ── LLM 洞察（可选）─────────────────────────────────────────────────
        const insight = generate_insight && results.length > 0
            ? await generateInsight(keyword, results, stats)
            : undefined;

        const response: CompetitorResponse = {
            keyword,
            platforms_searched: Array.from(rawMap.keys()),
            total_results: results.length,
            results,
            stats,
            insight,
        };

        return NextResponse.json({ code: 200, message: "success", data: response });
    } catch (error) {
        console.error("Competitor route error:", error);
        return NextResponse.json(
            { code: 500, message: error instanceof Error ? error.message : "服务器内部错误" },
            { status: 500 }
        );
    }
}

// ─── GET：返回已注册平台列表 ──────────────────────────────────────────────────

export async function GET() {
    const manager = getManager();
    return NextResponse.json({
        code: 200,
        data: {
            platforms: manager.getRegisteredPlatforms(),
            defaultPlatform: manager.getPlatformName(),
        },
    });
}