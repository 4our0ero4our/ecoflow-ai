import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://ecoflow-backend-490388308724.us-central1.run.app";

/**
 * PUT /proxy/alerts/[id] — resolve/close an alert on the backend.
 * Forwards to backend PUT /alerts/:id/ with body { status: "CLOSED" }.
 * Backend can optionally trigger push notifications to mobile when alert is closed.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = `${BACKEND_BASE}/alerts/${id}/`;
  const body = await request.text();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: body || JSON.stringify({ status: "CLOSED" }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
