// 对应 app/router/analytics.py
// from fastapi import APIRouter
// router = APIRouter(prefix="")
// NOTE: 在 main.py 中此 router 已被注释: # app.include_router(analytics.router, prefix="/analytics")

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({});
}
