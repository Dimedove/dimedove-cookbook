import { NextResponse } from "next/server";
import { getAppConfig } from "@/lib/dimedove-api";

export async function GET() {
  try {
    const config = await getAppConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/config error:", error);
    return NextResponse.json(
      { error: "Failed to fetch app config" },
      { status: 500 },
    );
  }
}
