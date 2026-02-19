"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { load } from "@/app/lib/koifes-db";
import { gold } from "@/app/lib/koifes-constants";
import { Header } from "@/app/components/koifes/ui";
import {
  AGES,
  LEAVE_REASONS,
  COMPANY_SUPPORT,
} from "@/app/lib/koifes-constants";

const faintLine = "rgba(255,255,255,0.08)";

export default function AdminPage() {
  const router = useRouter();
  const [db, setDb] = useState({ users: [] as Awaited<ReturnType<typeof load>>["users"], ratings: [] as Awaited<ReturnType<typeof load>>["ratings"], connections: [] as Awaited<ReturnType<typeof load>>["connections"] });
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load().then((d) => {
      setDb(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
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

  const { users, ratings, connections } = db;
  const male = users.filter((u) => u.gender === "男性").length;
  const female = users.filter((u) => u.gender === "女性").length;
  const avgEsteem = users.length ? (users.reduce((a, u) => a + (u.esteem || 0), 0) / users.length).toFixed(1) : "—";
  const avgRating = ratings.length ? (ratings.reduce((a, r) => a + r.overall, 0) / ratings.length).toFixed(1) : "—";
  const ageDist = AGES.map((a) => ({ g: a, c: users.filter((u) => u.age === a).length }));
  const maxAge = Math.max(...ageDist.map((a) => a.c), 1);
  const stayDist = ["ぜひ住みたい", "条件次第で", "どちらとも", "県外に出たい"].map((s) => ({
    l: s,
    c: users.filter((u) => u.stayTokushima === s).length,
  }));
  const improveDist = ["はい", "いいえ"].map((s) => ({
    l: s,
    c: users.filter((u) => u.selfImprovement === s).length,
  }));
  const tabs: Record<string, string> = { overview: "概要", users: "参加者", tokushima: "徳島データ", ratings: "評価" };

  const SC = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div style={{ border: `1px solid ${faintLine}`, padding: 16, marginBottom: 8 }}>
      {title && <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#666", marginBottom: 16 }}>{title}</div>}
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 24, color: "#fff" }}>
      <Header title="Admin" onLeft={() => router.push("/login")} />
      <div style={{ display: "flex", gap: 1, margin: "16px 16px", background: "rgba(255,255,255,0.06)", padding: 2 }}>
        {Object.entries(tabs).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              flex: 1,
              padding: "10px 4px",
              fontSize: 10,
              letterSpacing: "0.08em",
              background: tab === k ? "#fff" : "transparent",
              color: tab === k ? "#000" : "#666",
              border: "none",
              cursor: "pointer",
              fontWeight: tab === k ? 500 : 300,
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 16px", maxWidth: 480, margin: "0 auto" }}>
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { l: "総参加者", v: users.length },
                { l: "男性/女性", v: `${male}/${female}` },
                { l: "平均自己肯定感", v: avgEsteem, g: 1 },
                { l: "平均評価", v: avgRating, g: 1 },
                { l: "総接続数", v: connections.length },
                { l: "総評価数", v: ratings.length },
              ].map((s, i) => (
                <div key={i} style={{ border: `1px solid ${faintLine}`, padding: 16, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: (s as { g?: number }).g ? gold : "#fff", marginBottom: 6 }}>{s.v}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#666" }}>{s.l}</div>
                </div>
              ))}
            </div>
            <SC title="年齢層分布">
              {ageDist.map((a) => (
                <div key={a.g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: "#999", width: 56, flexShrink: 0 }}>{a.g}</span>
                  <div style={{ flex: 1, height: 16, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: gold, width: `${(a.c / maxAge) * 100}%`, transition: "width 0.5s" }} />
                  </div>
                  <span style={{ fontSize: 10, width: 20, textAlign: "right" }}>{a.c}</span>
                </div>
              ))}
            </SC>
          </div>
        )}

        {tab === "users" && (
          <div>
            {users.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555", padding: 48, fontSize: 12 }}>参加者なし</p>
            ) : (
              users.map((u) => {
                const recv = ratings.filter((r) => r.to === u.id);
                const avg = recv.length ? (recv.reduce((a, r) => a + r.overall, 0) / recv.length).toFixed(1) : "—";
                return (
                  <div key={u.id} style={{ border: `1px solid ${faintLine}`, padding: 16, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 400 }}>{u.nickname}</span>
                        <span style={{ fontSize: 10, color: "#555", marginLeft: 8 }}>#{u.code}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#666" }}>{u.gender}·{u.age}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, textAlign: "center" }}>
                      {[
                        ["職業", u.job],
                        ["肯定感", String(u.esteem ?? "")],
                        ["被評価", avg],
                        ["定住", u.stayTokushima ? u.stayTokushima.slice(0, 4) : "—"],
                      ].map(([l, v]) => (
                        <div key={l as string}>
                          <div style={{ fontSize: 11, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
                          <div style={{ fontSize: 9, color: "#555" }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "tokushima" && (
          <div>
            <SC title="徳島定住意向">
              {stayDist.map((s) => (
                <div key={s.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ color: "#999" }}>{s.l}</span>
                  <span>{s.c}人 ({users.length ? Math.round((s.c / users.length) * 100) : 0}%)</span>
                </div>
              ))}
            </SC>
            <SC title="自分磨き実施率">
              {improveDist.map((s) => (
                <div key={s.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ color: "#999" }}>{s.l}</span>
                  <span>{s.c}人 ({users.length ? Math.round((s.c / users.length) * 100) : 0}%)</span>
                </div>
              ))}
            </SC>
            <SC title="県外へ出たい理由">
              {LEAVE_REASONS.map((r) => {
                const c = users.filter((u) => u.leaveReason === r).length;
                return c > 0 ? (
                  <div key={r} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ color: "#999" }}>{r}</span>
                    <span>{c}人</span>
                  </div>
                ) : null;
              })}
            </SC>
            <SC title="企業支援で定住意向は上がるか">
              {COMPANY_SUPPORT.map((r) => {
                const c = users.filter((u) => u.companySupport === r).length;
                return (
                  <div key={r} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ color: "#999" }}>{r}</span>
                    <span>{c}人</span>
                  </div>
                );
              })}
            </SC>
            <SC title="自己肯定感 × 定住意向">
              {users
                .filter((u) => u.stayTokushima)
                .sort((a, b) => (b.esteem || 0) - (a.esteem || 0))
                .map((u) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "#555", width: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nickname}</span>
                    <span style={{ fontSize: 10, color: gold, width: 16 }}>{u.esteem}</span>
                    <span style={{ fontSize: 10, color: "#999", flex: 1 }}>{u.stayTokushima}</span>
                  </div>
                ))}
            </SC>
          </div>
        )}

        {tab === "ratings" && (
          <div>
            {ratings.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555", padding: 48, fontSize: 12 }}>評価データなし</p>
            ) : (
              [...ratings]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((r) => {
                  const from = users.find((u) => u.id === r.from);
                  const to = users.find((u) => u.id === r.to);
                  return (
                    <div key={r.id} style={{ border: `1px solid ${faintLine}`, padding: 16, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13 }}>{from?.nickname || "?"} → {to?.nickname || "?"}</span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: gold }}>{r.overall}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#666" }}>
                        <span>印象 {r.impression}</span>
                        <span>話しやすさ {r.ease}</span>
                        <span>{r.again || "—"}</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
