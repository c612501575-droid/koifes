"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { load, saveSession } from "@/app/lib/koifes-db";
import { gold } from "@/app/lib/koifes-constants";
import { BtnPrimary, BtnSecondary } from "@/app/components/koifes/ui";

export default function LoginPage() {
  const router = useRouter();
  const [loginCode, setLoginCode] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const handleLogin = async () => {
    if (loginCode.length !== 4) {
      setError("4桁のコードを入力");
      return;
    }
    setError("");
    const data = await load();
    const found = data.users.find((u) => u.code === loginCode.toUpperCase());
    if (found) {
      saveSession(found.id);
      router.push("/app");
      router.refresh();
    } else {
      setError("コードが見つかりません");
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
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 36,
            fontStyle: "italic",
            fontWeight: 300,
            marginBottom: 8,
          }}
        >
          Koi Fes
        </h2>
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "#666",
            marginBottom: 48,
          }}
        >
          恋フェス 徳島
        </p>
        {!showLogin ? (
          <>
            <Link
              href="/register"
              style={{
                width: "100%",
                display: "block",
                textDecoration: "none",
              }}
            >
              <BtnPrimary>新規参加登録</BtnPrimary>
            </Link>
            <BtnSecondary onClick={() => setShowLogin(true)}>
              コードでログイン
            </BtnSecondary>
          </>
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
              登録時に発行された
              <br />
              4桁のコードを入力
            </p>
            <input
              value={loginCode}
              onChange={(e) => {
                setLoginCode(e.target.value.toUpperCase());
                setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="A1B2"
              maxLength={4}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${error ? "#e55" : focused ? gold : "rgba(255,255,255,0.18)"}`,
                color: "#fff",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 32,
                fontWeight: 300,
                padding: "12px 0",
                outline: "none",
                textAlign: "center",
                letterSpacing: "0.4em",
                transition: "border-color 0.3s",
                marginBottom: 8,
              }}
            />
            {error && (
              <p style={{ fontSize: 11, color: "#e55", marginBottom: 8 }}>
                {error}
              </p>
            )}
            <div style={{ marginTop: 16 }}>
              <BtnPrimary
                onClick={handleLogin}
                disabled={loginCode.length < 4}
              >
                ログイン
              </BtnPrimary>
            </div>
            <BtnSecondary
              onClick={() => {
                setShowLogin(false);
                setError("");
                setLoginCode("");
              }}
            >
              戻る
            </BtnSecondary>
          </div>
        )}
        <Link
          href="/admin"
          style={{
            marginTop: 40,
            display: "block",
            background: "none",
            border: "none",
            color: "#444",
            fontSize: 10,
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
