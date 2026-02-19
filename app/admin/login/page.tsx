"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gold } from "@/app/lib/koifes-constants";

const ADMIN_PASSWORD = "koifes2026";
const ADMIN_SESSION_KEY = "koifes-admin-auth";

export function setAdminAuth() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  }
}

export function checkAdminAuth(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function clearAdminAuth() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password === ADMIN_PASSWORD) {
      setAdminAuth();
      router.push("/admin");
      router.refresh();
    } else {
      setError("パスワードが正しくありません");
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
