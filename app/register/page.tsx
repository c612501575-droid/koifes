"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addUser, load, getKoifesUserByAuthId, type KoifesUser } from "@/app/lib/koifes-db";
import {
  AGES,
  JOBS,
  FAMILY,
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
  LEAVE_REASONS,
  STAY_CONDITIONS,
  HOUSING_CONDS,
  COMPANY_SUPPORT,
  goldBorder,
  uid,
  code4,
} from "@/app/lib/koifes-constants";
import {
  ChipGroup,
  SliderInput,
  FormLabel,
  FormInput,
  Header,
  Progress,
  InfoBox,
  Toast,
  RankingSelector,
} from "@/app/components/koifes/ui";
import { supabase } from "@/app/lib/supabase";

const TOTAL_STEPS = 5;
const INIT_FORM = {
  fullName: "",
  nickname: "",
  gender: "",
  age: "",
  ageNumber: "",
  height: "",
  job: "",
  family: "",
  siblings: "",
  livingWithFamily: "",
  income: "",
  marriage: "",
  marriageByWhen: "",
  children: "",
  childrenByWhen: "",
  hobbies: [] as string[],
  values: [] as string[],
  dealbreakers: [] as string[],
  eventExp: "",
  esteem: 5,
  resistance: 5,
  invest: "",
  weakness: "",
  strengths: [] as string[],
  selfImprovement: "",
  improvementConfidence: "",
  barrierChange: "",
  stayTokushima: "",
  leaveReason: "",
  leaveReasonsRanked: [] as string[],
  stayConditions: [] as string[],
  buyHouse: "",
  housingConditions: [] as string[],
  companySupport: "",
  unmarriedReasons: [] as string[],
};

const UNMARRIED_REASONS = [
  "そもそも出会いがない",
  "お金に余裕がない",
  "いい人がいない",
  "結婚したくてもできない",
  "仕事が忙しい",
  "自由でいたい",
  "その他",
];

const DEALBREAKER_OPTIONS = [
  "顔・見た目",
  "性格の相性",
  "価値観が合う",
  "一緒にいて楽",
  "経済力",
  "誠実さ",
  "共通の趣味",
  "フィーリング",
  "尊敬できる",
  "家族を大切にする",
  "将来のビジョン",
  "笑いのツボが同じ",
];

const STRENGTH_OPTIONS = [
  "明るい",
  "面白い",
  "優しい",
  "まじめ",
  "聞き上手",
  "よく笑う",
  "気配り上手",
  "ポジティブ",
  "行動力がある",
  "しっかり者",
  "ムードメーカー",
  "天然",
  "クール",
  "マイペース",
  "おとなしい",
  "素直",
  "包容力がある",
  "芯が強い",
  "社交的",
  "努力家",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [initCheck, setInitCheck] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const existing = await getKoifesUserByAuthId(user.id);
        if (existing) {
          router.replace("/app");
          return;
        }
      }
      if (process.env.NEXT_PUBLIC_DEV_BYPASS_4DIGIT === "1") {
        const res = await fetch("/api/dev-me", { credentials: "include", cache: "no-store" });
        const d = await res.json().catch(() => ({}));
        if (d.ok && d.user) {
          router.replace("/app");
          return;
        }
      }
      setInitCheck(false);
    })();
  }, [router]);
  const [form, setForm] = useState(INIT_FORM);
  const [agreed, setAgreed] = useState(false);
  const [agreedWarn, setAgreedWarn] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [saving, setSaving] = useState(false);
  const [completedCode, setCompletedCode] = useState<string | null>(null);
  const agreedRef = useRef<HTMLDivElement | null>(null);
  const set = (k: keyof typeof form, v: string | number | string[]) =>
    setForm((p) => ({ ...p, [k]: v }));
  const isTeen = form.age === "10代";

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (step > 0 && !completedCode) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step, completedCode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const validate = () => {
    if (step === 0 && (!form.fullName || !form.nickname || !form.gender || !form.age || !form.ageNumber || !form.job || !form.family || !agreed))
      return false;
    if (step === 1) {
      if (!form.marriage || !form.children) return false;
      if (form.dealbreakers.length !== 3) return false;
      const marriageWants = ["強く望んでいる", "できればしたい"];
      const marriageNoReasons = ["あまり考えていない", "結婚したくない"];
      const childrenWants = ["欲しい"];
      if (marriageWants.includes(form.marriage) && !form.marriageByWhen) return false;
      if (marriageNoReasons.includes(form.marriage) && (!form.unmarriedReasons || form.unmarriedReasons.length === 0)) return false;
      if (childrenWants.includes(form.children) && !form.childrenByWhen) return false;
    }
    if (step === 3 && !form.selfImprovement) return false;
    if (step === 4) {
      if (!form.stayTokushima) return false;
      if (form.leaveReasonsRanked.length > 0 && form.leaveReasonsRanked.length !== 3) return false;
    }
    return true;
  };

  const handleComplete = async () => {
    if (saving) return;
    setToast({ msg: "", show: false });
    setSaving(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      setToast({ msg: "セッションが切れました。ログイン画面から再度お試しください", show: true });
      setSaving(false);
      return;
    }

    let code = "";
    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      const candidate = code4();
      try {
        const res = await fetch(`/api/check-code?code=${encodeURIComponent(candidate)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({ taken: true }));
        if (!data.taken) {
          code = candidate;
          break;
        }
      } catch {
        code = candidate;
        break;
      }
      if (i === maxRetries - 1) {
        setToast({ msg: "コードの生成に失敗しました。しばらく待ってから再度お試しください", show: true });
        setTimeout(() => setToast({ msg: "", show: false }), 3000);
        setSaving(false);
        return;
      }
    }

    const newUser: KoifesUser = {
      id: authUser.id,
      code: code || code4(),
      email: authUser.email ?? undefined,
      fullName: form.fullName,
      nickname: form.nickname,
      gender: form.gender,
      age: form.age,
      ageNumber: form.ageNumber ? parseInt(form.ageNumber, 10) : undefined,
      height: form.height,
      job: form.job,
      family: form.family,
      siblings: form.siblings,
      livingWithFamily: form.livingWithFamily,
      income: form.income,
      marriage: form.marriage,
      marriageByWhen: form.marriageByWhen || undefined,
      children: form.children,
      childrenByWhen: form.childrenByWhen || undefined,
      hobbies: form.hobbies,
      values: form.values,
      dealbreakers: form.dealbreakers,
      eventExp: form.eventExp,
      esteem: form.esteem,
      resistance: form.resistance,
      invest: form.invest,
      weakness: undefined,
      personality: form.strengths.join(","),
      selfImprovement: form.selfImprovement,
      improvementConfidence: form.improvementConfidence,
      barrierChange: form.barrierChange,
      stayTokushima: form.stayTokushima,
      leaveReason: form.leaveReasonsRanked.length > 0 ? form.leaveReasonsRanked.join("|") : form.leaveReason || undefined,
      stayConditions: form.stayConditions,
      buyHouse: form.buyHouse,
      housingConditions: form.housingConditions,
      companySupport: form.companySupport,
      unmarriedReasons: form.unmarriedReasons,
      createdAt: new Date().toISOString(),
    };
    try {
      const newId = await addUser(newUser);
      console.log("[register] Supabase への保存成功, id:", newId);

      // 保存確認：読み直してユーザーが存在するか確認
      const saved = await getKoifesUserByAuthId(authUser.id);
      if (!saved) {
        console.warn("[register] 保存後の確認でユーザーが見つかりません。少し待ってからリダイレクトします。");
        await new Promise((r) => setTimeout(r, 500));
      }

      console.log("[register] 完了画面を5秒表示");
      setCompletedCode(newUser.code);
      setTimeout(() => {
        router.push("/app");
        router.refresh();
      }, 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存に失敗しました。もう一度お試しください";
      setToast({ msg: message, show: true });
      setTimeout(() => setToast({ msg: "", show: false }), 3000);
      console.error("[register] 登録エラー:", err);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 1
    <div key={0}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 01</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 12 }}>基本情報を<br />入力してください</h2>
      <p style={{ fontSize: 11, color: "#666", marginBottom: 32, letterSpacing: "0.05em" }}>全5ステップ・約3分で完了します</p>
      <div
        ref={agreedRef}
        style={{
          marginBottom: 24,
          background: agreed ? "rgba(236,72,153,0.08)" : "rgba(236,72,153,0.05)",
          border: agreed ? "2px solid rgba(236,72,153,0.4)" : "2px solid rgba(239,68,68,0.6)",
          borderRadius: 12,
          padding: 20,
          transition: "all 0.3s",
          boxShadow: agreedWarn ? "0 0 0 4px rgba(239,68,68,0.3)" : "none",
        }}
      >
        <label style={{ display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setAgreedWarn(false);
            }}
            style={{ width: 24, height: 24, marginTop: 2, accentColor: "#ec4899", flexShrink: 0 }}
          />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: agreed ? "#ec4899" : "#fff", margin: "0 0 8px" }}>
              上記に同意して始める
            </p>
            <p style={{ fontSize: 12, color: "#999", lineHeight: 1.9, margin: 0 }}>
              入力いただいた情報は、イベント中のプロフィール交換および匿名統計データとして地域づくりに活用されます。イベント終了後、個人を特定できる情報は適切に管理されます。連絡先情報は相互に希望した方同士の仲介にのみ使用します。
            </p>
            {agreedWarn && (
              <p style={{ fontSize: 12, color: "#f87171", marginTop: 10, fontWeight: 600 }}>
                同意にチェックしてください
              </p>
            )}
          </div>
        </label>
      </div>
      <div style={{ marginBottom: 32 }}><FormLabel required>フルネーム</FormLabel><FormInput value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="例：山田 太郎" maxLength={30} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>ニックネーム</FormLabel><FormInput value={form.nickname} onChange={(v) => set("nickname", v)} placeholder="例：さくら" maxLength={10} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>性別</FormLabel><ChipGroup options={["男性", "女性"]} value={form.gender} onChange={(v) => set("gender", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>年齢（年代）</FormLabel><ChipGroup options={AGES} value={form.age} onChange={(v) => set("age", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>年齢（具体的な数値）</FormLabel><FormInput value={form.ageNumber} onChange={(v) => set("ageNumber", v)} placeholder="年齢を入力" type="number" min={18} max={100} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>身長 (cm)</FormLabel><FormInput value={form.height} onChange={(v) => set("height", v)} placeholder="165" type="number" /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>職業</FormLabel><ChipGroup options={JOBS} value={form.job} onChange={(v) => set("job", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>家族構成</FormLabel><ChipGroup options={FAMILY} value={form.family} onChange={(v) => set("family", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>家族の有無（同居）</FormLabel><ChipGroup options={LIVING_WITH_FAMILY} value={form.livingWithFamily} onChange={(v) => set("livingWithFamily", v as string)} small /></div>
    </div>,
    // Step 2
    <div key={1}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 02</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 32 }}>価値観・希望を<br />教えてください</h2>
      <div style={{ marginBottom: 32 }}><FormLabel>年収帯</FormLabel><ChipGroup options={INCOME} value={form.income} onChange={(v) => set("income", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>結婚への希望</FormLabel><ChipGroup options={MARRIAGE} value={form.marriage} onChange={(v) => set("marriage", v as string)} accent small /></div>
      {["強く望んでいる", "できればしたい"].includes(form.marriage) && (
        <div style={{ marginBottom: 32, marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid rgba(200,169,110,0.3)" }}><FormLabel required>いつまでに？</FormLabel><ChipGroup options={MARRIAGE_BY_WHEN} value={form.marriageByWhen} onChange={(v) => set("marriageByWhen", v as string)} accent small /></div>
      )}
      {["あまり考えていない", "結婚したくない"].includes(form.marriage) && (
        <div style={{ marginBottom: 32 }}>
          <FormLabel required>結婚に至っていない理由は？（複数選択可）</FormLabel>
          <ChipGroup options={UNMARRIED_REASONS} value={form.unmarriedReasons} onChange={(v) => set("unmarriedReasons", v as string[])} multi small />
        </div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel required>子供の希望</FormLabel><ChipGroup options={CHILDREN} value={form.children} onChange={(v) => set("children", v as string)} accent small /></div>
      {form.children === "欲しい" && (
        <div style={{ marginBottom: 32, marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid rgba(200,169,110,0.3)" }}><FormLabel required>いつまでに？</FormLabel><ChipGroup options={CHILDREN_BY_WHEN} value={form.childrenByWhen} onChange={(v) => set("childrenByWhen", v as string)} accent small /></div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel>趣味（複数選択可）</FormLabel><ChipGroup options={HOBBIES} value={form.hobbies} onChange={(v) => set("hobbies", v as string[])} multi small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>大事にしている価値観（複数可）</FormLabel><ChipGroup options={VALUES} value={form.values} onChange={(v) => set("values", v as string[])} multi small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>イベント参加経験</FormLabel><ChipGroup options={EVENT_EXP} value={form.eventExp} onChange={(v) => set("eventExp", v as string)} small /></div>
      <RankingSelector
        title="付き合うときの決め手は？（上位3つを選んで順位をつけてください）"
        options={DEALBREAKER_OPTIONS}
        value={form.dealbreakers}
        onChange={(v) => set("dealbreakers", v)}
        maxRank={3}
        required
      />
    </div>,
    // Step 3
    <div key={2}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 03</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 32 }}>自己スコアを<br />入力してください</h2>
      <div style={{ marginBottom: 32 }}><FormLabel>自己肯定感スコア</FormLabel><SliderInput subLeft="低い" subRight="高い" value={form.esteem} onChange={(v) => set("esteem", v)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>異性への抵抗感</FormLabel><SliderInput subLeft="全くない" subRight="かなりある" value={form.resistance} onChange={(v) => set("resistance", v)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>自己投資額（月）</FormLabel><ChipGroup options={INVEST} value={form.invest} onChange={(v) => set("invest", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>自分の長所（複数選択可）</FormLabel><ChipGroup options={STRENGTH_OPTIONS} value={form.strengths} onChange={(v) => set("strengths", v as string[])} multi small /></div>
    </div>,
    // Step 4
    <div key={3}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 04</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 32 }}>自分磨きと<br />意識の変化について</h2>
      <InfoBox>⚠ このデータは徳島市の少子化対策に匿名統計として活用されます</InfoBox>
      <div style={{ marginBottom: 32 }}><FormLabel required>本日のイベントに向けて「自分磨き」を行いましたか？</FormLabel><p style={{ fontSize: 11, color: "#666", marginBottom: 12 }}>美容院・ジム・服の新調・スキンケアなど</p><ChipGroup options={["はい", "いいえ"]} value={form.selfImprovement} onChange={(v) => set("selfImprovement", v as string)} /></div>
      {form.selfImprovement === "はい" && (
        <div style={{ marginBottom: 32 }}>
          <FormLabel>外見を変えたことで、自分に自信が持てましたか？</FormLabel>
          <SliderInput subLeft="全く持てなかった" subRight="とても持てた" value={form.improvementConfidence ? parseInt(String(form.improvementConfidence).replace(/\D/g, "") || "3", 10) : 3} onChange={(v) => set("improvementConfidence", String(v))} max={5} />
        </div>
      )}
      <div style={{ marginBottom: 32 }}>
        <FormLabel>異性と話すことへの心理的ハードルは変化しましたか？</FormLabel>
        <SliderInput subLeft="かなり下がった" subRight="かなり上がった" value={["かなり下がった", "少し下がった", "変わらない", "少し上がった", "かなり上がった"].indexOf(form.barrierChange) + 1 || 3} onChange={(v) => set("barrierChange", ["かなり下がった", "少し下がった", "変わらない", "少し上がった", "かなり上がった"][v - 1] || "")} max={5} />
      </div>
    </div>,
    // Step 5
    <div key={4}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 05</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 32 }}>徳島での生活と<br />将来について</h2>
      <div style={{ marginBottom: 32 }}><FormLabel required>良いパートナーがいれば、今後も徳島に住み続けたいですか？</FormLabel><ChipGroup options={["ぜひ住みたい", "条件次第で", "どちらとも", "県外に出たい"]} value={form.stayTokushima} onChange={(v) => set("stayTokushima", v as string)} accent /></div>
      <RankingSelector
        title="県外へ出たい（出た）最大の理由（上位3つを選んで順位をつけてください・任意）"
        options={LEAVE_REASONS}
        value={form.leaveReasonsRanked}
        onChange={(v) => set("leaveReasonsRanked", v)}
        maxRank={3}
      />
      {isTeen && (
        <div style={{ marginBottom: 32, background: "rgba(200,169,110,0.05)", border: `1px solid ${goldBorder}`, padding: 20 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.15em", color: "#c8a96e", marginBottom: 12 }}>10代の方への質問</p>
          <FormLabel>徳島に「これがあれば残る」という要素は？（複数可）</FormLabel>
          <ChipGroup options={STAY_CONDITIONS} value={form.stayConditions} onChange={(v) => set("stayConditions", v as string[])} multi accent small />
        </div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel>将来、結婚した際に徳島で家を購入したいですか？</FormLabel><ChipGroup options={["ぜひしたい", "条件が合えば", "あまり考えていない", "購入しない"]} value={form.buyHouse} onChange={(v) => set("buyHouse", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>結婚・出産後に必要な「住居の条件」は？（複数可）</FormLabel><ChipGroup options={HOUSING_CONDS} value={form.housingConditions} onChange={(v) => set("housingConditions", v as string[])} multi /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>会社が「美容や出会い」を支援してくれるなら、その会社への愛着や定住意向は上がりますか？</FormLabel><ChipGroup options={COMPANY_SUPPORT} value={form.companySupport} onChange={(v) => set("companySupport", v as string)} /></div>
    </div>,
  ];

  if (initCheck) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 12 }}>
        読み込み中...
      </div>
    );
  }

  if (completedCode) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: "#fff" }}>
        <div
          style={{
            width: 72,
            height: 72,
            border: "2px solid #c8a96e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "checkPop 0.5s ease",
            marginBottom: 24,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2.5">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, marginBottom: 32 }}>
          プロフィールが完成しました
        </p>
        <div
          style={{
            background: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.2)",
            padding: "28px 48px",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 12, letterSpacing: "0.3em", color: "#999", marginBottom: 12 }}>あなたのコード</p>
          <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 42, letterSpacing: "0.35em", color: "#c8a96e", fontWeight: 500 }}>
            {completedCode}
          </p>
        </div>
        <p style={{ fontSize: 11, color: "#666", marginBottom: 24, textAlign: "center" }}>
          このコードは再ログインに使います<br />スクリーンショットを撮っておくと安心です
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#444",
            marginBottom: 20,
            animation: "fadeIn 0.6s ease 1.5s both",
          }}
        >
          5秒後にアプリに移動します
        </p>
        <button
          onClick={() => {
            router.push("/app");
            router.refresh();
          }}
          style={{
            width: "100%",
            maxWidth: 280,
            padding: 14,
            background: "rgba(200,169,110,0.15)",
            border: "1px solid rgba(200,169,110,0.4)",
            color: "#c8a96e",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.15em",
            cursor: "pointer",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          アプリに移動する
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", color: "#fff" }}>
      <Header
        title="Registration"
        onLeft={step > 0 ? () => setStep((s) => s - 1) : () => router.push("/login")}
        right={<span style={{ fontSize: 11, letterSpacing: "0.2em", color: "#666" }}>{step + 1} / {TOTAL_STEPS}</span>}
      />
      <Progress step={step + 1} total={TOTAL_STEPS} />
      <div style={{ flex: 1, padding: "32px 24px 40px", maxWidth: 480, margin: "0 auto", width: "100%", overflowY: "auto" }}>{steps[step]}</div>
      <div style={{ position: "sticky", bottom: 0, background: "linear-gradient(to top, #000 60%, transparent)", padding: "32px 24px 36px", flexShrink: 0 }}>
        <div
          onClick={() => {
            if (step === 0 && !agreed) {
              setAgreedWarn(true);
              agreedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setAgreedWarn(false), 2500);
            }
          }}
        >
          <button
            onClick={() => {
              if (!validate()) return;
              step < TOTAL_STEPS - 1 ? setStep((s) => s + 1) : handleComplete();
            }}
            disabled={!validate() || saving}
            style={{
              width: "100%",
              background: !validate() || saving ? "#222" : "#ec4899",
              color: !validate() || saving ? "#555" : "#fff",
              border: !validate() || saving ? "1px solid #333" : "none",
              fontFamily: "'Noto Sans JP', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.3em",
              padding: 18,
              cursor: !validate() || saving ? "not-allowed" : "pointer",
              transition: "all 0.3s",
            }}
          >
            {step < TOTAL_STEPS - 1 ? "次へ進む →" : saving ? "保存中..." : "プロフィールを完成させる"}
          </button>
        </div>
      </div>
      <Toast msg={toast.msg} show={toast.show} variant="error" />
    </div>
  );
}

