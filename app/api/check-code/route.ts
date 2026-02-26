import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 4桁コードがkoifes_usersに既に存在するかチェック。
 * 重複チェック用（登録時のリトライで使用）。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code || code.length !== 4) {
    return NextResponse.json({ taken: true }, { status: 400 });
  }

  if (!serviceRoleKey) {
    return NextResponse.json({ taken: false });
  }

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data } = await admin.from("koifes_users").select("id").eq("code", code).limit(1).maybeSingle();
    return NextResponse.json({ taken: !!data });
  } catch (err) {
    console.error("[check-code]", err);
    return NextResponse.json({ taken: false });
  }
}
