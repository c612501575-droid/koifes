"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { load, loadSession } from "@/app/lib/koifes-db";
import { supabase } from "@/app/lib/supabase";
import { gold, faintLine2 } from "@/app/lib/koifes-constants";
import {
  Header,
  BtnPrimary,
  ChipGroup,
  FormLabel,
  SliderInput,
} from "@/app/components/koifes/ui";

const STEPS = 3;

export default function PostSurveyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
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
  const [feedbackText, setFeedbackText] = useState("");

  const INTERESTED_COUNT_OPTIONS = ["0人", "1〜2人", "3〜5人", "6人以上"];
  const WANT_GROWTH_OPTIONS = ["とても思った", "少し思った", "あまり思わなかった", "全く思わなかった"];
  const RESISTANCE_CHANGE_OPTIONS = ["かなり減った", "少し減った", "変わらない", "少し増えた"];
  const ATTEND_OPTIONS = ["ぜひ参加したい", "機会があれば", "あまり参加したくない"];
  const PERSONALITY_TAG_OPTIONS = ["明るい", "おとなしい", "面白い", "まじめ", "優しい", "クール", "天然", "しっかり者", "ムードメーカー", "マイペース"];

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
    if (step === 2) return !!interestedCount && !!wantGrowth && !!resistanceChange;
    if (step === 3) return !!attendAgain && personalityTags.length > 0 && !!wantOthersEvaluation;
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
          feedback_text: feedbackText || null,
          free_comment: feedbackText || null,
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
        <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 18, fontWeight: 400 }}>アンケートを送信しました</p>
        <p style={{ fontSize: 11, color: "#666", marginTop: 12, letterSpacing: "0.15em" }}>ホームに戻ります...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", paddingBottom: 100 }}>
      <Header title="イベント後アンケート" onLeft={() => (step > 1 ? setStep(step - 1) : router.push("/app"))} />
      <div style={{ padding: "8px 24px 24px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.3em", color: gold, marginBottom: 8 }}>STEP {step} / {STEPS}</p>
        <div style={{ height: 4, background: faintLine2, marginBottom: 32, borderRadius: 2 }}>
          <div style={{ width: `${(step / STEPS) * 100}%`, height: "100%", background: gold, borderRadius: 2, transition: "width 0.4s" }} />
        </div>

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
            <div style={{ marginBottom: 20 }}><FormLabel>あなたに対する他の参加者からの評価を知りたいですか？</FormLabel><ChipGroup options={["はい、知りたい", "いいえ、知りたくない"]} value={wantOthersEvaluation} onChange={(v) => setWantOthersEvaluation(Array.isArray(v) ? "" : v)} accent small /></div>
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
