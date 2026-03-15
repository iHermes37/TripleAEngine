// 对应 app/router/insights.py
// from fastapi import APIRouter
// router = APIRouter(prefix="")

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({});
}
