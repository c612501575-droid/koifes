"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { gold } from "@/app/lib/koifes-constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("有効なメールアドレスを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (err) {
        setError(err.message || "コードの送信に失敗しました");
        return;
      }
      setStep("otp");
      setOtpCode("");
      setError("");
    } catch {
      setError("送信に失敗しました。時間をおいて再度お試しください");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const token = otpCode.replace(/\D/g, "");
    if (token.length !== 6) {
      setError("6桁のコードを入力してください");
      return;
    }
    const trimmed = email.trim().toLowerCase();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: trimmed,
        token,
        type: "email",
      });
      if (err) {
        setError(err.message || "コードが正しくありません");
        return;
      }
      // 管理者かどうかは middleware と API で ADMIN_EMAILS をチェック
      const res = await fetch("/api/admin-auth", { method: "GET", credentials: "include", cache: "no-store" });
      if (res.ok) {
        router.replace("/admin");
      } else {
        setError("このメールアドレスは管理者として登録されていません");
        await supabase.auth.signOut();
      }
    } catch {
      setError("認証に失敗しました。もう一度お試しください");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: "#fff",
      }}
    >
      <div style={{ width: "100%", maxWidth: 280 }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
            fontWeight: 300,
            marginBottom: 8,
          }}
        >
          管理者ログイン
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 32,
          }}
        >
          メールアドレスを入力し、届いた6桁コードで認証してください
        </p>

        {step === "email" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="admin@example.com"
              autoComplete="email"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 14,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                outline: "none",
                marginBottom: 16,
              }}
            />
            {error && (
              <p style={{ fontSize: 12, color: "#e55", marginBottom: 16 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: "100%",
                padding: 14,
                background: loading || !email.trim() ? "#333" : gold,
                color: loading || !email.trim() ? "#666" : "#000",
                border: "none",
                fontSize: 14,
                fontWeight: 500,
                cursor: loading || !email.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "送信中..." : "ログインコードを送信"}
            </button>
          </form>
        ) : (
          <>
            <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
              {email} に6桁のコードを送信しました
            </p>
            <input
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 18,
                letterSpacing: "0.3em",
                textAlign: "center",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                outline: "none",
                marginBottom: 16,
              }}
            />
            {error && (
              <p style={{ fontSize: 12, color: "#e55", marginBottom: 16 }}>{error}</p>
            )}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpCode.replace(/\D/g, "").length !== 6}
              style={{
                width: "100%",
                padding: 14,
                background: loading || otpCode.replace(/\D/g, "").length !== 6 ? "#333" : gold,
                color: loading || otpCode.replace(/\D/g, "").length !== 6 ? "#666" : "#000",
                border: "none",
                fontSize: 14,
                fontWeight: 500,
                cursor: loading || otpCode.replace(/\D/g, "").length !== 6 ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "確認中..." : "ログイン"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setError("");
              }}
              style={{
                width: "100%",
                marginTop: 12,
                padding: 10,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#999",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              メールを変更
            </button>
          </>
        )}

        <Link
          href="/login"
          style={{
            display: "block",
            marginTop: 24,
            color: "#666",
            fontSize: 12,
            textDecoration: "none",
          }}
        >
          ← ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}
