"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { load, loadSession } from "@/app/lib/koifes-db";
import { supabase } from "@/app/lib/supabase";
import { gold, faintLine2 } from "@/app/lib/koifes-constants";
import {
  Header,
  BtnPrimary,
  ChipGroup,
  FormLabel,
  FormInput,
  SliderInput,
} from "@/app/components/koifes/ui";

const STEPS = 4;

export default function PostSurveyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [postEsteem, setPostEsteem] = useState(5);
  const [postResistance, setPostResistance] = useState(5);
  const [postBarrierChange, setPostBarrierChange] = useState("");
  const [satisfaction, setSatisfaction] = useState(5);
  const [funScore, setFunScore] = useState(5);
  const [comfortScore, setComfortScore] = useState(5);
  const [organizationScore, setOrganizationScore] = useState(5);
  const [selfDiscovery, setSelfDiscovery] = useState("");
  const [confidenceChange, setConfidenceChange] = useState("");
  const [communicationGrowth, setCommunicationGrowth] = useState("");
  const [attendAgain, setAttendAgain] = useState("");
  const [recommendScore, setRecommendScore] = useState(5);
  const [recommendReason, setRecommendReason] = useState("");
  const [lonelinessChange, setLonelinessChange] = useState("");
  const [communityFeeling, setCommunityFeeling] = useState("");
  const [tokushimaImpressionChange, setTokushimaImpressionChange] = useState("");
  const [marriageMotivationChange, setMarriageMotivationChange] = useState("");
  const [bestMoment, setBestMoment] = useState("");
  const [improvementSuggestion, setImprovementSuggestion] = useState("");
  const [freeComment, setFreeComment] = useState("");

  const BARRIER_OPTIONS = ["かなり下がった", "少し下がった", "変わらない", "少し上がった", "かなり上がった"];
  const ATTEND_OPTIONS = ["ぜひまた参加したい", "機会があれば", "わからない", "あまり参加したいと思わない"];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

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
      setLoading(false);
    })();
  }, [router]);

  const canNext = () => {
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("koifes_post_surveys").upsert(
        {
          user_id: userId,
          post_esteem: postEsteem,
          post_resistance: postResistance,
          post_barrier_change: postBarrierChange || null,
          satisfaction,
          fun_score: funScore,
          comfort_score: comfortScore,
          organization_score: organizationScore,
          self_discovery: selfDiscovery || null,
          confidence_change: confidenceChange || null,
          communication_growth: communicationGrowth || null,
          attend_again: attendAgain || null,
          recommend_score: recommendScore,
          recommend_reason: recommendReason || null,
          loneliness_change: lonelinessChange || null,
          community_feeling: communityFeeling || null,
          tokushima_impression_change: tokushimaImpressionChange || null,
          marriage_motivation_change: marriageMotivationChange || null,
          best_moment: bestMoment || null,
          improvement_suggestion: improvementSuggestion || null,
          free_comment: freeComment || null,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/app"), 2000);
    } catch (err) {
      console.error("[post-survey] submit failed:", err);
      alert("送信に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
        <p style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300 }}>アンケートを送信しました</p>
        <p style={{ fontSize: 11, color: "#666", marginTop: 12, letterSpacing: "0.15em" }}>ホームに戻ります...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 100 }}>
      <Header title="イベント後アンケート" onLeft={() => (step > 1 ? setStep(step - 1) : router.push("/app"))} />
      <div style={{ padding: "8px 24px 24px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 10, letterSpacing: "0.3em", color: gold, marginBottom: 8 }}>STEP {step} / {STEPS}</p>
        <div style={{ height: 4, background: faintLine2, marginBottom: 32, borderRadius: 2 }}>
          <div style={{ width: `${(step / STEPS) * 100}%`, height: "100%", background: gold, borderRadius: 2, transition: "width 0.4s" }} />
        </div>

        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300, marginBottom: 24 }}>イベント後の自己評価</h2>
            <div style={{ marginBottom: 24 }}><FormLabel>自己肯定感（1〜10）イベント前と比べて</FormLabel><SliderInput subLeft="低い" subRight="高い" value={postEsteem} onChange={setPostEsteem} max={10} /></div>
            <div style={{ marginBottom: 24 }}><FormLabel>異性への抵抗感（1〜10）</FormLabel><SliderInput subLeft="全くない" subRight="かなりある" value={postResistance} onChange={setPostResistance} max={10} /></div>
            <FormLabel>心理的ハードルの変化</FormLabel>
            <ChipGroup options={BARRIER_OPTIONS} value={postBarrierChange} onChange={(v) => setPostBarrierChange(Array.isArray(v) ? "" : v)} accent small />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300, marginBottom: 24 }}>イベントの満足度</h2>
            <div style={{ marginBottom: 20 }}>
              <FormLabel>全体の満足度（1〜5）</FormLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSatisfaction(n)}
                    style={{
                      width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${n <= satisfaction ? gold : "rgba(255,255,255,0.12)"}`,
                      background: n <= satisfaction ? gold : "transparent",
                      color: n <= satisfaction ? "#000" : "rgba(255,255,255,0.3)",
                      fontFamily: "'Cormorant Garamond', serif", fontSize: 14, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <FormLabel>楽しかった度（1〜5）</FormLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setFunScore(n)} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${n <= funScore ? gold : "rgba(255,255,255,0.12)"}`, background: n <= funScore ? gold : "transparent", color: n <= funScore ? "#000" : "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', serif", fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <FormLabel>居心地の良さ（1〜5）</FormLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setComfortScore(n)} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${n <= comfortScore ? gold : "rgba(255,255,255,0.12)"}`, background: n <= comfortScore ? gold : "transparent", color: n <= comfortScore ? "#000" : "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', serif", fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <FormLabel>運営・進行のわかりやすさ（1〜5）</FormLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setOrganizationScore(n)} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${n <= organizationScore ? gold : "rgba(255,255,255,0.12)"}`, background: n <= organizationScore ? gold : "transparent", color: n <= organizationScore ? "#000" : "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', serif", fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300, marginBottom: 24 }}>気づき・成長</h2>
            <div style={{ marginBottom: 20 }}><FormLabel>自己発見（任意）</FormLabel><FormInput value={selfDiscovery} onChange={setSelfDiscovery} placeholder="イベントを通して気づいたこと" /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>自信の変化（任意）</FormLabel><FormInput value={confidenceChange} onChange={setConfidenceChange} placeholder="自信についての変化" /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>コミュニケーションの成長（任意）</FormLabel><FormInput value={communicationGrowth} onChange={setCommunicationGrowth} placeholder="話すことへの変化" /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>孤独感の変化（任意）</FormLabel><FormInput value={lonelinessChange} onChange={setLonelinessChange} placeholder="孤独感について" /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>コミュニティへの感じ方（任意）</FormLabel><FormInput value={communityFeeling} onChange={setCommunityFeeling} placeholder="地域や仲間への意識" /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>徳島への印象の変化（任意）</FormLabel><FormInput value={tokushimaImpressionChange} onChange={setTokushimaImpressionChange} placeholder="徳島の印象について" /></div>
            <div><FormLabel>結婚意欲の変化（任意）</FormLabel><FormInput value={marriageMotivationChange} onChange={setMarriageMotivationChange} placeholder="結婚への気持ちの変化" /></div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 18, fontWeight: 300, marginBottom: 24 }}>総合</h2>
            <div style={{ marginBottom: 20 }}><FormLabel>また参加したいですか</FormLabel><ChipGroup options={ATTEND_OPTIONS} value={attendAgain} onChange={(v) => setAttendAgain(Array.isArray(v) ? "" : v)} accent small /></div>
            <div style={{ marginBottom: 20 }}>
              <FormLabel>友人にすすめたい度（1〜5）</FormLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRecommendScore(n)} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${n <= recommendScore ? gold : "rgba(255,255,255,0.12)"}`, background: n <= recommendScore ? gold : "transparent", color: n <= recommendScore ? "#000" : "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', serif", fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}><FormLabel>おすすめする理由（任意）</FormLabel><FormInput value={recommendReason} onChange={setRecommendReason} placeholder="なぜすすめたいか" /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>一番良かった瞬間（任意）</FormLabel><FormInput value={bestMoment} onChange={setBestMoment} placeholder="印象に残った場面" /></div>
            <div style={{ marginBottom: 20 }}><FormLabel>改善の提案（任意）</FormLabel><FormInput value={improvementSuggestion} onChange={setImprovementSuggestion} placeholder="より良くするために" /></div>
            <div><FormLabel>自由コメント（任意）</FormLabel><FormInput value={freeComment} onChange={setFreeComment} placeholder="その他伝えたいこと" /></div>
          </div>
        )}

        <div style={{ marginTop: 40 }}>
          {step < STEPS ? (
            <BtnPrimary onClick={() => setStep(step + 1)}>次へ</BtnPrimary>
          ) : (
            <BtnPrimary onClick={handleSubmit} disabled={submitting}>{submitting ? "送信中..." : "送信する"}</BtnPrimary>
          )}
        </div>
      </div>
    </div>
  );
}
