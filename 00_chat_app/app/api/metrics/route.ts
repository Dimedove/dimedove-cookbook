import { NextResponse } from "next/server";
import { getAppMetrics } from "@/lib/dimedove-api";

export async function GET() {
  try {
    const metrics = await getAppMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("GET /api/metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch app metrics" },
      { status: 500 },
    );
  }
}
