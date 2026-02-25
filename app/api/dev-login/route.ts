import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const COOKIE_NAME = "koifes_dev_user_id";
const MAX_AGE = 7 * 24 * 60 * 60; // 7日

export async function POST(request: Request) {
  if (process.env.DEV_BYPASS_4DIGIT !== "1") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const code = String(body?.code || "").trim().toUpperCase();
  if (code.length !== 4) {
    return NextResponse.json({ ok: false, error: "4桁のコードを入力してください" }, { status: 400 });
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, process.env.SUPABASE_SERVICE_ROLE_KEY ? { auth: { persistSession: false } } : undefined);
  const { data: rows } = await supabase.from("koifes_users").select("id, code");
  const user = (rows || []).find((u: { code?: string }) => String(u.code || "").toUpperCase() === code);
  if (!user) {
    return NextResponse.json({ ok: false, error: "コードが見つかりません" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, userId: user.id });
  res.cookies.set(COOKIE_NAME, user.id, {
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
