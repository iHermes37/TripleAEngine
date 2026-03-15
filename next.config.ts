// 对应 app/main.py
// FastAPI app -> Next.js App Router

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // app.include_router(insights.router, prefix="/insights") 对应 src/app/api/insights/
  // app.include_router(analytics.router, prefix="/analytics") 对应 src/app/api/analytics/ (已注释)
};

export default nextConfig;
