"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  load,
  loadSession,
  saveSession,
  addRating,
  addConnection,
  updateUser,
  type KoifesUser,
  type KoifesDb,
} from "@/app/lib/koifes-db";
import { gold, faintLine, faintLine2, goldBorder, uid } from "@/app/lib/koifes-constants";
import {
  Header,
  BottomNav,
  Toast,
  BtnPrimary,
  ChipGroup,
  FormLabel,
  FormInput,
  InfoBox,
  Avatar,
  EditIcon,
  SliderInput,
} from "@/app/components/koifes/ui";
import { QRCode } from "@/app/components/koifes/qr";
import {
  AGES,
  JOBS,
  FAMILY,
  INCOME,
  MARRIAGE,
  CHILDREN,
  HOBBIES,
  VALUES,
  EVENT_EXP,
  INVEST,
  WEAKNESS,
  CONFIDENCE_5,
  BARRIER_CHANGE,
  LEAVE_REASONS,
  STAY_CONDITIONS,
  HOUSING_CONDS,
  COMPANY_SUPPORT,
} from "@/app/lib/koifes-constants";

function AppPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState<KoifesUser | null>(null);
  const [target, setTarget] = useState<KoifesUser | null>(null);
  const [db, setDb] = useState<KoifesDb>({ users: [], ratings: [], connections: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", show: false });

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2400);
  };
  const refreshDb = useCallback(async () => {
    const d = await load();
    setDb(d);
    return d;
  }, []);

  useEffect(() => {
    (async () => {
      const data = await load();
      setDb(data);
      const savedId = loadSession();
      console.log("[app] loadSession:", savedId, "users count:", data.users.length);
      if (savedId) {
        const found = data.users.find((u) => u.id === savedId);
        if (found) {
          setUser(found);
          const initialScreen = searchParams.get("screen") || "home";
          setScreen(["home", "card", "scan", "profile"].includes(initialScreen) ? initialScreen : "home");
          console.log("[app] ログイン成功, user:", found.nickname);
        } else {
          console.warn("[app] セッションのユーザーが見つかりません。savedId:", savedId, "users:", data.users.map((u) => u.id));
          saveSession(null);
          router.push("/login");
        }
      } else {
        console.log("[app] セッションなし, redirect to login");
        router.push("/login");
      }
      setLoading(false);
    })();
  }, [router, searchParams]);

  const nav = async (id: string) => {
    if (id === "admin") {
      router.push("/admin");
      return;
    }
    if (id === "history") {
      setScreen("history");
      return;
    }
    await refreshDb();
    setScreen(id);
  };

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: 12,
        }}
      >
        読み込み中...
      </div>
    );
  }

  // HomeScreen
  if (screen === "home") {
    const conns = db.connections.filter((c) => c.from === user.id || c.to === user.id).length;
    const received = db.ratings.filter((r) => r.to === user.id);
    const favCount = (db.favorites || []).filter((f) => f.userId === user.id).length;
    const connectedIds = db.connections
      .filter((c) => c.from === user.id || c.to === user.id)
      .map((c) => (c.from === user.id ? c.to : c.from));
    const ratedIds = db.ratings.filter((r) => r.from === user.id).map((r) => r.to);
    const unratedCount = connectedIds.filter((id) => !ratedIds.includes(id)).length;
    return (
      <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, color: "#fff" }}>
        <div style={{ padding: "48px 24px 32px", maxWidth: 480, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.35em", color: "#666", marginBottom: 12 }}>WELCOME BACK</p>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 27, fontWeight: 300, lineHeight: 1.5 }}>
            {user.nickname}<span style={{ fontSize: 17, color: "#999", fontWeight: 200 }}>さん</span>
          </h1>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 1,
            background: faintLine2,
            margin: "0 24px 24px",
            maxWidth: "calc(480px - 48px)",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {[
            { num: conns, label: "TALKS" },
            { num: received.length, label: "IMPRESSIONS", isGold: true },
            { num: favCount, label: "FAVORITES", isGold: true },
          ].map((s, i) => (
            <div key={i} style={{ background: "#000", padding: "22px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 300, color: s.isGold ? gold : "#fff", lineHeight: 1, marginBottom: 10 }}>{s.num}</div>
              <div style={{ fontSize: 8, letterSpacing: "0.25em", color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {unratedCount > 0 && (
          <button
            onClick={() => nav("history")}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "rgba(200,169,110,0.06)",
              border: "1px solid rgba(200,169,110,0.15)",
              cursor: "pointer",
              margin: "0 24px 24px",
              maxWidth: "calc(480px - 48px)",
              marginLeft: "auto",
              marginRight: "auto",
              display: "block",
            }}
          >
            <span style={{ fontSize: 12, color: gold, letterSpacing: "0.05em" }}>
              ✧ 印象が未記録の人が{unratedCount}人います
            </span>
          </button>
        )}
        <div style={{ padding: "0 24px", maxWidth: 480, margin: "0 auto" }}>
          <button
            onClick={() => nav("card")}
            style={{ width: "100%", background: "#fff", border: "none", padding: "28px 24px", cursor: "pointer", textAlign: "left", marginBottom: 12 }}
          >
            <span style={{ fontSize: 26, display: "block", marginBottom: 14, color: "#000" }}>◈</span>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300, color: "#000", marginBottom: 6 }}>マイカード</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.8 }}>QRコードを表示して相手とつながる</div>
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { id: "scan", icon: "⊡", title: "スキャン", desc: "相手のコードを\n読み取る" },
              { id: "history", icon: "◇", title: "履歴 & お気に入り", desc: "接続した人を\n確認する" },
            ].map((a) => (
              <button
                key={a.id}
                onClick={() => nav(a.id)}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", padding: "28px 20px", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ fontSize: 24, display: "block", marginBottom: 14, color: gold }}>{a.icon}</span>
                <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 300, color: "#fff", marginBottom: 6 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8, whiteSpace: "pre-line" }}>{a.desc}</div>
              </button>
            ))}
          </div>
          {/* === AFTER EVENT セクション === */}
          <div style={{ marginTop: 24 }}>
            <p style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              color: "#555",
              marginBottom: 12,
            }}>AFTER EVENT</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                onClick={() => router.push("/post-survey")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(200,169,110,0.2)",
                  padding: "28px 20px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 24, display: "block", marginBottom: 14, color: gold }}>◆</span>
                <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 300, color: "#fff", marginBottom: 6 }}>アンケート</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8, whiteSpace: "pre-line" }}>{"イベント後の\n変化を回答"}</div>
              </button>
              <button
                onClick={() => router.push("/followup")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(200,169,110,0.2)",
                  padding: "28px 20px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 24, display: "block", marginBottom: 14, color: gold }}>♡</span>
                <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 16, fontWeight: 300, color: "#fff", marginBottom: 6 }}>フォローアップ</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8, whiteSpace: "pre-line" }}>{"連絡先交換を\nリクエスト"}</div>
              </button>
            </div>
          </div>
        </div>
        <BottomNav active="home" onNav={nav} />
      </div>
    );
  }

  // CardScreen
  if (screen === "card") {
    const conns = db.connections.filter((c) => c.from === user.id || c.to === user.id).length;
    return (
      <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, color: "#fff" }}>
        <Header title="My Card" onLeft={() => nav("home")} />
        <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "40px 28px",
              position: "relative",
              overflow: "hidden",
              animation: "cardReveal 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  border: "1px solid rgba(255,255,255,0.12)",
                  flexShrink: 0,
                  background: "#111",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 27,
                  fontFamily: "'Cormorant Garamond', serif",
                  color: gold,
                  fontStyle: "italic",
                }}
              >
                {user.nickname?.[0] || "♡"}
              </div>
              <div>
                <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 300, marginBottom: 6 }}>{user.nickname}</div>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#999", lineHeight: 1.8 }}>{[user.age, user.job, user.height && `${user.height}cm`].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              {[
                { l: "SELF ESTEEM", v: `${user.esteem ?? 5}/10`, g: 1 },
                { l: "TALKS", v: conns },
                { l: "MARRIAGE", v: user.marriage || "—", s: 1 },
                { l: "CHILDREN", v: user.children || "—", s: 1 },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#666", marginBottom: 6 }}>{item.l}</div>
                  <div
                    style={{
                      fontFamily: (item as { s?: number }).s ? "'Noto Sans JP'" : "'Cormorant Garamond', serif",
                      fontSize: (item as { s?: number }).s ? 12 : 22,
                      fontWeight: 300,
                      color: (item as { g?: number }).g ? gold : (item as { s?: number }).s ? "#999" : "#fff",
                    }}
                  >
                    {item.v}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: faintLine, margin: "0 0 28px" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: "#fff", padding: 10 }}><QRCode value={user.code || "XXXX"} size={160} /></div>
              <div style={{ marginTop: 18, fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, letterSpacing: "0.35em" }}>{user.code}</div>
              <p style={{ fontSize: 10, letterSpacing: "0.15em", color: "#666", marginTop: 12 }}>相手に自分のQRを見せ、相手の携帯でスキャン</p>
            </div>
          </div>
          <div style={{ marginTop: 24 }}><BtnPrimary onClick={() => nav("scan")}>相手のコードを入力 →</BtnPrimary></div>
        </div>
        <BottomNav active="card" onNav={nav} />
      </div>
    );
  }

  // ScanScreen
  if (screen === "scan") {
    return (
      <ScanScreen
        user={user}
        onNav={nav}
        onFound={(t) => {
          setTarget(t);
          setScreen("viewProfile");
        }}
      />
    );
  }

  // ViewProfileScreen
  if (screen === "viewProfile" && target) {
    const rows = [
      ["性別", target.gender],
      ["身長", target.height && `${target.height}cm`],
      ["家族構成", target.family],
      ["結婚への希望", target.marriage],
      ["子供の希望", target.children],
      ["趣味", (target.hobbies || []).join("、")],
      ["価値観", (target.values || []).join("、")],
      ["自己投資", target.invest],
      ["参加歴", target.eventExp],
      ["周りの評価", target.personality],
    ].filter(([, v]) => v);
    return (
      <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
        <Header title="Profile" onLeft={() => setScreen("scan")} />
        <div style={{ padding: "24px 24px 140px", maxWidth: 480, margin: "0 auto", animation: "cardReveal 0.6s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <Avatar char={target.nickname?.[0]} size={80} borderColor={goldBorder} />
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 300, marginTop: 16 }}>{target.nickname}</h2>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", marginTop: 6 }}>{[target.age, target.job, target.height && `${target.height}cm`].filter(Boolean).join(" · ")}</p>
          </div>
          {rows.map(([l, v]) => (
            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${faintLine2}` }}>
              <span style={{ fontSize: 11, color: "#666", flexShrink: 0 }}>{l}</span>
              <span style={{ fontSize: 13, textAlign: "right", marginLeft: 16, color: "#ccc", fontWeight: 300 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, #000 60%, transparent)", padding: "32px 24px 36px", maxWidth: 480, margin: "0 auto" }}>
          <BtnPrimary onClick={() => setScreen("rate")}>この人を評価する →</BtnPrimary>
        </div>
      </div>
    );
  }

  // RateScreen
  if (screen === "rate" && target) {
    return (
      <RateScreen
        target={target}
        user={user}
        onComplete={async () => {
          await refreshDb();
          setTarget(null);
          setScreen("home");
        }}
        onBack={() => setScreen("viewProfile")}
      />
    );
  }

  // HistoryScreen
  if (screen === "history") {
    const peers = db.connections
      .filter((c) => c.from === user.id || c.to === user.id)
      .map((c) => db.users.find((u) => u.id === (c.from === user.id ? c.to : c.from)))
      .filter(Boolean) as KoifesUser[];
    return (
      <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, color: "#fff" }}>
        <Header title="History" onLeft={() => nav("home")} />
        <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.4em", color: gold, marginBottom: 8 }}>CONNECTIONS</p>
          <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 300, marginBottom: 24 }}>接続した人：{peers.length}人</h2>
          {peers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontSize: 28, marginBottom: 16, opacity: 0.15 }}>◇</p>
              <p style={{ fontSize: 12, color: "#555" }}>まだ誰とも接続していません</p>
            </div>
          ) : (
            peers.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: `1px solid ${faintLine2}` }}>
                <div style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontFamily: "'Cormorant Garamond', serif", color: gold, fontStyle: "italic" }}>{p.nickname?.[0]}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 300 }}>{p.nickname}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{p.age} · {p.job}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <BottomNav active="home" onNav={nav} />
      </div>
    );
  }

  // ProfileScreen
  if (screen === "profile") {
    return (
      <>
        <ProfileScreen
          user={user}
          onSave={async (updated) => {
            await updateUser({ ...user, ...updated });
            setUser({ ...user, ...updated });
            await refreshDb();
            showToast("保存しました");
          }}
          onNav={nav}
        />
        <Toast msg={toast.msg} show={toast.show} />
      </>
    );
  }

  return null;
}

export default function AppPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>読み込み中...</div>}>
      <AppPageContent />
    </Suspense>
  );
}

// ScanScreen (standalone for state)
function ScanScreen({
  user,
  onNav,
  onFound,
}: {
  user: KoifesUser;
  onNav: (id: string) => void;
  onFound: (t: KoifesUser) => void;
}) {
  const [mode, setMode] = useState<"loading" | "camera" | "fallback">("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const resolveCode = useCallback(
    async (decodedCode: string) => {
      const codeStr = String(decodedCode || "").trim().toUpperCase().slice(0, 4);
      if (codeStr.length < 4) return;
      const data = await load();
      const found = data.users.find((u) => u.code === codeStr && u.id !== user.id);
      if (found) {
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {}
        }
        onFound(found);
      } else {
        setError("該当するユーザーが見つかりません");
      }
    },
    [user.id, onFound]
  );

  const search = async () => {
    setError("");
    await resolveCode(code);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;
    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const container = document.getElementById("qr-reader-scan");
        if (!container || !mounted) return;
        const html5QrCode = new Html5Qrcode("qr-reader-scan");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (mounted) resolveCode(decodedText);
          },
          () => {}
        );
        if (mounted) setMode("camera");
      } catch (err) {
        console.warn("[ScanScreen] カメラ利用不可, フォールバック表示:", err);
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {}
          scannerRef.current = null;
        }
        if (mounted) setMode("fallback");
      }
    };
    initScanner();
    return () => {
      mounted = false;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [resolveCode]);

  const showFallback = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setMode("fallback");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, color: "#fff" }}>
      <Header title="Scan" onLeft={() => onNav("home")} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px" }}>
        {(mode === "loading" || mode === "camera") && (
          <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
            <div
              id="qr-reader-scan"
              style={{
                width: "100%",
                marginBottom: 16,
                minHeight: 200,
                visibility: mode === "loading" ? "hidden" : "visible",
                position: mode === "loading" ? "absolute" : "relative",
              }}
            />
            {mode === "loading" && (
              <div style={{ padding: "80px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 12, letterSpacing: "0.15em", color: "#999" }}>カメラを起動中...</p>
              </div>
            )}
          </div>
        )}
        {mode === "camera" && (
          <>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", marginBottom: 16 }}>相手のQRコードをフレーム内に合わせてください</p>
            <button
              onClick={showFallback}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#999",
                fontSize: 11,
                padding: "10px 20px",
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              コードを手入力する
            </button>
          </>
        )}
        {mode === "fallback" && (
          <div style={{ width: "100%", maxWidth: 280, paddingTop: 40 }}>
            <p style={{ textAlign: "center", fontSize: 12, letterSpacing: "0.15em", color: "#999", lineHeight: 2, marginBottom: 32 }}>
              4桁のコードを入力してください
            </p>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
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
                borderBottom: `1px solid ${error ? "#e55" : focused ? gold : "rgba(255,255,255,0.15)"}`,
                color: "#fff",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 32,
                fontWeight: 300,
                padding: "12px 0",
                outline: "none",
                textAlign: "center",
                letterSpacing: "0.4em",
                transition: "border-color 0.3s",
              }}
            />
            {error && <p style={{ fontSize: 11, color: "#e55", textAlign: "center", marginTop: 12 }}>{error}</p>}
            <div style={{ marginTop: 24 }}><BtnPrimary onClick={search} disabled={code.length < 4}>プロフィールを表示</BtnPrimary></div>
          </div>
        )}
      </div>
      <BottomNav active="scan" onNav={onNav} />
    </div>
  );
}

// RateScreen
function RateScreen({
  target,
  user,
  onComplete,
  onBack,
}: {
  target: KoifesUser;
  user: KoifesUser;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [imp, setImp] = useState(0);
  const [ease, setEase] = useState(0);
  const [again, setAgain] = useState("");
  const [done, setDone] = useState(false);
  const [sub, setSub] = useState(false);

  const SR = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={{ marginBottom: 32 }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: "0.2em", color: "#999", marginBottom: 14 }}>{label}</label>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              width: 33,
              height: 33,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${n <= value ? gold : "rgba(255,255,255,0.12)"}`,
              background: n <= value ? gold : "transparent",
              color: n <= value ? "#000" : "rgba(255,255,255,0.3)",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  const submit = async () => {
    if (!imp || !ease) return;
    setSub(true);
    const ov = Math.round((imp + ease) / 2 * 10) / 10;
    await addRating({
      id: uid(),
      from: user.id,
      to: target.id,
      impression: imp,
      ease,
      again,
      overall: ov,
      createdAt: new Date().toISOString(),
    });
    const exists = await load();
    const connExists = exists.connections.find((c) => (c.from === user.id && c.to === target.id) || (c.from === target.id && c.to === user.id));
    if (!connExists) {
      await addConnection({
        id: uid(),
        from: user.id,
        to: target.id,
        createdAt: new Date().toISOString(),
      });
    }
    setDone(true);
    setTimeout(() => onComplete(), 1800);
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ width: 64, height: 64, border: `2px solid ${gold}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "checkPop 0.5s ease", marginBottom: 24 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <p style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300 }}>評価を送信しました</p>
        <p style={{ fontSize: 11, color: "#666", marginTop: 12, letterSpacing: "0.15em" }}>※ 本人には表示されません</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", color: "#fff" }}>
      <Header title="Review" onLeft={onBack} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 24, borderBottom: `1px solid ${faintLine}`, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <Avatar char={target.nickname?.[0]} size={48} />
        <div>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300 }}>{target.nickname}</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{target.age} · {target.job}</div>
        </div>
      </div>
      <InfoBox>⚠ この評価は相手には表示されません。集計データとして徳島市の少子化対策に活用されます。</InfoBox>
      <div style={{ flex: 1, padding: "8px 24px 40px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <SR label="ファーストインプレッション" value={imp} onChange={setImp} />
        <SR label="話しやすさ" value={ease} onChange={setEase} />
        <div style={{ marginBottom: 32 }}>
          <FormLabel>また話したいか</FormLabel>
          <ChipGroup options={["ぜひ話したい", "どちらでも", "あまり…"]} value={again} onChange={(v) => setAgain(Array.isArray(v) ? "" : v)} accent />
        </div>
      </div>
      <div style={{ position: "sticky", bottom: 0, background: "linear-gradient(to top, #000 60%, transparent)", padding: "32px 24px 36px" }}>
        <BtnPrimary onClick={submit} disabled={sub || !imp || !ease}>{sub ? "送信中..." : "評価を送信する"}</BtnPrimary>
      </div>
    </div>
  );
}

// ProfileScreen
function ProfileScreen({
  user,
  onSave,
  onNav,
}: {
  user: KoifesUser;
  onSave: (updated: Partial<KoifesUser>) => void;
  onNav: (id: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<KoifesUser>({ ...user });
  const startEdit = (s: string) => {
    setDraft({ ...user });
    setEditing(s);
  };
  const cancelEdit = () => setEditing(null);
  const saveEdit = () => {
    onSave(draft);
    setEditing(null);
  };
  const setD = (k: keyof KoifesUser, v: string | number | string[] | undefined) =>
    setDraft((p) => ({ ...p, [k]: v }));
  const isTeen = (editing ? draft.age : user.age) === "10代";

  const SH = ({ title, sid }: { title: string; sid: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, marginTop: 32 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.3em", color: gold }}>{title}</span>
      {editing !== sid && <EditIcon onClick={() => startEdit(sid)} />}
    </div>
  );
  const Row = ({ label, value, hide }: { label: string; value?: string | null; hide?: boolean }) => {
    if (hide) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${faintLine2}` }}>
        <span style={{ fontSize: 11, color: "#555", flexShrink: 0, minWidth: 80 }}>{label}</span>
        <span style={{ fontSize: 13, color: value ? "#ccc" : "#333", fontWeight: 300, textAlign: "right", marginLeft: 12 }}>{value || "未入力"}</span>
      </div>
    );
  };
  const EditBox = ({ children }: { children: React.ReactNode }) => (
    <div style={{ animation: "fadeIn 0.3s ease", background: "rgba(255,255,255,0.02)", border: `1px solid ${faintLine}`, padding: 20, marginBottom: 8 }}>
      {children}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button onClick={cancelEdit} style={{ flex: 1, padding: "13px 0", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans JP'" }}>キャンセル</button>
        <button onClick={saveEdit} style={{ flex: 1, padding: "13px 0", background: gold, border: "none", color: "#000", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans JP'", fontWeight: 400 }}>保存する</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, color: "#fff" }}>
      <Header title="My Profile" onLeft={() => onNav("home")} />
      <div style={{ padding: "16px 24px 40px", maxWidth: 480, margin: "0 auto", animation: "cardReveal 0.5s ease" }}>
        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <Avatar char={user.nickname?.[0]} size={72} borderColor={goldBorder} />
          <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 24, fontWeight: 300, marginTop: 16 }}>{user.nickname}</h2>
          <p style={{ fontSize: 11, letterSpacing: "0.15em", color: "#666", marginTop: 6 }}>{[user.age, user.job, user.height && `${user.height}cm`].filter(Boolean).join(" · ")}</p>
          <p style={{ fontSize: 10, letterSpacing: "0.25em", color: "#444", marginTop: 8, fontFamily: "'Cormorant Garamond', serif" }}>CODE: {user.code}</p>
        </div>

        <SH title="BASIC INFO" sid="basic" />
        {editing === "basic" ? (
          <EditBox>
            <div style={{ marginBottom: 18 }}><FormLabel>ニックネーム</FormLabel><FormInput value={draft.nickname || ""} onChange={(v) => setD("nickname", v)} maxLength={10} /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>性別</FormLabel><ChipGroup options={["男性", "女性"]} value={draft.gender || ""} onChange={(v) => setD("gender", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>年齢</FormLabel><ChipGroup options={AGES} value={draft.age || ""} onChange={(v) => setD("age", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>身長</FormLabel><FormInput value={draft.height || ""} onChange={(v) => setD("height", v)} type="number" /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>職業</FormLabel><ChipGroup options={JOBS} value={draft.job || ""} onChange={(v) => setD("job", v as string)} small /></div>
            <div style={{ marginBottom: 0 }}><FormLabel>家族構成</FormLabel><ChipGroup options={FAMILY} value={draft.family || ""} onChange={(v) => setD("family", v as string)} small /></div>
          </EditBox>
        ) : (
          <><Row label="ニックネーム" value={user.nickname} /><Row label="性別" value={user.gender} /><Row label="年齢" value={user.age} /><Row label="身長" value={user.height ? `${user.height}cm` : undefined} /><Row label="職業" value={user.job} /><Row label="家族構成" value={user.family} /></>
        )}

        <SH title="VALUES & HOPES" sid="values" />
        {editing === "values" ? (
          <EditBox>
            <div style={{ marginBottom: 18 }}><FormLabel>年収帯</FormLabel><ChipGroup options={INCOME} value={draft.income || ""} onChange={(v) => setD("income", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>結婚の希望</FormLabel><ChipGroup options={MARRIAGE} value={draft.marriage || ""} onChange={(v) => setD("marriage", v as string)} accent small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>子供の希望</FormLabel><ChipGroup options={CHILDREN} value={draft.children || ""} onChange={(v) => setD("children", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>趣味</FormLabel><ChipGroup options={HOBBIES} value={draft.hobbies || []} onChange={(v) => setD("hobbies", v as string[])} multi small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>価値観</FormLabel><ChipGroup options={VALUES} value={draft.values || []} onChange={(v) => setD("values", v as string[])} multi small /></div>
            <div style={{ marginBottom: 0 }}><FormLabel>参加歴</FormLabel><ChipGroup options={EVENT_EXP} value={draft.eventExp || ""} onChange={(v) => setD("eventExp", v as string)} small /></div>
          </EditBox>
        ) : (
          <><Row label="年収帯" value={user.income} /><Row label="結婚の希望" value={user.marriage} /><Row label="子供の希望" value={user.children} /><Row label="趣味" value={(user.hobbies || []).join("、") || undefined} /><Row label="価値観" value={(user.values || []).join("、") || undefined} /><Row label="参加歴" value={user.eventExp} /></>
        )}

        <SH title="SELF SCORE" sid="score" />
        {editing === "score" ? (
          <EditBox>
            <div style={{ marginBottom: 18 }}><FormLabel>自己肯定感</FormLabel><SliderInput subLeft="低い" subRight="高い" value={draft.esteem ?? 5} onChange={(v) => setD("esteem", v)} /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>異性への抵抗感</FormLabel><SliderInput subLeft="全くない" subRight="かなりある" value={draft.resistance ?? 5} onChange={(v) => setD("resistance", v)} /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>自己投資額</FormLabel><ChipGroup options={INVEST} value={draft.invest || ""} onChange={(v) => setD("invest", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>短所</FormLabel><ChipGroup options={WEAKNESS} value={draft.weakness || ""} onChange={(v) => setD("weakness", v as string)} small /></div>
            <div style={{ marginBottom: 0 }}><FormLabel>周りの評価</FormLabel><FormInput value={draft.personality || ""} onChange={(v) => setD("personality", v)} /></div>
          </EditBox>
        ) : (
          <><Row label="自己肯定感" value={`${user.esteem ?? 5} / 10`} /><Row label="異性への抵抗感" value={`${user.resistance ?? 5} / 10`} /><Row label="自己投資額" value={user.invest} /><Row label="短所" value={user.weakness} /><Row label="周りの評価" value={user.personality} /></>
        )}

        <SH title="SELF IMPROVEMENT" sid="improve" />
        {editing === "improve" ? (
          <EditBox>
            <div style={{ marginBottom: 18 }}><FormLabel>自分磨きを行った？</FormLabel><ChipGroup options={["はい", "いいえ"]} value={draft.selfImprovement || ""} onChange={(v) => setD("selfImprovement", v as string)} small /></div>
            {draft.selfImprovement === "はい" && <div style={{ marginBottom: 18 }}><FormLabel>自信が持てた？</FormLabel><ChipGroup options={CONFIDENCE_5} value={draft.improvementConfidence || ""} onChange={(v) => setD("improvementConfidence", v as string)} small /></div>}
            <div style={{ marginBottom: 0 }}><FormLabel>心理的ハードルの変化</FormLabel><ChipGroup options={BARRIER_CHANGE} value={draft.barrierChange || ""} onChange={(v) => setD("barrierChange", v as string)} small /></div>
          </EditBox>
        ) : (
          <><Row label="自分磨き" value={user.selfImprovement} /><Row label="自信の変化" value={user.improvementConfidence} hide={user.selfImprovement !== "はい"} /><Row label="ハードル変化" value={user.barrierChange} /></>
        )}

        <SH title="TOKUSHIMA LIFE" sid="tokushima" />
        {editing === "tokushima" ? (
          <EditBox>
            <div style={{ marginBottom: 18 }}><FormLabel>徳島に住み続けたい？</FormLabel><ChipGroup options={["ぜひ住みたい", "条件次第で", "どちらとも", "県外に出たい"]} value={draft.stayTokushima || ""} onChange={(v) => setD("stayTokushima", v as string)} accent small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>県外へ出たい理由</FormLabel><ChipGroup options={LEAVE_REASONS} value={draft.leaveReason || ""} onChange={(v) => setD("leaveReason", v as string)} small /></div>
            {isTeen && <div style={{ marginBottom: 18, background: "rgba(200,169,110,0.05)", padding: 12, border: `1px solid ${goldBorder}` }}><p style={{ fontSize: 9, color: gold, marginBottom: 8, letterSpacing: "0.1em" }}>10代の方への質問</p><FormLabel>これがあれば残る要素（複数可）</FormLabel><ChipGroup options={STAY_CONDITIONS} value={draft.stayConditions || []} onChange={(v) => setD("stayConditions", v as string[])} multi accent small /></div>}
            <div style={{ marginBottom: 18 }}><FormLabel>徳島で家を購入したい？</FormLabel><ChipGroup options={["ぜひしたい", "条件が合えば", "あまり考えていない", "購入しない"]} value={draft.buyHouse || ""} onChange={(v) => setD("buyHouse", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>住居の条件（複数可）</FormLabel><ChipGroup options={HOUSING_CONDS} value={draft.housingConditions || []} onChange={(v) => setD("housingConditions", v as string[])} multi small /></div>
            <div style={{ marginBottom: 0 }}><FormLabel>会社の支援で定住意向は上がる？</FormLabel><ChipGroup options={COMPANY_SUPPORT} value={draft.companySupport || ""} onChange={(v) => setD("companySupport", v as string)} small /></div>
          </EditBox>
        ) : (
          <><Row label="定住意向" value={user.stayTokushima} /><Row label="県外理由" value={user.leaveReason} /><Row label="残る条件" value={(user.stayConditions || []).join("、") || undefined} hide={user.age !== "10代"} /><Row label="家購入意向" value={user.buyHouse} /><Row label="住居の条件" value={(user.housingConditions || []).join("、") || undefined} /><Row label="企業支援効果" value={user.companySupport} /></>
        )}
      </div>
      <BottomNav active="profile" onNav={onNav} />
    </div>
  );
}

