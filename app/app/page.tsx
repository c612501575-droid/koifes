"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  load,
  getKoifesUserByAuthId,
  addRating,
  addConnection,
  updateUser,
  updateRating,
  updateRatingExchange,
  toggleFavorite,
  getRatingByFromTo,
  type KoifesUser,
  type KoifesDb,
  type KoifesRating,
} from "@/app/lib/koifes-db";
import { gold, faintLine, faintLine2, goldBorder, uid, EXCHANGE_REASON_YES, EXCHANGE_REASON_NO } from "@/app/lib/koifes-constants";
import { supabase } from "@/app/lib/supabase";
import {
  Header,
  BottomNav,
  Toast,
  BtnPrimary,
  BtnSecondary,
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
  SIBLINGS,
  LIVING_WITH_FAMILY,
  INCOME,
  MARRIAGE,
  MARRIAGE_BY_WHEN,
  CHILDREN,
  CHILDREN_BY_WHEN,
  HOBBIES,
  VALUES,
  EVENT_EXP,
  INVEST,
  WEAKNESS,
  CONFIDENCE_5,
  BARRIER_CHANGE,
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
  const [viewProfileFrom, setViewProfileFrom] = useState<"scan" | "history">("scan");
  const [historyFavoritesOnly, setHistoryFavoritesOnly] = useState(false);
  const [optimisticFavToggles, setOptimisticFavToggles] = useState<Map<string, boolean>>(new Map());
  const [db, setDb] = useState<KoifesDb>({ users: [], ratings: [], connections: [], favorites: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", show: false, variant: "success" as "success" | "error" });

  const showToast = (msg: string, isError = false) => {
    setToast({ msg, show: true, variant: isError ? "error" : "success" });
    setTimeout(() => setToast({ msg: "", show: false, variant: "success" }), 3000);
  };
  const refreshDb = useCallback(async () => {
    const d = await load();
    setDb(d);
    return d;
  }, []);

  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const data = await load();
          setDb(data);
          setLoadError(false);
          const found = await getKoifesUserByAuthId(authUser.id);
          if (found) {
            setUser(found);
            const initialScreen = searchParams.get("screen") || "home";
            setScreen(["home", "card", "scan", "profile"].includes(initialScreen) ? initialScreen : "home");
            console.log("[app] ログイン成功, user:", found.nickname);
          } else {
            console.warn("[app] koifes_users にユーザーが見つかりません → /register");
            router.push("/register");
          }
        } else if (process.env.NEXT_PUBLIC_DEV_BYPASS_4DIGIT === "1") {
          const res = await fetch("/api/dev-me", { credentials: "include", cache: "no-store" });
          const devData = await res.json().catch(() => ({}));
          if (devData.ok && devData.user) {
            const data = await load();
            setDb(data);
            setLoadError(false);
            setUser(devData.user);
            const initialScreen = searchParams.get("screen") || "home";
            setScreen(["home", "card", "scan", "profile"].includes(initialScreen) ? initialScreen : "home");
            console.log("[app] 開発用ログイン成功, user:", devData.user.nickname);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("[app] load failed:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, searchParams]);

  const nav = async (id: string) => {
    if (id === "admin") {
      router.push("/admin");
      return;
    }
    try {
      await refreshDb();
    } catch {
      showToast("データの読み込みに失敗しました", true);
    }
    setScreen(id);
  };

  if (loading || !user) {
    if (loadError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 14,
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: 16 }}>データの読み込みに失敗しました</p>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>電波状況を確認して再読み込みしてください</p>
          <button
            onClick={() => { setLoading(true); setLoadError(false); window.location.reload(); }}
            style={{
              padding: "12px 24px",
              background: "#333",
              border: "1px solid #555",
              color: "#fff",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            再読み込み
          </button>
        </div>
      );
    }
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
          <h1 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 27, fontWeight: 400, lineHeight: 1.5 }}>
            {user.nickname}<span style={{ fontSize: 17, color: "#999", fontWeight: 400 }}>さん</span>
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
              <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 30, fontWeight: 400, color: s.isGold ? gold : "#fff", lineHeight: 1, marginBottom: 10 }}>{s.num}</div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "32px 0" }}>
            <button
              onClick={() => nav("card")}
              style={{
                width: "100%",
                padding: "22px 20px",
                background: "linear-gradient(135deg, #c8a96e, #b8943e)",
                border: "none",
                borderRadius: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 32 }}>📱</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#000", margin: 0 }}>QRコードを見せる</p>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.6)", margin: "4px 0 0" }}>相手にスキャンしてもらいましょう</p>
              </div>
            </button>
            <button
              onClick={() => nav("scan")}
              style={{
                width: "100%",
                padding: "22px 20px",
                background: "linear-gradient(135deg, #c8a96e, #b8943e)",
                border: "none",
                borderRadius: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 32 }}>📷</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#000", margin: 0 }}>QRコードを読み取る</p>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.6)", margin: "4px 0 0" }}>相手のQRをスキャンしましょう</p>
              </div>
            </button>
            <button
              onClick={() => nav("history")}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "28px 20px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 24, display: "block", marginBottom: 14, color: gold }}>◇</span>
              <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 16, fontWeight: 400, color: "#fff", marginBottom: 6, whiteSpace: "nowrap" }}>履歴</div>
              <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8, whiteSpace: "pre-line" }}>{"接続した人を\n確認する"}</div>
            </button>
          </div>
          {/* === AFTER EVENT セクション === */}
          <div style={{ marginTop: 24 }}>
            <p style={{
              fontSize: 12,
              letterSpacing: "0.3em",
              color: "#555",
              marginBottom: 12,
            }}>AFTER EVENT</p>
            <button
              onClick={() => router.push("/post-survey")}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(200,169,110,0.2)",
                padding: "28px 20px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 24, display: "block", marginBottom: 14, color: gold }}>◆</span>
              <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 16, fontWeight: 400, color: "#fff", marginBottom: 6 }}>アンケート</div>
              <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8, whiteSpace: "pre-line" }}>{"イベント後の\n変化を回答"}</div>
            </button>
          </div>
        </div>
        <BottomNav active="home" onNav={nav} />
        <Toast msg={toast.msg} show={toast.show} variant={toast.variant} />
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
                  fontFamily: "'Noto Sans JP', sans-serif",
                  color: gold,
                  fontStyle: "italic",
                }}
              >
                {user.nickname?.[0] || "♡"}
              </div>
              <div>
                <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 24, fontWeight: 400, marginBottom: 6 }}>{user.nickname}</div>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#999", lineHeight: 1.8 }}>{[user.age, user.job, user.height && `${user.height}cm`].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 28 }}>
              {[
                { l: "TALKS", v: conns },
                { l: "MARRIAGE", v: user.marriage || "—", s: 1 },
                { l: "CHILDREN", v: user.children || "—", s: 1 },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, letterSpacing: "0.3em", color: "#666", marginBottom: 6 }}>{item.l}</div>
                  <div
                    style={{
                      fontFamily: (item as { s?: number }).s ? "'Noto Sans JP'" : "'Noto Sans JP', sans-serif",
                      fontSize: (item as { s?: number }).s ? 12 : 22,
                      fontWeight: 400,
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
              <div style={{ marginTop: 18, fontFamily: "'Noto Sans JP', sans-serif", fontSize: 28, fontWeight: 400, letterSpacing: "0.35em" }}>{user.code}</div>
              <p style={{ fontSize: 13, letterSpacing: "0.1em", color: "#999", marginTop: 16, lineHeight: 1.8, textAlign: "center" }}>
                このQRコードを相手に見せてください<br />
                相手がスキャンするとプロフィールが交換されます
              </p>
            </div>
          </div>
          <div style={{ marginTop: 24 }}><BtnPrimary onClick={() => nav("scan")}>相手のコードを入力 →</BtnPrimary></div>
        </div>
        <BottomNav active="card" onNav={nav} />
        <Toast msg={toast.msg} show={toast.show} variant={toast.variant} />
      </div>
    );
  }

  // ScanScreen
  if (screen === "scan") {
    return (
      <>
        <ScanScreen
          user={user}
          onNav={nav}
          onFound={(t) => {
            setTarget(t);
            setViewProfileFrom("scan");
            setScreen("viewProfile");
          }}
          onToast={showToast}
        />
        <Toast msg={toast.msg} show={toast.show} variant={toast.variant} />
      </>
    );
  }

  // ViewProfileScreen
  if (screen === "viewProfile" && target) {
    return (
      <>
        <ViewProfileContent
          target={target}
          user={user}
          db={db}
          viewProfileFrom={viewProfileFrom}
          setScreen={setScreen}
          refreshDb={refreshDb}
          toggleFavorite={toggleFavorite}
          showToast={showToast}
        />
        <Toast msg={toast.msg} show={toast.show} variant={toast.variant} />
      </>
    );
  }

  // RateScreen
  if (screen === "rate" && target) {
    const existingRating = db.ratings.find((r) => r.from === user.id && r.to === target.id);
    return (
      <>
        <RateScreen
          target={target}
          user={user}
          existingRating={existingRating}
          onComplete={async () => {
            await refreshDb();
            setTarget(null);
            setScreen("home");
            showToast("記録しました");
          }}
          onBack={() => setScreen("viewProfile")}
          onToast={showToast}
        />
        <Toast msg={toast.msg} show={toast.show} variant={toast.variant} />
      </>
    );
  }

  // HistoryScreen
  if (screen === "history") {
    const favoriteIds = new Set((db.favorites || []).filter((f) => f.userId === user.id).map((f) => f.favoriteUserId));
    const getIsFav = (peerId: string) => {
      const opt = optimisticFavToggles.get(peerId);
      if (opt !== undefined) return opt;
      return favoriteIds.has(peerId);
    };
    const myConns = db.connections.filter((c) => c.from === user.id || c.to === user.id);
    const peersWithConn = myConns
      .map((c) => {
        const peerId = c.from === user.id ? c.to : c.from;
        const peer = db.users.find((u) => u.id === peerId);
        const myRating = peer ? db.ratings.find((r) => r.from === user.id && r.to === peerId) : undefined;
        return peer ? { peer, conn: c, myRating } : null;
      })
      .filter(Boolean) as { peer: KoifesUser | { id: string; nickname?: string; age?: string; job?: string }; conn: { createdAt?: string }; myRating?: KoifesRating }[];
    const visiblePeersWithConn = historyFavoritesOnly
      ? peersWithConn.filter((x) => getIsFav(x.peer.id))
      : peersWithConn;
    return (
      <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, color: "#fff" }}>
        <Header title="History" onLeft={() => nav("home")} />
        <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.4em", color: gold, marginBottom: 8 }}>CONNECTIONS</p>
          <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 20, fontWeight: 400, marginBottom: 12 }}>接続した人：{peersWithConn.length}人</h2>
          <button
            onClick={() => setHistoryFavoritesOnly((v) => !v)}
            style={{
              marginBottom: 20,
              background: "transparent",
              border: `1px solid ${historyFavoritesOnly ? "rgba(200,169,110,0.4)" : "rgba(255,255,255,0.2)"}`,
              color: historyFavoritesOnly ? gold : "#999",
              fontSize: 11,
              padding: "8px 14px",
              cursor: "pointer",
              letterSpacing: "0.08em",
            }}
          >
            {historyFavoritesOnly ? "♡ お気に入りのみ表示中" : "♡ お気に入りのみ表示"}
          </button>
          {visiblePeersWithConn.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontSize: 28, marginBottom: 16, opacity: 0.15 }}>◇</p>
              <p style={{ fontSize: 12, color: "#555" }}>
                {historyFavoritesOnly ? "お気に入り登録した人はいません" : "まだ誰とも接続していません"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visiblePeersWithConn.map(({ peer: p, conn, myRating }) => {
                const isFav = getIsFav(p.id);
                const connDate = conn.createdAt
                  ? new Date(conn.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric", year: "numeric" })
                  : null;
                const exchangeAnswered = myRating && myRating.wantExchange !== undefined && myRating.wantExchange !== null;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 24,
                      padding: 24,
                      margin: 0,
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 12,
                    }}
                  >
                    <button
                      onClick={async () => {
                        const hasFullProfile = "code" in p && "email" in p;
                        if (hasFullProfile) {
                          setTarget(p);
                          setViewProfileFrom("history");
                          setScreen("viewProfile");
                          return;
                        }
                        try {
                          const res = await fetch(`/api/user-profile/${encodeURIComponent(p.id)}`, {
                            credentials: "include",
                            cache: "no-store",
                          });
                          if (res.ok) {
                            const { user: fullUser } = await res.json();
                            setTarget(fullUser);
                            setViewProfileFrom("history");
                            setScreen("viewProfile");
                          } else {
                            showToast("プロフィールの取得に失敗しました", true);
                          }
                        } catch {
                          showToast("プロフィールの取得に失敗しました", true);
                        }
                      }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          border: `1px solid ${goldBorder}`,
                          flexShrink: 0,
                          background: "#111",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          fontFamily: "'Noto Sans JP', sans-serif",
                          color: gold,
                          fontStyle: "italic",
                        }}
                      >
                        {p.nickname?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{p.nickname}</div>
                        <div style={{ fontSize: 14, color: "#ddd", marginBottom: connDate ? 4 : 0 }}>
                          {[p.age, p.job].filter(Boolean).join(" · ")}
                        </div>
                        {connDate && (
                          <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.05em" }}>{connDate}</div>
                        )}
                        {exchangeAnswered && (
                          <div style={{ fontSize: 10, color: myRating?.wantExchange ? gold : "#666", marginTop: 6 }}>
                            {myRating?.wantExchange ? "交換希望 ✓" : "交換なし"}
                          </div>
                        )}
                      </div>
                    </button>
                    <HistoryExchangeSection
                      peer={p}
                      user={user}
                      myRating={myRating}
                      refreshDb={refreshDb}
                      showToast={showToast}
                    />
                    <HistoryHeartButton
                      isFavorite={isFav}
                      onToggle={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newFav = !isFav;
                        setOptimisticFavToggles((prev) => new Map(prev).set(p.id, newFav));
                        try {
                          await toggleFavorite(user.id, p.id);
                          await refreshDb();
                          setOptimisticFavToggles((prev) => {
                            const n = new Map(prev);
                            n.delete(p.id);
                            return n;
                          });
                          showToast(newFav ? "お気に入りに追加しました" : "お気に入りを解除しました");
                        } catch {
                          setOptimisticFavToggles((prev) => {
                            const n = new Map(prev);
                            n.delete(p.id);
                            return n;
                          });
                          showToast("保存に失敗しました", true);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <BottomNav active="home" onNav={nav} />
        <Toast msg={toast.msg} show={toast.show} variant={toast.variant} />
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
            try {
              await updateUser({ ...user, ...updated });
              setUser({ ...user, ...updated });
              await refreshDb();
              showToast("保存しました");
            } catch {
              showToast("保存に失敗しました。もう一度お試しください", true);
            }
          }}
          onNav={nav}
          onLogout={async () => {
            await supabase.auth.signOut();
            if (process.env.NEXT_PUBLIC_DEV_BYPASS_4DIGIT === "1") {
              await fetch("/api/dev-logout", { method: "POST", credentials: "include" });
            }
            router.push("/login");
          }}
        />
        <Toast msg={toast.msg} show={toast.show} variant={toast.variant} />
      </>
    );
  }

  return null;
}

function HistoryExchangeSection({
  peer,
  user,
  myRating,
  refreshDb,
  showToast,
}: {
  peer: KoifesUser | { id: string; nickname?: string };
  user: KoifesUser;
  myRating?: KoifesRating;
  refreshDb: () => Promise<KoifesDb>;
  showToast: (msg: string, isError?: boolean) => void;
}) {
  const [popup, setPopup] = useState<boolean | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const exchangeAnswered = myRating && myRating.wantExchange !== undefined && myRating.wantExchange !== null;

  const saveExchange = async (want: boolean) => {
    setSaving(true);
    try {
      if (myRating?.id) {
        await updateRatingExchange(myRating.id, want, reasons);
      } else {
        await addRating({
          id: uid(),
          from: user.id,
          to: peer.id,
          impression: 5,
          ease: 5,
          again: "5",
          overall: 5,
          wantExchange: want,
          exchangeReason: reasons.length > 0 ? reasons : undefined,
          createdAt: new Date().toISOString(),
        });
        const exists = await load();
        const connExists = exists.connections.find((c) => (c.from === user.id && c.to === peer.id) || (c.from === peer.id && c.to === user.id));
        if (!connExists) {
          await addConnection({
            id: uid(),
            from: user.id,
            to: peer.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
      await refreshDb();
      setPopup(null);
      showToast("保存しました");
    } catch {
      showToast("保存に失敗しました", true);
    } finally {
      setSaving(false);
    }
  };

  if (popup !== null) {
    const options = popup ? EXCHANGE_REASON_YES : EXCHANGE_REASON_NO;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 24,
        }}
        onClick={(e) => e.target === e.currentTarget && setPopup(null)}
      >
        <div
          style={{
            background: "#1a1a1a",
            border: `1px solid ${gold}`,
            borderRadius: 12,
            padding: 24,
            maxWidth: 320,
            width: "100%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ fontSize: 13, color: "#fff", marginBottom: 16 }}>理由を選んでください（複数可）</p>
          <ChipGroup options={options} value={reasons} onChange={(v) => setReasons(v as string[])} multi small />
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <BtnSecondary onClick={() => setPopup(null)}>キャンセル</BtnSecondary>
            <BtnPrimary onClick={() => saveExchange(popup)} disabled={saving}>
              {saving ? "保存中..." : "確定"}
            </BtnPrimary>
          </div>
        </div>
      </div>
    );
  }

  if (exchangeAnswered) {
    return (
      <button
        onClick={() => {
          setReasons(myRating?.exchangeReason ?? []);
          setPopup(myRating?.wantExchange ?? false);
        }}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#999",
          fontSize: 10,
          padding: "6px 10px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {myRating?.wantExchange ? "交換希望 ✓" : "交換なし"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      <button
        onClick={() => setPopup(true)}
        style={{
          background: "transparent",
          border: "1px solid rgba(200,169,110,0.4)",
          color: gold,
          fontSize: 11,
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        はい
      </button>
      <button
        onClick={() => setPopup(false)}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#999",
          fontSize: 11,
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        いいえ
      </button>
    </div>
  );
}

function HistoryHeartButton({
  isFavorite,
  onToggle,
}: {
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const [animating, setAnimating] = useState(false);
  const handleClick = (e: React.MouseEvent) => {
    setAnimating(true);
    onToggle(e);
    setTimeout(() => setAnimating(false), 300);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        flexShrink: 0,
        width: 44,
        height: 44,
        minWidth: 44,
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: isFavorite ? "#FF69B4" : "rgba(255,255,255,0.35)",
        fontSize: 26,
        transition: "transform 0.2s ease, color 0.2s ease",
        transform: animating ? "scale(1.35)" : "scale(1)",
      }}
    >
      {isFavorite ? "♥" : "♡"}
    </button>
  );
}

function ViewProfileContent({
  target,
  user,
  db,
  viewProfileFrom,
  setScreen,
  refreshDb,
  toggleFavorite,
  showToast,
}: {
  target: KoifesUser;
  user: KoifesUser;
  db: KoifesDb;
  viewProfileFrom: "scan" | "history";
  setScreen: (s: string) => void;
  refreshDb: () => Promise<KoifesDb>;
  toggleFavorite: (userId: string, favId: string) => Promise<boolean>;
  showToast: (msg: string, isError?: boolean) => void;
}) {
  const isFavorite = (db.favorites || []).some((f) => f.userId === user.id && f.favoriteUserId === target.id);
  const myRating = (db.ratings || []).find((r) => r.from === user.id && r.to === target.id);
  const rows = [
      ["年齢", target.ageNumber ? `${target.ageNumber}歳` : target.age],
      ["職業", target.job],
      ["結婚への希望", target.marriage],
      ["趣味", (target.hobbies || []).join("、")],
      ["価値観", (target.values || []).join("、")],
      ["自分の長所", target.personality],
    ].filter(([, v]) => v);
    return (
      <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
        <Header title="Profile" onLeft={() => setScreen(viewProfileFrom)} />
        <div style={{ padding: "24px 24px 140px", maxWidth: 480, margin: "0 auto", animation: "cardReveal 0.6s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <Avatar char={target.nickname?.[0]} size={80} borderColor={goldBorder} />
            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 24, fontWeight: 400, marginTop: 16 }}>{target.nickname}</h2>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", color: "#999", marginTop: 6 }}>{[target.age, target.job, target.height && `${target.height}cm`].filter(Boolean).join(" · ")}</p>
            <button
              onClick={async () => {
                try {
                  await toggleFavorite(user.id, target.id);
                  await refreshDb();
                } catch {
                  showToast("保存に失敗しました。もう一度お試しください", true);
                }
              }}
              style={{
                marginTop: 14,
                background: "transparent",
                border: `1px solid ${isFavorite ? "rgba(200,169,110,0.45)" : "rgba(255,255,255,0.2)"}`,
                color: isFavorite ? gold : "#999",
                fontSize: 12,
                padding: "8px 16px",
                cursor: "pointer",
                letterSpacing: "0.08em",
              }}
            >
              {isFavorite ? "♡ お気に入り済み" : "♡ お気に入り"}
            </button>
          </div>
          {rows.map(([l, v]) => (
            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${faintLine2}` }}>
              <span style={{ fontSize: 11, color: "#666", flexShrink: 0 }}>{l}</span>
              <span style={{ fontSize: 13, textAlign: "right", marginLeft: 16, color: "#ccc", fontWeight: 400 }}>{v}</span>
            </div>
          ))}

          {myRating && (
            <div style={{ marginTop: 32, padding: "20px 0", borderTop: `1px solid ${faintLine2}` }}>
              <p style={{ fontSize: 11, letterSpacing: "0.15em", color: "#555", marginBottom: 12 }}>あなたの評価メモ ※相手には表示されません</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#999" }}>
                  <span>見た目</span>
                  <span style={{ color: gold, fontWeight: 500 }}>{myRating.impression}/10</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#999" }}>
                  <span>話しやすさ</span>
                  <span style={{ color: gold, fontWeight: 500 }}>{myRating.ease}/10</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#999" }}>
                  <span>ステータス</span>
                  <span style={{ color: gold, fontWeight: 500 }}>{myRating.again ?? "-"}/10</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, #000 60%, transparent)", padding: "32px 24px 36px", maxWidth: 480, margin: "0 auto" }}>
          <BtnPrimary onClick={() => setScreen("rate")}>{myRating ? "評価を修正する →" : "この人を評価する →"}</BtnPrimary>
        </div>
      </div>
    );
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
  onToast,
}: {
  user: KoifesUser;
  onNav: (id: string) => void;
  onFound: (t: KoifesUser) => void;
  onToast: (msg: string, isError?: boolean) => void;
}) {
  const [mode, setMode] = useState<"loading" | "camera" | "fallback">("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const resolvingRef = useRef(false);

  const resolveCode = useCallback(
    async (decodedCode: string) => {
      if (resolvingRef.current) return;
      const raw = String(decodedCode || "").trim();
      // 4桁コード抽出: ?code=XXXX | /code/XXXX | /u/XXXX | 最後の4桁英数字 | 先頭4桁
      const codeParam = raw.match(/[?&]code=([A-Za-z0-9]{4})/i);
      const pathCode = raw.match(/\/(?:code|u)\/([A-Za-z0-9]{4})\b/i);
      const fourChar = raw.match(/([A-Z0-9]{4})/gi);
      const codeStr = (
        codeParam?.[1] ||
        pathCode?.[1] ||
        fourChar?.[fourChar.length - 1] ||
        raw.replace(/[^A-Z0-9]/gi, "").slice(0, 4) ||
        ""
      ).toUpperCase();
      if (codeStr.length < 4) {
        console.warn("[ScanScreen] 4桁コードを抽出できませんでした raw:", raw.slice(0, 100));
        onToast("QRコードの形式が正しくありません", true);
        return;
      }
      resolvingRef.current = true;
      console.log("[ScanScreen] 解析したコード:", codeStr, "元データ:", raw.slice(0, 80));
      try {
        const res = await fetch(`/api/lookup-by-code?code=${encodeURIComponent(codeStr)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const { user: found } = await res.json();
          if (found && found.id !== user.id) {
            if (scannerRef.current) {
              try {
                await scannerRef.current.stop();
              } catch (e) {
                console.warn("[QR] スキャナー停止時のエラー（無視可）:", e);
              }
            }
            onFound(found);
          } else {
            setError("自分自身のコードです");
            onToast("自分自身のコードです", true);
          }
        } else {
          setError("該当するユーザーが見つかりません");
          onToast("該当するユーザーが見つかりません", true);
        }
      } catch (err) {
        console.error("[ScanScreen] resolveCode failed:", err);
        onToast("通信エラーが発生しました。電波状況を確認してください", true);
      } finally {
        resolvingRef.current = false;
      }
    },
    [user.id, onFound, onToast]
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
        await new Promise((r) => setTimeout(r, 100));
        if (!mounted) return;
        console.log("[QR] Scanner starting...");
        const { Html5Qrcode } = await import("html5-qrcode");
        const container = document.getElementById("qr-reader-scan");
        if (!container || !mounted) return;
        const html5QrCode = new Html5Qrcode("qr-reader-scan");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            console.log("[QR] Scanned:", decodedText);
            if (mounted) resolveCode(decodedText);
          },
          () => {}
        );
        if (mounted) setMode("camera");
      } catch (err) {
        console.error("[QR] Start error:", err);
        console.warn("[ScanScreen] カメラ利用不可, フォールバック表示:", err);
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (e) {
            console.warn("[QR] スキャナー停止時のエラー（無視可）:", e);
          }
          scannerRef.current = null;
        }
        if (mounted) setMode("fallback");
      }
    };
    initScanner();
    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        try {
          scanner.stop().catch((e) => console.warn("[QR] スキャナー停止時のエラー（無視可）:", e));
        } catch (e) {
          console.warn("[QR] スキャナー停止時のエラー（無視可）:", e);
        }
      }
    };
  }, [resolveCode]);

  const showFallback = () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        scanner.stop().catch((e) => console.warn("[QR] スキャナー停止時のエラー（無視可）:", e));
      } catch (e) {
        console.warn("[QR] スキャナー停止時のエラー（無視可）:", e);
      }
    }
    setMode("fallback");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 80, color: "#fff" }}>
      <Header title="Scan" onLeft={() => onNav("home")} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px" }}>
        {(mode === "loading" || mode === "camera") && (
          <div style={{ position: "relative", width: "100%", maxWidth: 320, minHeight: 280 }}>
            <div
              id="qr-reader-scan"
              style={{
                width: "100%",
                marginBottom: 16,
                minHeight: 260,
              }}
            />
            {mode === "loading" && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
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
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 32,
                fontWeight: 400,
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
  existingRating,
  onComplete,
  onBack,
  onToast,
}: {
  target: KoifesUser;
  user: KoifesUser;
  existingRating?: KoifesRating | undefined;
  onComplete: () => void;
  onBack: () => void;
  onToast: (msg: string, isError?: boolean) => void;
}) {
  const [imp, setImp] = useState(existingRating?.impression ?? 5);
  const [ease, setEase] = useState(existingRating?.ease ?? 5);
  const [status, setStatus] = useState(existingRating?.again ? Number(existingRating.again) || 5 : 5);
  const [wantExchange, setWantExchange] = useState<boolean | null>(existingRating?.wantExchange ?? null);
  const [exchangeReasons, setExchangeReasons] = useState<string[]>(existingRating?.exchangeReason ?? []);
  const [done, setDone] = useState(false);
  const [sub, setSub] = useState(false);

  const accentColor = "#ec4899";
  const RateSlider = ({
    label,
    note,
    value,
    onChange,
    leftText,
    rightText,
    min,
    max,
  }: {
    label: string;
    note?: string;
    value: number;
    onChange: (v: number) => void;
    leftText: string;
    rightText: string;
    min: number;
    max: number;
  }) => (
    <div style={{ marginBottom: 32 }} className="rate-slider">
      <style>{`
        .rate-slider input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${accentColor};
          cursor: pointer;
          border: 3px solid #000;
          box-shadow: 0 0 10px rgba(236,72,153,0.45);
        }
        .rate-slider input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${accentColor};
          cursor: pointer;
          border: 3px solid #000;
          box-shadow: 0 0 10px rgba(236,72,153,0.45);
        }
      `}</style>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{label}</p>
      {note && <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{note}</p>}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: accentColor }}>{value}</span>
        <span style={{ fontSize: 14, color: "#888" }}> / {max}</span>
      </div>
      <div style={{ padding: "0 4px" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: "100%",
            height: 8,
            appearance: "none",
            WebkitAppearance: "none",
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((value - min) / (max - min)) * 100}%, rgba(236,72,153,0.25) ${((value - min) / (max - min)) * 100}%, rgba(236,72,153,0.25) 100%)`,
            borderRadius: 4,
            outline: "none",
            cursor: "pointer",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "#666" }}>{leftText}</span>
          <span style={{ fontSize: 11, color: "#666" }}>{rightText}</span>
        </div>
      </div>
    </div>
  );

  const submit = async () => {
    if (!imp || !ease || !status) return;
    if (wantExchange === null) {
      onToast("連絡先交換の希望を選択してください", true);
      return;
    }
    setSub(true);
    try {
      console.log("Saving rating:", { impression: imp, ease, status, wantExchange, exchangeReasons });
      const ov = Math.round(((imp + ease + status) / 3) * 10) / 10;
      if (existingRating?.id) {
        await updateRating({
          ...existingRating,
          impression: imp,
          ease,
          again: String(status),
          overall: ov,
          wantExchange,
          exchangeReason: exchangeReasons.length > 0 ? exchangeReasons : undefined,
        });
      } else {
        await addRating({
          id: uid(),
          from: user.id,
          to: target.id,
          impression: imp,
          ease,
          again: String(status),
          overall: ov,
          wantExchange,
          exchangeReason: exchangeReasons.length > 0 ? exchangeReasons : undefined,
          createdAt: new Date().toISOString(),
        });
      }
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
    } catch (err) {
      console.error("Rating save error:", err);
      if (err && typeof err === "object") {
        try {
          console.error("Rating save error detail:", JSON.stringify(err));
        } catch {}
      }
      setSub(false);
      onToast("保存に失敗しました。もう一度お試しください", true);
      return;
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ width: 64, height: 64, border: `2px solid ${gold}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "checkPop 0.5s ease", marginBottom: 24 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 18, fontWeight: 400 }}>評価を送信しました</p>
        <p style={{ fontSize: 11, color: "#666", marginTop: 12, letterSpacing: "0.15em" }}>※ 本人には表示されません</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", color: "#fff" }}>
      <Header title="Impression" onLeft={onBack} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 24, borderBottom: `1px solid ${faintLine}`, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <Avatar char={target.nickname?.[0]} size={48} />
        <div>
          <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 18, fontWeight: 400 }}>{target.nickname}</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{target.age} · {target.job}</div>
        </div>
      </div>
      <InfoBox>✧ この記録は相手には一切表示されません。あなたの印象メモとして、また匿名統計データとして地域づくりに活かされます。</InfoBox>
      <div style={{ flex: 1, padding: "8px 24px 40px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <RateSlider label="見た目" value={imp} onChange={setImp} leftText="低い" rightText="高い" min={1} max={10} />
        <RateSlider label="話しやすさ" value={ease} onChange={setEase} leftText="話しにくい" rightText="話しやすい" min={1} max={10} />
        <RateSlider label="ステータス" note="（職業・年収・社会的立場の印象）" value={status} onChange={setStatus} leftText="低い" rightText="高い" min={1} max={10} />

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${faintLine}` }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>連絡先を交換したいですか？</p>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setWantExchange(true); setExchangeReasons([]); }}
              style={{
                flex: 1,
                padding: "14px 16px",
                background: wantExchange === true ? "rgba(200,169,110,0.25)" : "transparent",
                border: wantExchange === true ? `2px solid ${gold}` : "1px solid rgba(255,255,255,0.2)",
                color: wantExchange === true ? gold : "#999",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'Noto Sans JP', sans-serif",
                borderRadius: 8,
              }}
            >
              はい
            </button>
            <button
              type="button"
              onClick={() => { setWantExchange(false); setExchangeReasons([]); }}
              style={{
                flex: 1,
                padding: "14px 16px",
                background: wantExchange === false ? "rgba(200,169,110,0.25)" : "transparent",
                border: wantExchange === false ? `2px solid ${gold}` : "1px solid rgba(255,255,255,0.2)",
                color: wantExchange === false ? gold : "#999",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'Noto Sans JP', sans-serif",
                borderRadius: 8,
              }}
            >
              いいえ
            </button>
          </div>
          {wantExchange !== null && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
                {wantExchange ? "理由を選んでください（複数可）" : "理由を選んでください（複数可）"}
              </p>
              <ChipGroup
                options={wantExchange ? EXCHANGE_REASON_YES : EXCHANGE_REASON_NO}
                value={exchangeReasons}
                onChange={(v) => setExchangeReasons(v as string[])}
                multi
                small
              />
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "sticky", bottom: 0, background: "linear-gradient(to top, #000 60%, transparent)", padding: "32px 24px 36px" }}>
        <BtnPrimary onClick={submit} disabled={sub || !imp || !ease || !status || wantExchange === null}>{sub ? "保存中..." : "保存する"}</BtnPrimary>
      </div>
    </div>
  );
}

// ProfileScreen
function ProfileScreen({
  user,
  onSave,
  onNav,
  onLogout,
}: {
  user: KoifesUser;
  onSave: (updated: Partial<KoifesUser>) => void;
  onNav: (id: string) => void;
  onLogout: () => void;
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
      <span style={{ fontSize: 12, letterSpacing: "0.3em", color: gold }}>{title}</span>
      {editing !== sid && <EditIcon onClick={() => startEdit(sid)} />}
    </div>
  );
  const Row = ({ label, value, hide }: { label: string; value?: string | null; hide?: boolean }) => {
    if (hide) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${faintLine2}` }}>
        <span style={{ fontSize: 11, color: "#555", flexShrink: 0, minWidth: 80 }}>{label}</span>
        <span style={{ fontSize: 13, color: value ? "#ccc" : "#333", fontWeight: 400, textAlign: "right", marginLeft: 12 }}>{value || "未入力"}</span>
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
          <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, marginTop: 16 }}>{user.fullName || user.nickname}</h2>
          <p style={{ fontSize: 11, letterSpacing: "0.15em", color: "#666", marginTop: 6 }}>{[user.age, user.job, user.height && `${user.height}cm`].filter(Boolean).join(" · ")}</p>
          <p style={{ fontSize: 12, letterSpacing: "0.25em", color: "#444", marginTop: 8, fontFamily: "'Noto Sans JP', sans-serif" }}>CODE: {user.code}</p>
        </div>

        <SH title="BASIC INFO" sid="basic" />
        {editing === "basic" ? (
          <EditBox>
            <div style={{ marginBottom: 18 }}><FormLabel>フルネーム</FormLabel><FormInput value={draft.fullName || ""} onChange={(v) => setD("fullName", v)} maxLength={30} /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>ニックネーム</FormLabel><FormInput value={draft.nickname || ""} onChange={(v) => setD("nickname", v)} maxLength={10} /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>性別</FormLabel><ChipGroup options={["男性", "女性"]} value={draft.gender || ""} onChange={(v) => setD("gender", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>年齢（年代）</FormLabel><ChipGroup options={AGES} value={draft.age || ""} onChange={(v) => setD("age", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>年齢（数値）</FormLabel><FormInput value={draft.ageNumber ? String(draft.ageNumber) : ""} onChange={(v) => setD("ageNumber", v ? parseInt(v, 10) || undefined : undefined)} placeholder="年齢を入力" type="number" min={18} max={100} /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>身長</FormLabel><FormInput value={draft.height || ""} onChange={(v) => setD("height", v)} type="number" /></div>
            <div style={{ marginBottom: 0 }}><FormLabel>職業</FormLabel><ChipGroup options={JOBS} value={draft.job || ""} onChange={(v) => setD("job", v as string)} small /></div>
          </EditBox>
        ) : (
          <><Row label="フルネーム" value={user.fullName} /><Row label="ニックネーム" value={user.nickname} /><Row label="性別" value={user.gender} /><Row label="年齢" value={user.age} /><Row label="年齢（数値）" value={user.ageNumber ? `${user.ageNumber}歳` : undefined} /><Row label="身長" value={user.height ? `${user.height}cm` : undefined} /><Row label="職業" value={user.job} /></>
        )}

        <SH title="VALUES & HOPES" sid="values" />
        {editing === "values" ? (
          <EditBox>
            <div style={{ marginBottom: 18 }}><FormLabel>年収帯</FormLabel><ChipGroup options={INCOME} value={draft.income || ""} onChange={(v) => setD("income", v as string)} small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>結婚の希望</FormLabel><ChipGroup options={MARRIAGE} value={draft.marriage || ""} onChange={(v) => setD("marriage", v as string)} accent small /></div>
            {["強く望んでいる", "できればしたい"].includes(draft.marriage || "") && <div style={{ marginBottom: 18, marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid rgba(200,169,110,0.3)" }}><FormLabel>いつまでに？</FormLabel><ChipGroup options={MARRIAGE_BY_WHEN} value={draft.marriageByWhen || ""} onChange={(v) => setD("marriageByWhen", v as string)} accent small /></div>}
            <div style={{ marginBottom: 18 }}><FormLabel>子供の希望</FormLabel><ChipGroup options={CHILDREN} value={draft.children || ""} onChange={(v) => setD("children", v as string)} accent small /></div>
            {draft.children === "欲しい" && <div style={{ marginBottom: 18, marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid rgba(200,169,110,0.3)" }}><FormLabel>いつまでに？</FormLabel><ChipGroup options={CHILDREN_BY_WHEN} value={draft.childrenByWhen || ""} onChange={(v) => setD("childrenByWhen", v as string)} accent small /></div>}
            <div style={{ marginBottom: 18 }}><FormLabel>趣味</FormLabel><ChipGroup options={HOBBIES} value={draft.hobbies || []} onChange={(v) => setD("hobbies", v as string[])} multi small /></div>
            <div style={{ marginBottom: 18 }}><FormLabel>価値観</FormLabel><ChipGroup options={VALUES} value={draft.values || []} onChange={(v) => setD("values", v as string[])} multi small /></div>
            <div style={{ marginBottom: 0 }}><FormLabel>参加歴</FormLabel><ChipGroup options={EVENT_EXP} value={draft.eventExp || ""} onChange={(v) => setD("eventExp", v as string)} small /></div>
          </EditBox>
        ) : (
          <><Row label="結婚の希望" value={user.marriage} /><Row label="結婚の時期" value={user.marriageByWhen} hide={!["強く望んでいる", "できればしたい"].includes(user.marriage || "")} /><Row label="子供の希望" value={user.children} /><Row label="子供の時期" value={user.childrenByWhen} hide={user.children !== "欲しい"} /><Row label="趣味" value={(user.hobbies || []).join("、") || undefined} /><Row label="価値観" value={(user.values || []).join("、") || undefined} /><Row label="自分の長所" value={user.personality} /></>
        )}

        <button
          onClick={onLogout}
          style={{
            marginTop: 40,
            padding: "12px 24px",
            background: "transparent",
            border: "1px solid #444",
            borderRadius: 8,
            color: "#888",
            fontSize: 13,
            cursor: "pointer",
            width: "100%",
          }}
        >
          ログアウト
        </button>
      </div>
      <BottomNav active="profile" onNav={onNav} />
    </div>
  );
}

