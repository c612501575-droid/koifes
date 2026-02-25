import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_token";
const MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7日間

function createToken(): string {
  const timestamp = Date.now().toString();
  const secret = process.env.ADMIN_PASSWORD || "";
  const hmac = createHmac("sha256", secret).update(timestamp).digest("hex");
  return `${timestamp}.${hmac}`;
}

function verifyToken(token: string): boolean {
  const secret = process.env.ADMIN_PASSWORD || "";
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [timestamp, sig] = parts;
  const expected = createHmac("sha256", secret).update(timestamp).digest("hex");
  if (expected.length !== sig.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"))) return false;
  } catch {
    return false;
  }
  const age = Date.now() - parseInt(timestamp, 10);
  return age >= 0 && age < MAX_AGE_SEC * 1000;
}

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    if (!adminPassword) {
      return NextResponse.json({ ok: false, error: "admin password not configured" }, { status: 500 });
    }
    const body = await request.json().catch(() => ({}));
    const password = body?.password;
    if (typeof password !== "string") {
      return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
    }
    if (password !== adminPassword) {
      return NextResponse.json({ ok: false, error: "invalid password" }, { status: 401 });
    }
    const token = createToken();
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, getCookieOptions());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
