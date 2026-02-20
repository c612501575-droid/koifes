"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { load, loadSession } from "@/app/lib/koifes-db";
import { supabase } from "@/app/lib/supabase";
import type { KoifesUser } from "@/app/lib/koifes-db";
import { gold, faintLine2 } from "@/app/lib/koifes-constants";
import { Header, BtnPrimary, ChipGroup, FormLabel, FormInput } from "@/app/components/koifes/ui";

const CONTACT_METHODS = ["LINE", "メール", "電話", "その他"];

export default function FollowupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState<KoifesUser[]>([]);
  const [followups, setFollowups] = useState<Record<string, { want_contact: boolean; contact_method: string; message: string }>>({});
  const [mutualMap, setMutualMap] = useState<Record<string, { contact_method: string; message: string }>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sid = loadSession();
      if (!sid) {
        router.push("/login");
        return;
      }
      const data = await load();
      const user = data.users.find((u) => u.id === sid);
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const connected = data.connections
        .filter((c) => c.from === sid || c.to === sid)
        .map((c) => data.users.find((u) => u.id === (c.from === sid ? c.to : c.from)))
        .filter(Boolean) as KoifesUser[];
      setPeers(connected);

      const { data: fData } = await supabase.from("koifes_followups").select("*").eq("from_user_id", sid);
      const map: Record<string, { want_contact: boolean; contact_method: string; message: string }> = {};
      (fData || []).forEach((f: { to_user_id: string; want_contact: boolean; contact_method: string | null; message: string | null }) => {
        map[f.to_user_id] = {
          want_contact: f.want_contact ?? false,
          contact_method: f.contact_method || "",
          message: f.message || "",
        };
      });
      setFollowups(map);

      const { data: mutualData } = await supabase
        .from("koifes_followups")
        .select("*")
        .eq("to_user_id", sid)
        .eq("want_contact", true);
      const mMap: Record<string, { contact_method: string; message: string }> = {};
      (mutualData || []).forEach((m: { from_user_id: string; contact_method: string | null; message: string | null }) => {
        mMap[m.from_user_id] = {
          contact_method: m.contact_method || "",
          message: m.message || "",
        };
      });
      setMutualMap(mMap);
      setLoading(false);
    })();
  }, [router]);

  const updateFollowup = (toId: string, updates: Partial<{ want_contact: boolean; contact_method: string; message: string }>) => {
    setFollowups((prev) => ({
      ...prev,
      [toId]: { ...(prev[toId] || { want_contact: false, contact_method: "", message: "" }), ...updates },
    }));
  };

  const saveFollowup = async (toId: string) => {
    if (!userId) return;
    const f = followups[toId] || { want_contact: false, contact_method: "", message: "" };
    setSubmitting(toId);
    try {
      const { error } = await supabase.from("koifes_followups").upsert(
        {
          from_user_id: userId,
          to_user_id: toId,
          want_contact: f.want_contact,
          contact_method: f.contact_method || null,
          message: f.message || null,
        },
        { onConflict: "from_user_id,to_user_id" }
      );
      if (error) throw error;
      setEditing(null);
    } catch (err) {
      console.error("[followup] save failed:", err);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 12 }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 100 }}>
      <Header title="フォローアップ" onLeft={() => router.push("/app")} />
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 10, letterSpacing: "0.3em", color: gold, marginBottom: 8 }}>CONTACT REQUEST</p>
        <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, fontWeight: 300, marginBottom: 24 }}>
          接続した人に連絡先交換をリクエスト
        </h2>
        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.8, marginBottom: 32 }}>
          気になった方に連絡先交換を希望する旨を伝えましょう。相手が同じように希望すると、相互に連絡方法が共有されます。
        </p>

        {peers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 28, marginBottom: 16, opacity: 0.15 }}>♡</p>
            <p style={{ fontSize: 12, color: "#555" }}>まだ誰とも接続していません</p>
            <p style={{ fontSize: 11, color: "#444", marginTop: 8 }}>スキャンで相手のコードを読み取り、接続後に利用できます</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {peers.map((p) => {
              const f = followups[p.id] || { want_contact: false, contact_method: "", message: "" };
              const isEditing = editing === p.id;
              const mutual = f.want_contact && mutualMap[p.id];
              return (
                <div
                  key={p.id}
                  style={{
                    border: mutual ? `1px solid ${gold}` : `1px solid ${faintLine2}`,
                    padding: 20,
                    background: mutual ? "rgba(200,169,110,0.04)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: isEditing ? 20 : 0 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        border: "1px solid rgba(255,255,255,0.12)",
                        flexShrink: 0,
                        background: "#111",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontFamily: "'Cormorant Garamond', serif",
                        color: gold,
                        fontStyle: "italic",
                      }}
                    >
                      {p.nickname?.[0] || "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 300 }}>{p.nickname}</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{p.age} · {p.job}</div>
                      {mutual ? (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, color: gold, letterSpacing: "0.05em", marginBottom: 8 }}>
                            ✧ マッチしました！ 相手も連絡先交換を希望しています
                          </div>
                          <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>相手の希望連絡方法：{mutual.contact_method || "—"}</div>
                          {mutual.message && <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>相手からのメッセージ：「{mutual.message}」</div>}
                          <div style={{ fontSize: 9, color: "#555", marginTop: 8 }}>※ 実際の連絡先の交換は、運営を通じて行われます</div>
                        </div>
                      ) : f.want_contact ? (
                        <div style={{ fontSize: 10, color: gold, marginTop: 6, letterSpacing: "0.1em" }}>
                          リクエスト済み {f.contact_method && `（${f.contact_method}）`}
                        </div>
                      ) : null}
                    </div>
                    {!isEditing ? (
                      <button
                        onClick={() => setEditing(p.id)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#999",
                          fontSize: 11,
                          padding: "8px 16px",
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {f.want_contact ? "編集" : "リクエスト"}
                      </button>
                    ) : null}
                  </div>

                  {isEditing && (
                    <div style={{ borderTop: `1px solid ${faintLine2}`, paddingTop: 20, marginTop: 12 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={f.want_contact}
                          onChange={(e) => updateFollowup(p.id, { want_contact: e.target.checked })}
                        />
                        <span style={{ fontSize: 12 }}>連絡先交換を希望する</span>
                      </label>
                      {f.want_contact && (
                        <>
                          <div style={{ marginBottom: 16 }}><FormLabel>希望する連絡方法</FormLabel><ChipGroup options={CONTACT_METHODS} value={f.contact_method} onChange={(v) => updateFollowup(p.id, { contact_method: Array.isArray(v) ? "" : v })} small /></div>
                          <div style={{ marginBottom: 20 }}><FormLabel>メッセージ（任意）</FormLabel><FormInput value={f.message} onChange={(v) => updateFollowup(p.id, { message: v })} placeholder="一言メッセージ" /></div>
                        </>
                      )}
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={() => setEditing(null)}
                          style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#999", fontSize: 12, cursor: "pointer" }}
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => saveFollowup(p.id)}
                          disabled={!!submitting}
                          style={{ flex: 1, padding: "12px 0", background: gold, border: "none", color: "#000", fontSize: 12, cursor: submitting ? "not-allowed" : "pointer", fontWeight: 400 }}
                        >
                          {submitting === p.id ? "保存中..." : "保存"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
