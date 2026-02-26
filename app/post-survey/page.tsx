"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { load, getKoifesUserByAuthId, updateRatingExchange } from "@/app/lib/koifes-db";
import { supabase } from "@/app/lib/supabase";
import { gold, faintLine2 } from "@/app/lib/koifes-constants";
import {
  Header,
  BtnPrimary,
  ChipGroup,
  FormLabel,
  SliderInput,
  Toast,
} from "@/app/components/koifes/ui";

const STEPS = 6;

export default function PostSurveyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [satisfaction, setSatisfaction] = useState(5);
  const [funScore, setFunScore] = useState(5);
  const [comfortScore, setComfortScore] = useState(5);
  const [organizationScore, setOrganizationScore] = useState(5);
  const [interestedCount, setInterestedCount] = useState("");
  const [wantGrowth, setWantGrowth] = useState("");
  const [postEsteem, setPostEsteem] = useState(5);
  const [resistanceChange, setResistanceChange] = useState("");
  const [attendAgain, setAttendAgain] = useState("");
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [wantOthersEvaluation, setWantOthersEvaluation] = useState("");
  const [wantContactExchange, setWantContactExchange] = useState("");
  const [contactTargetNicknames, setContactTargetNicknames] = useState<string[]>([""]);
  const [lineDisplayName, setLineDisplayName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [toast, setToast] = useState({ msg: "", show: false });
  const [exchangeConfirmed, setExchangeConfirmed] = useState(false);
  const [cancelledExchanges, setCancelledExchanges] = useState<Set<string>>(new Set());
  const [cancellingToId, setCancellingToId] = useState<string | null>(null);

  const INTERESTED_COUNT_OPTIONS = ["0人", "1〜2人", "3〜5人", "6人以上"];
  const WANT_GROWTH_OPTIONS = ["とても思った", "少し思った", "あまり思わなかった", "全く思わなかった"];
  const RESISTANCE_CHANGE_OPTIONS = ["かなり減った", "少し減った", "変わらない", "少し増えた"];
  const ATTEND_OPTIONS = ["ぜひ参加したい", "機会があれば", "あまり参加したくない"];
  const PERSONALITY_TAG_OPTIONS = ["明るい", "おとなしい", "面白い", "まじめ", "優しい", "クール", "天然", "しっかり者", "ムードメーカー", "マイペース", "聞き上手", "よく笑う", "気配り上手", "ポジティブ", "社交的", "努力家", "包容力がある", "行動力がある"];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  type AppDb = {
    users: { id: string; nickname?: string }[];
    ratings: { id?: string; from: string; to: string; wantExchange?: boolean; impression?: number; ease?: number; again?: string; createdAt?: string }[];
    connections: { from: string; to: string; createdAt?: string }[];
  };

  const [db, setDb] = useState<AppDb>({ users: [], ratings: [], connections: [] });

  const applyLoadData = (data: { users?: AppDb["users"]; ratings?: AppDb["ratings"]; connections?: AppDb["connections"] }) => {
    setDb({
      users: data.users ?? [],
      ratings: data.ratings ?? [],
      connections: data.connections ?? [],
    });
  };

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let user = authUser ? await getKoifesUserByAuthId(authUser.id) : null;
      if (!user && process.env.NEXT_PUBLIC_DEV_BYPASS_4DIGIT === "1") {
        const res = await fetch("/api/dev-me", { credentials: "include", cache: "no-store" });
        const d = await res.json().catch(() => ({}));
        if (d.ok && d.user) user = d.user;
      }
      if (!user) {
        router.push(authUser ? "/register" : "/login");
        setLoading(false);
        return;
      }
      try {
        setUserId(user.id);
        const data = await load();
        applyLoadData(data);
        setLoadError(false);
      } catch (err) {
        console.error("[post-survey] load failed:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const canNext = () => {
    if (step === 0) return exchangeConfirmed;
    if (step === 1) return true;
    if (step === 2) return !!interestedCount && !!wantGrowth && !!resistanceChange;
    if (step === 3) return !!attendAgain && personalityTags.length > 0;
    if (step === 4) {
      if (!wantOthersEvaluation || !wantContactExchange) return false;
      if (wantContactExchange !== "はい") return true;
      const hasNickname = contactTargetNicknames.some((n) => n.trim());
      return hasNickname && !!lineDisplayName.trim();
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("koifes_post_surveys").upsert(
        {
          user_id: userId,
          satisfaction,
          fun_score: funScore,
          comfort_score: comfortScore,
          organization_score: organizationScore,
          interested_count: interestedCount || null,
          want_growth: wantGrowth || null,
          post_esteem: postEsteem,
          resistance_change: resistanceChange || null,
          post_barrier_change: resistanceChange || null,
          attend_again: attendAgain || null,
          personality_tags: personalityTags.length ? personalityTags : null,
          want_others_evaluation: wantOthersEvaluation ? wantOthersEvaluation === "はい、知りたい" : null,
          want_contact_exchange: wantContactExchange ? wantContactExchange === "はい" : null,
          contact_targets: contactTargetNicknames.filter((n) => n.trim()).join("; ") || null,
          feedback_text: feedbackText || null,
          free_comment: feedbackText || null,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;

      if (wantContactExchange === "はい" && contactTargetNicknames.some((n) => n.trim()) && lineDisplayName.trim()) {
        const nicknames = contactTargetNicknames.filter((n) => n.trim());
        for (const target of nicknames) {
          const { error: exErr } = await supabase.from("koifes_contact_exchanges").insert({
            from_user: userId,
            target_nickname: target.trim(),
            contact_info: lineDisplayName.trim(),
          });
          if (exErr) console.error("[post-survey] contact_exchanges insert failed:", exErr);
        }
      }

      setDone(true);
      setTimeout(() => router.push("/app"), 2000);
    } catch (err) {
      console.error("[post-survey] submit failed:", err);
      setToast({ msg: "送信に失敗しました。もう一度お試しください", show: true });
      setTimeout(() => setToast({ msg: "", show: false }), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    if (loadError) {
      return (
        <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", padding: 24, textAlign: "center" }}>
          <p style={{ marginBottom: 16 }}>データの読み込みに失敗しました</p>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>電波状況を確認して再読み込みしてください</p>
          <button
            onClick={() => { setLoading(true); setLoadError(false); window.location.reload(); }}
            style={{ padding: "12px 24px", background: "#333", border: "1px solid #555", color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
          >
            再読み込み
          </button>
        </div>
      );
    }
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 12 }}>
        読み込み中...
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ width: 64, height: 64, border: `2px solid ${gold}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "checkPop 0.5s ease", marginBottom: 24 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 18, fontWeight: 400 }}>アンケートを送信しました</p>
        <p style={{ fontSize: 11, color: "#666", marginTop: 12, letterSpacing: "0.15em" }}>ホームに戻ります...</p>
      </div>
    );
  }

  const wantExchangeRatingsRaw = db.ratings.filter((r) => r.from === userId && r.wantExchange === true && !cancelledExchanges.has(r.to));

  const getConnectionTime = (peerId: string) => {
    const c = (db.connections || []).find(
      (conn) => (conn.from === userId && conn.to === peerId) || (conn.from === peerId && conn.to === userId)
    );
    return c?.createdAt || "";
  };

  const wantExchangeRatings = [...wantExchangeRatingsRaw].sort((a, b) => {
    const scoreA = (a.impression ?? 0) + (a.ease ?? 0) + (Number(a.again) || 0);
    const scoreB = (b.impression ?? 0) + (b.ease ?? 0) + (Number(b.again) || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const timeA = getConnectionTime(a.to) || a.createdAt || "";
    const timeB = getConnectionTime(b.to) || b.createdAt || "";
    return timeA.localeCompare(timeB);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 100 }}>
      <Header title="イベント後アンケート" onLeft={() => (step > 0 ? setStep(step - 1) : router.push("/app"))} />
      <div style={{ padding: "8px 24px 24px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.3em", color: gold, marginBottom: 8 }}>STEP {step + 1} / {STEPS}</p>
        <div style={{ height: 4, background: faintLine2, marginBottom: 32, borderRadius: 2 }}>
          <div style={{ width: `${((step + 1) / STEPS) * 100}%`, height: "100%", background: gold, borderRadius: 2, transition: "width 0.4s" }} />
        </div>

        {step === 0 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>連絡先交換の確認</h2>
            <p style={{ fontSize: 14, color: "#999", marginBottom: 24, lineHeight: 1.7 }}>
              以下の方と連絡先を交換します。よろしいですか？
            </p>
            {wantExchangeRatings.length === 0 ? (
              <div style={{ padding: 32, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24 }}>
                <p style={{ fontSize: 14, color: "#666" }}>交換希望の方はいません</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {wantExchangeRatings.map((r) => {
                  const peer = db.users.find((u) => u.id === r.to);
                  if (!peer) return null;
                  return (
                    <div
                      key={r.to}
                      style={{
                        padding: 20,
                        background: "rgba(200,169,110,0.08)",
                        border: "1px solid rgba(200,169,110,0.25)",
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>{peer.nickname}</span>
                        {!exchangeConfirmed && (
                          <button
                            type="button"
                            disabled={cancellingToId === r.to}
                            onClick={async () => {
                              if (cancellingToId) return;
                              const rating = db.ratings.find((x) => x.from === userId && x.to === r.to);
                              setCancellingToId(r.to);
                              setCancelledExchanges((prev) => new Set(prev).add(r.to));
                              try {
                                if (rating?.id) {
                                  await updateRatingExchange(rating.id, false, []);
                                }
                                const data = await load();
                                applyLoadData(data);
                              } catch {
                                setCancelledExchanges((prev) => {
                                  const next = new Set(prev);
                                  next.delete(r.to);
                                  return next;
                                });
                                setToast({ msg: "通信エラーが発生しました。もう一度お試しください", show: true });
                                setTimeout(() => setToast({ msg: "", show: false }), 3000);
                              } finally {
                                setCancellingToId(null);
                              }
                            }}
                            style={{
                              padding: "6px 12px",
                              background: "transparent",
                              border: "1px solid #555",
                              color: cancellingToId === r.to ? "#555" : "#999",
                              fontSize: 12,
                              cursor: cancellingToId === r.to ? "not-allowed" : "pointer",
                              borderRadius: 6,
                            }}
                          >
                            {cancellingToId === r.to ? "処理中..." : "やっぱりやめる"}
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        見た目 {r.impression ?? "-"}/10 · 話しやすさ {r.ease ?? "-"}/10 · ステータス {r.again ?? "-"}/10
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!exchangeConfirmed && (
              <BtnPrimary onClick={() => setExchangeConfirmed(true)}>
                この内容で確定する
              </BtnPrimary>
            )}
            {exchangeConfirmed && (
              <p style={{ fontSize: 13, color: gold, marginBottom: 24 }}>✓ 確定しました。次へ進んでください。</p>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 18, fontWeight: 400, marginBottom: 24 }}>イベントの感想</h2>
            <div style={{ marginBottom: 24 }}><FormLabel>イベントの満足度（1〜10）</FormLabel><SliderInput subLeft="低い" subRight="高い" value={satisfaction} onChange={setSatisfaction} max={10} /></div>
            <div style={{ marginBottom: 24 }}><FormLabel>楽しさ（1〜10）</FormLabel><SliderInput subLeft="低い" subRight="高い" value={funScore} onChange={setFunScore} max={10} /></div>
            <div style={{ marginBottom: 24 }}><FormLabel>居心地の良さ（1〜10）</FormLabel><SliderInput subLeft="低い" subRight="高い" value={comfortScore} onChange={setComfortScore} max={10} /></div>
            <div style={{ marginBottom: 24 }}><FormLabel>運営の対応（1〜10）</FormLabel><SliderInput subLeft="低い" subRight="高い" value={organizationScore} onChange={setOrganizationScore} max={10} /></div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 18, fontWeight: 400, marginBottom: 24 }}>イベントを通じて</h2>
            <div style={{ marginBottom: 20 }}><FormLabel>気になる人は何人いましたか？</FormLabel><ChipGroup options={INTERESTED_COUNT_OPTIONS} value={interestedCount} onChange={(v) => setInterestedCount(Array.isArray(v) ? "" : v)} accent small /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>このイベントを通して「自分を変えたい・成長したい」と思いましたか？</FormLabel><ChipGroup options={WANT_GROWTH_OPTIONS} value={wantGrowth} onChange={(v) => setWantGrowth(Array.isArray(v) ? "" : v)} accent small /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>イベント後の自己肯定感（1〜10）</FormLabel><SliderInput subLeft="低い" subRight="高い" value={postEsteem} onChange={setPostEsteem} max={10} /></div>
            <div><FormLabel>異性への抵抗感に変化はありましたか？</FormLabel><ChipGroup options={RESISTANCE_CHANGE_OPTIONS} value={resistanceChange} onChange={(v) => setResistanceChange(Array.isArray(v) ? "" : v)} accent small /></div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 18, fontWeight: 400, marginBottom: 24 }}>フィードバック</h2>
            <div style={{ marginBottom: 20 }}><FormLabel>また参加したいですか？</FormLabel><ChipGroup options={ATTEND_OPTIONS} value={attendAgain} onChange={(v) => setAttendAgain(Array.isArray(v) ? "" : v)} accent small /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>周りからどんな人と呼ばれますか？（複数選択可）</FormLabel><ChipGroup options={PERSONALITY_TAG_OPTIONS} value={personalityTags} onChange={(v) => setPersonalityTags(v as string[])} multi small /></div>
            <div>
              <FormLabel>イベントへのご意見（自由記述・任意）</FormLabel>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="改善点やご感想があればお聞かせください（任意）"
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontSize: 13,
                  lineHeight: 1.7,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>送信の確認</h2>
            <p style={{ fontSize: 14, color: "#999", marginBottom: 24, lineHeight: 1.7 }}>
              内容に問題なければ送信ボタンを押してください。
            </p>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>最後に</h2>

            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              あなたに対する他の参加者からの評価を知りたいですか？
            </p>
            <ChipGroup
              options={["はい、知りたい", "いいえ、知りたくない"]}
              value={wantOthersEvaluation}
              onChange={(v) => setWantOthersEvaluation(Array.isArray(v) ? "" : v)}
              accent
              small
            />

            <div style={{ marginTop: 32 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                今日会話した人の中で、連絡先を交換したい人はいましたか？
              </p>
              <ChipGroup
                options={["はい", "いいえ"]}
                value={wantContactExchange}
                onChange={(v) => setWantContactExchange(Array.isArray(v) ? "" : v)}
                accent
                small
              />
            </div>

            {wantContactExchange === "はい" && (
              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  animation: "slideDown 0.35s ease-out",
                }}
              >
                <style>{`
                  @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>

                {/* 1. LINE表示名 */}
                <div style={{ marginBottom: 24 }}>
                  <FormLabel>あなたのLINE表示名</FormLabel>
                  <p style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
                    運営がマッチした方同士をLINEグループでお繋ぎします
                  </p>
                  <input
                    value={lineDisplayName}
                    onChange={(e) => setLineDisplayName(e.target.value)}
                    placeholder="LINEの表示名を入力"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "#000",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  />
                </div>

                {/* 2. 連絡先を交換したい相手 */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#ccc", marginBottom: 12, letterSpacing: "0.05em" }}>連絡先を交換したい相手</p>
                  {contactTargetNicknames.map((nick, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                      <input
                        value={nick}
                        onChange={(e) => {
                          const next = [...contactTargetNicknames];
                          next[i] = e.target.value;
                          setContactTargetNicknames(next);
                        }}
                        placeholder="相手のニックネーム"
                        style={{
                          flex: 1,
                          padding: "12px 14px",
                          background: "#000",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 14,
                          outline: "none",
                          fontFamily: "'Noto Sans JP', sans-serif",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (contactTargetNicknames.length <= 1) return;
                          setContactTargetNicknames(contactTargetNicknames.filter((_, j) => j !== i));
                        }}
                        disabled={contactTargetNicknames.length <= 1}
                        style={{
                          width: 40,
                          height: 40,
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          color: contactTargetNicknames.length <= 1 ? "#555" : "#999",
                          fontSize: 18,
                          cursor: contactTargetNicknames.length <= 1 ? "not-allowed" : "pointer",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setContactTargetNicknames([...contactTargetNicknames, ""])}
                    style={{
                      padding: "10px 0",
                      background: "transparent",
                      border: "none",
                      color: gold,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "'Noto Sans JP', sans-serif",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ＋ もう1人追加
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 40 }}>
          {step < STEPS - 1 ? (
            <BtnPrimary onClick={() => setStep(step + 1)} disabled={!canNext()}>次へ</BtnPrimary>
          ) : (
            <BtnPrimary onClick={handleSubmit} disabled={submitting}>{submitting ? "送信中..." : "送信する"}</BtnPrimary>
          )}
        </div>
      </div>
      <Toast msg={toast.msg} show={toast.show} variant="error" />
    </div>
  );
}
