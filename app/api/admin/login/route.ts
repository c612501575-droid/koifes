import { NextResponse } from "next/server";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedAttemptsByIp = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  return "unknown";
}

function getRecentFailedAttempts(ip: string, now: number): number[] {
  const attempts = failedAttemptsByIp.get(ip) || [];
  const recent = attempts.filter((ts) => now - ts < WINDOW_MS);
  if (recent.length > 0) {
    failedAttemptsByIp.set(ip, recent);
  } else {
    failedAttemptsByIp.delete(ip);
  }
  return recent;
}

export async function POST(request: Request) {
  try {
    const now = Date.now();
    const ip = getClientIp(request);
    const body = await request.json();
    const password = body?.password;
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminPassword) {
      return NextResponse.json({ ok: false, error: "admin password not configured" }, { status: 500 });
    }
    if (typeof password !== "string") {
      return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
    }

    const recentFailedAttempts = getRecentFailedAttempts(ip, now);
    if (recentFailedAttempts.length >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json({ ok: false, error: "too many attempts" }, { status: 429 });
    }

    if (password !== adminPassword) {
      const updatedAttempts = [...recentFailedAttempts, now];
      failedAttemptsByIp.set(ip, updatedAttempts);
      if (updatedAttempts.length >= MAX_FAILED_ATTEMPTS) {
        return NextResponse.json({ ok: false, error: "too many attempts" }, { status: 429 });
      }
      return NextResponse.json({ ok: false, error: "invalid password" }, { status: 401 });
    }

    failedAttemptsByIp.delete(ip);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}
