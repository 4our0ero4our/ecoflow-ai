import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://ecoflow-backend-490388308724.us-central1.run.app";

/** GET /proxy/alerts?status=OPEN&org_id=1 — proxy to backend GET /alerts/ (Auth: token in request header) */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const orgId = searchParams.get("org_id");
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (orgId) params.set("org_id", orgId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const url = `${BACKEND_BASE}/alerts/${query}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
