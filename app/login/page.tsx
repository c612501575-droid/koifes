"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getUserByEmail } from "@/app/lib/koifes-db";
import { gold } from "@/app/lib/koifes-constants";
import { BtnPrimary, BtnSecondary } from "@/app/components/koifes/ui";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_4DIGIT === "1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

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

  const handleDevLogin = async () => {
    if (devCode.length !== 4) {
      setError("4桁のコードを入力");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: devCode.toUpperCase() }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "コードが見つかりません");
        return;
      }
      router.replace("/app");
    } catch {
      setError("ログインに失敗しました");
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
      const { data, error: err } = await supabase.auth.verifyOtp({
        email: trimmed,
        token,
        type: "email",
      });
      if (err) {
        setError(err.message || "コードが正しくありません");
        return;
      }
      if (!data.user?.email) {
        setError("認証に失敗しました");
        return;
      }
      const koifesUser = await getUserByEmail(data.user.email);
      router.refresh();
      if (koifesUser) {
        router.replace("/app");
      } else {
        router.replace("/register");
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        background: "#000",
        color: "#fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,169,110,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Link
          href="/"
          style={{
            position: "absolute",
            top: -48,
            left: 0,
            color: "#666",
            fontSize: 12,
            textDecoration: "none",
          }}
        >
          ← 戻る
        </Link>
        <h2
          style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 38,
            fontStyle: "italic",
            fontWeight: 400,
            marginBottom: 12,
          }}
        >
          Koi Fes
        </h2>
        <p
          style={{
            fontSize: 16,
            letterSpacing: "0.25em",
            color: "rgba(255,255,255,0.85)",
            marginBottom: 8,
            fontWeight: 400,
          }}
        >
          恋フェス 徳島
        </p>
        <p
          style={{
            fontSize: 14,
            letterSpacing: "0.4em",
            color: "#c8a96e",
            marginBottom: 48,
            fontWeight: 500,
          }}
        >
          2026
        </p>

        {step === "email" ? (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.15em",
                color: "#999",
                marginBottom: 20,
                lineHeight: 1.8,
              }}
            >
              メールアドレスを入力してください
              <br />
              ログイン用の6桁コードをお送りします
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${error ? "#e55" : focused ? gold : "rgba(255,255,255,0.18)"}`,
                color: "#fff",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 16,
                fontWeight: 400,
                padding: "12px 0",
                outline: "none",
                textAlign: "center",
                transition: "border-color 0.3s",
                marginBottom: 8,
              }}
            />
            {error && (
              <p style={{ fontSize: 11, color: "#e55", marginBottom: 8 }}>{error}</p>
            )}
            <div style={{ marginTop: 16 }}>
              <BtnPrimary onClick={handleSendOtp} disabled={loading || !email.trim()}>
                {loading ? "送信中..." : "ログインコードを送信"}
              </BtnPrimary>
            </div>
            <BtnSecondary
              onClick={() => {
                setError("");
                setEmail("");
              }}
            >
              クリア
            </BtnSecondary>
          </div>
        ) : (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.15em",
                color: "#999",
                marginBottom: 20,
                lineHeight: 1.8,
              }}
            >
              {email} に送信した
              <br />
              6桁のコードを入力
            </p>
            <input
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${error ? "#e55" : focused ? gold : "rgba(255,255,255,0.18)"}`,
                color: "#fff",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 32,
                fontWeight: 400,
                padding: "12px 0",
                outline: "none",
                textAlign: "center",
                letterSpacing: "0.4em",
                transition: "border-color 0.3s",
                marginBottom: 8,
              }}
            />
            {error && (
              <p style={{ fontSize: 11, color: "#e55", marginBottom: 8 }}>{error}</p>
            )}
            <div style={{ marginTop: 16 }}>
              <BtnPrimary
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.replace(/\D/g, "").length !== 6}
              >
                {loading ? "確認中..." : "ログイン"}
              </BtnPrimary>
            </div>
            <BtnSecondary
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setError("");
              }}
            >
              メールを変更
            </BtnSecondary>
          </div>
        )}

        {DEV_BYPASS && (
          <div style={{ marginTop: 32, padding: 20, border: "1px solid #333", borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 12 }}>開発用: 4桁コードでログイン</p>
            <input
              value={devCode}
              onChange={(e) => {
                setDevCode(e.target.value.toUpperCase().slice(0, 4));
                setError("");
              }}
              placeholder="A1B2"
              maxLength={4}
              style={{
                width: "100%",
                background: "transparent",
                border: `1px solid ${error && devCode ? "#e55" : "rgba(255,255,255,0.2)"}`,
                color: "#fff",
                fontSize: 18,
                padding: "10px 12px",
                outline: "none",
                textAlign: "center",
                letterSpacing: "0.3em",
                marginBottom: 8,
              }}
            />
            <BtnPrimary onClick={handleDevLogin} disabled={loading || devCode.length !== 4}>
              {loading ? "確認中..." : "4桁コードでログイン"}
            </BtnPrimary>
          </div>
        )}

        <Link
          href="/admin/login"
          style={{
            marginTop: 40,
            display: "block",
            background: "none",
            border: "none",
            color: "#444",
            fontSize: 11,
            letterSpacing: "0.15em",
            cursor: "pointer",
            padding: 8,
            textDecoration: "none",
          }}
        >
          管理者ログイン →
        </Link>
      </div>
    </div>
  );
}
