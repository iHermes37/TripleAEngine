import { NextRequest, NextResponse } from "next/server";

interface OperationsRequest {
  platform: string;
  account_id?: string;
  date_range?: { start: string; end: string };
  metrics?: string[];
  language?: string;
}

async function generateOperationsReport(
  platform: string,
  metrics: string[],
  dateRange?: { start: string; end: string }
) {
  const mockOverview = {
    total_views: Math.floor(Math.random() * 200000) + 50000,
    total_likes: Math.floor(Math.random() * 20000) + 3000,
    new_followers: Math.floor(Math.random() * 3000) + 500,
    avg_engagement_rate: `${(Math.random() * 5 + 3).toFixed(1)}%`,
  };

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

    const period = dateRange
      ? `${dateRange.start} 至 ${dateRange.end}`
      : "最近 30 天";

    const metricsLabels: Record<string, string> = {
      engagement: "互动分析",
      follower_growth: "粉丝增长",
      conversion: "转化漏斗",
      content_performance: "内容表现",
      best_post_time: "最佳发帖时间",
    };

    const selectedMetrics = metrics.map(m => metricsLabels[m] || m).join("、");

    const prompt = `你是一位社交媒体运营专家。请基于以下数据，生成一份专业的运营分析报告。

平台：${platform}
分析周期：${period}
数据概览：
- 总曝光：${mockOverview.total_views.toLocaleString()}
- 获赞：${mockOverview.total_likes.toLocaleString()}
- 新增粉丝：${mockOverview.new_followers.toLocaleString()}
- 平均互动率：${mockOverview.avg_engagement_rate}

需要分析的维度：${selectedMetrics}

请生成报告，包含：
1. 总结摘要（2-3句）
2. 各维度分析（每个维度1段）
3. 3条具体优化建议

用中文输出，专业实用。`;

    const res = await model.invoke(prompt);
    const content = String(res.content);

    // Try to extract structured sections
    const summaryMatch = content.match(/总结[摘要]?[：:]\s*([\s\S]+?)(?=\n\n|\n[#\d]|\n互动|\n粉丝|\n转化|\n内容|\n最佳|$)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : content.slice(0, 200);

    return {
      overview: mockOverview,
      report: {
        summary,
        sections: metrics.map(m => ({
          metric: m,
          heading: metricsLabels[m] || m,
          content: `${metricsLabels[m] || m}数据表现良好，建议持续优化内容质量与发布节奏。`,
        })),
        recommendations: [
          "增加短视频比例，重点打造 15-30 秒精华内容",
          "在评论区设置互动话题，提升用户参与度",
          `优先在 ${platform === "douyin" ? "工作日 19:00-21:00" : "周末 10:00-12:00"} 发布内容`,
        ],
        generated_at: new Date().toISOString(),
        raw: content,
      },
    };
  } catch (err) {
    console.error("Operations LLM error:", err);
    return {
      overview: mockOverview,
      report: `## ${platform} 运营分析报告\n\n整体运营数据表现良好，互动率高于行业均值。建议加强内容质量，优化发布时间，提升粉丝粘性。`,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OperationsRequest = await request.json();
    const {
      platform = "douyin",
      account_id = "default",
      date_range,
      metrics = ["engagement", "follower_growth"],
    } = body;

    const result = await generateOperationsReport(platform, metrics, date_range);
    const period = date_range
      ? `${date_range.start} ~ ${date_range.end}`
      : `近30天`;

    return NextResponse.json({
      code: 200,
      message: "success",
      data: {
        platform,
        account_id,
        period,
        ...result,
      },
    });
  } catch (error) {
    console.error("Operations route error:", error);
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
