import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body?.password;
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminPassword) {
      return NextResponse.json({ ok: false, error: "admin password not configured" }, { status: 500 });
    }
    if (typeof password !== "string") {
      return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
    }
    if (password !== adminPassword) {
      return NextResponse.json({ ok: false, error: "invalid password" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}
