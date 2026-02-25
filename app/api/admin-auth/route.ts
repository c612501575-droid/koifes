import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

/**
 * 管理者認証チェック（Supabase セッション + ADMIN_EMAILS 許可リスト）
 * ADMIN_PASSWORD は廃止。メールOTP認証後、メールが許可リストに含まれるか検証。
 */

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const adminEmails = getAdminEmails();
    if (adminEmails.length === 0) {
      console.warn("[admin-auth] ADMIN_EMAILS が設定されていません");
      return NextResponse.json({ ok: false, error: "admin not configured" }, { status: 500 });
    }
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
