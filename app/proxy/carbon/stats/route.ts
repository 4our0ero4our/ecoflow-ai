import { NextResponse } from "next/server";

const BACKEND_BASE = "https://ecoflow-backend-490388308724.us-central1.run.app";

export async function GET() {
  const url = `${BACKEND_BASE}/carbon/stats/`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
