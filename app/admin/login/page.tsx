"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gold } from "@/app/lib/koifes-constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError("パスワードが正しくありません");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("ログインに失敗しました。時間をおいて再度お試しください");
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
          パスワードを入力してください
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="パスワード"
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
            style={{
              width: "100%",
              padding: 14,
              background: gold,
              color: "#000",
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ログイン
          </button>
        </form>
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
