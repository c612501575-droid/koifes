"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addUser, load, saveSession, type KoifesUser } from "@/app/lib/koifes-db";
import {
  AGES,
  AGE_NUMBERS,
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
  BtnPrimary,
  InfoBox,
} from "@/app/components/koifes/ui";

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
  eventExp: "",
  esteem: 5,
  resistance: 5,
  invest: "",
  weakness: "",
  personality: "",
  selfImprovement: "",
  improvementConfidence: "",
  barrierChange: "",
  stayTokushima: "",
  leaveReason: "",
  stayConditions: [] as string[],
  buyHouse: "",
  housingConditions: [] as string[],
  companySupport: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INIT_FORM);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completedCode, setCompletedCode] = useState<string | null>(null);
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
      const marriageWants = ["強く望んでいる", "できればしたい"];
      const childrenWants = ["欲しい"];
      if (marriageWants.includes(form.marriage) && !form.marriageByWhen) return false;
      if (childrenWants.includes(form.children) && !form.childrenByWhen) return false;
    }
    if (step === 3 && !form.selfImprovement) return false;
    if (step === 4 && !form.stayTokushima) return false;
    return true;
  };

  const handleComplete = async () => {
    setError(null);
    setSaving(true);
    const newUser: KoifesUser = {
      id: uid(),
      code: code4(),
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
      eventExp: form.eventExp,
      esteem: form.esteem,
      resistance: form.resistance,
      invest: form.invest,
      weakness: form.weakness,
      personality: form.personality,
      selfImprovement: form.selfImprovement,
      improvementConfidence: form.improvementConfidence,
      barrierChange: form.barrierChange,
      stayTokushima: form.stayTokushima,
      leaveReason: form.leaveReason,
      stayConditions: form.stayConditions,
      buyHouse: form.buyHouse,
      housingConditions: form.housingConditions,
      companySupport: form.companySupport,
      createdAt: new Date().toISOString(),
    };
    try {
      const newId = await addUser(newUser);
      console.log("[register] Supabase への保存成功, id:", newId);

      // 保存確認：読み直してユーザーが存在するか確認
      const db = await load();
      const saved = db.users.find((u) => u.id === newId);
      if (!saved) {
        console.warn("[register] 保存後の確認でユーザーが見つかりません。少し待ってからリダイレクトします。");
        await new Promise((r) => setTimeout(r, 500));
      }

      saveSession(newId);
      console.log("[register] セッション保存完了, 完了画面を3秒表示");
      setCompletedCode(newUser.code);
      setTimeout(() => {
        router.push("/app");
        router.refresh();
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "登録に失敗しました";
      setError(message);
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
      <div style={{ marginBottom: 32, background: "rgba(200,169,110,0.06)", border: "1px solid rgba(200,169,110,0.15)", borderRadius: 8, padding: 16 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: 4, accentColor: "#c8a96e" }}
          />
          <span style={{ fontSize: 12, color: "#999", lineHeight: 1.8 }}>
            入力いただいた情報は、イベント中のプロフィール交換および匿名統計データとして地域づくりに活用されます。イベント終了後、個人を特定できる情報は適切に管理されます。
          </span>
        </label>
      </div>
      <div style={{ marginBottom: 32 }}><FormLabel required>フルネーム</FormLabel><FormInput value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="例：山田 太郎" maxLength={30} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>ニックネーム</FormLabel><FormInput value={form.nickname} onChange={(v) => set("nickname", v)} placeholder="例：さくら" maxLength={10} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>性別</FormLabel><ChipGroup options={["男性", "女性"]} value={form.gender} onChange={(v) => set("gender", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>年齢（年代）</FormLabel><ChipGroup options={AGES} value={form.age} onChange={(v) => set("age", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>年齢（具体的な数値）</FormLabel><ChipGroup options={AGE_NUMBERS} value={form.ageNumber} onChange={(v) => set("ageNumber", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>身長 (cm)</FormLabel><FormInput value={form.height} onChange={(v) => set("height", v)} placeholder="165" type="number" /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>職業</FormLabel><ChipGroup options={JOBS} value={form.job} onChange={(v) => set("job", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>家族構成</FormLabel><ChipGroup options={FAMILY} value={form.family} onChange={(v) => set("family", v as string)} small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>兄弟構成</FormLabel><ChipGroup options={SIBLINGS} value={form.siblings} onChange={(v) => set("siblings", v as string)} small /></div>
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
      <div style={{ marginBottom: 32 }}><FormLabel required>子供の希望</FormLabel><ChipGroup options={CHILDREN} value={form.children} onChange={(v) => set("children", v as string)} accent small /></div>
      {form.children === "欲しい" && (
        <div style={{ marginBottom: 32, marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid rgba(200,169,110,0.3)" }}><FormLabel required>いつまでに？</FormLabel><ChipGroup options={CHILDREN_BY_WHEN} value={form.childrenByWhen} onChange={(v) => set("childrenByWhen", v as string)} accent small /></div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel>趣味（複数選択可）</FormLabel><ChipGroup options={HOBBIES} value={form.hobbies} onChange={(v) => set("hobbies", v as string[])} multi small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>大事にしている価値観（複数可）</FormLabel><ChipGroup options={VALUES} value={form.values} onChange={(v) => set("values", v as string[])} multi small /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>イベント参加経験</FormLabel><ChipGroup options={EVENT_EXP} value={form.eventExp} onChange={(v) => set("eventExp", v as string)} small /></div>
    </div>,
    // Step 3
    <div key={2}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 03</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 32 }}>自己スコアを<br />入力してください</h2>
      <div style={{ marginBottom: 32 }}><FormLabel>自己肯定感スコア</FormLabel><SliderInput subLeft="低い" subRight="高い" value={form.esteem} onChange={(v) => set("esteem", v)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>異性への抵抗感</FormLabel><SliderInput subLeft="全くない" subRight="かなりある" value={form.resistance} onChange={(v) => set("resistance", v)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>自己投資額（月）</FormLabel><ChipGroup options={INVEST} value={form.invest} onChange={(v) => set("invest", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>自分の短所</FormLabel><ChipGroup options={WEAKNESS} value={form.weakness} onChange={(v) => set("weakness", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>周りからどんな人と言われますか？</FormLabel><FormInput value={form.personality} onChange={(v) => set("personality", v)} placeholder="例：よく笑う、聞き上手" /></div>
    </div>,
    // Step 4
    <div key={3}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 04</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 32 }}>自分磨きと<br />意識の変化について</h2>
      <InfoBox>⚠ このデータは徳島市の少子化対策に匿名統計として活用されます</InfoBox>
      <div style={{ marginBottom: 32 }}><FormLabel required>本日のイベントに向けて「自分磨き」を行いましたか？</FormLabel><p style={{ fontSize: 11, color: "#666", marginBottom: 12 }}>美容院・ジム・服の新調・スキンケアなど</p><ChipGroup options={["はい", "いいえ"]} value={form.selfImprovement} onChange={(v) => set("selfImprovement", v as string)} /></div>
      {form.selfImprovement === "はい" && (
        <div style={{ marginBottom: 32 }}><FormLabel>外見を変えたことで、自分に自信が持てましたか？</FormLabel><ChipGroup options={CONFIDENCE_5} value={form.improvementConfidence} onChange={(v) => set("improvementConfidence", v as string)} /></div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel>異性と話すことへの心理的ハードルは変化しましたか？</FormLabel><ChipGroup options={BARRIER_CHANGE} value={form.barrierChange} onChange={(v) => set("barrierChange", v as string)} /></div>
    </div>,
    // Step 5
    <div key={4}>
      <p style={{ fontSize: 11, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 05</p>
      <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.6, marginBottom: 32 }}>徳島での生活と<br />将来について</h2>
      <div style={{ marginBottom: 32 }}><FormLabel required>良いパートナーがいれば、今後も徳島に住み続けたいですか？</FormLabel><ChipGroup options={["ぜひ住みたい", "条件次第で", "どちらとも", "県外に出たい"]} value={form.stayTokushima} onChange={(v) => set("stayTokushima", v as string)} accent /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>県外へ出たい（出た）最大の理由</FormLabel><ChipGroup options={LEAVE_REASONS} value={form.leaveReason} onChange={(v) => set("leaveReason", v as string)} /></div>
      {isTeen && (
        <div style={{ marginBottom: 32, background: "rgba(200,169,110,0.05)", border: `1px solid ${goldBorder}`, padding: 20 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", color: "#c8a96e", marginBottom: 12 }}>10代の方への質問</p>
          <FormLabel>徳島に「これがあれば残る」という要素は？（複数可）</FormLabel>
          <ChipGroup options={STAY_CONDITIONS} value={form.stayConditions} onChange={(v) => set("stayConditions", v as string[])} multi accent small />
        </div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel>将来、結婚した際に徳島で家を購入したいですか？</FormLabel><ChipGroup options={["ぜひしたい", "条件が合えば", "あまり考えていない", "購入しない"]} value={form.buyHouse} onChange={(v) => set("buyHouse", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>結婚・出産後に必要な「住居の条件」は？（複数可）</FormLabel><ChipGroup options={HOUSING_CONDS} value={form.housingConditions} onChange={(v) => set("housingConditions", v as string[])} multi /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>会社が「美容や出会い」を支援してくれるなら、その会社への愛着や定住意向は上がりますか？</FormLabel><ChipGroup options={COMPANY_SUPPORT} value={form.companySupport} onChange={(v) => set("companySupport", v as string)} /></div>
    </div>,
  ];

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
          <p style={{ fontSize: 10, letterSpacing: "0.3em", color: "#999", marginBottom: 12 }}>あなたのコード</p>
          <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 42, letterSpacing: "0.35em", color: "#c8a96e", fontWeight: 500 }}>
            {completedCode}
          </p>
        </div>
        <p style={{ fontSize: 11, color: "#666", marginBottom: 24, textAlign: "center" }}>
          このコードは再ログインに使います<br />スクリーンショットを撮っておくと安心です
        </p>
        <p
          style={{
            fontSize: 10,
            color: "#444",
            animation: "fadeIn 0.6s ease 1.5s both",
          }}
        >
          まもなくアプリに移動します...
        </p>
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
        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: "rgba(220,38,38,0.2)", border: "1px solid #dc2626", color: "#fca5a5", fontSize: 12 }}>
            {error}
          </div>
        )}
        <BtnPrimary
          onClick={() => {
            if (!validate()) return;
            step < TOTAL_STEPS - 1 ? setStep((s) => s + 1) : handleComplete();
          }}
          disabled={!validate() || saving}
        >
          {step < TOTAL_STEPS - 1 ? "次へ進む →" : saving ? "保存中..." : "プロフィールを完成させる"}
        </BtnPrimary>
      </div>
    </div>
  );
}

