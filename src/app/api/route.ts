// 对应 app/main.py -> @app.get("/")
// async def root():
//     return {"message": "API is running"}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "API is running" });
}
