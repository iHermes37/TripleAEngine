import { NextRequest, NextResponse } from "next/server";

interface PublishRequest {
  media: { type: string; source: string; task_id?: string; url?: string };
  platforms: string[];
  post_config: {
    title: string;
    description?: string;
    tags?: string[];
    schedule_at?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequest = await request.json();
    const { media, platforms, post_config } = body;

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ code: 400, message: "请选择至少一个发布平台" }, { status: 400 });
    }

    const publish_id = `pub_${Date.now().toString(36)}`;
    const isScheduled = !!post_config.schedule_at;

    // Simulate publish results per platform
    const results = platforms.map(platform => {
      // Simulate occasional failure for demo realism
      const failed = platform === "instagram" && Math.random() < 0.3;
      if (failed) {
        return { platform, status: "failed", error: "access_token_expired" };
      }
      if (isScheduled) {
        return { platform, status: "scheduled", scheduled_at: post_config.schedule_at };
      }
      return {
        platform,
        status: "published",
        post_url: `https://${platform}.com/video/${Date.now().toString(36)}`,
        published_at: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      code: 200,
      message: "success",
      data: { publish_id, results },
    });
  } catch (error) {
    console.error("Publish route error:", error);
    return NextResponse.json(
      { code: 500, message: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
