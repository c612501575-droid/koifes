"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addUser, load, saveSession, type KoifesUser } from "@/app/lib/koifes-db";
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
  nickname: "",
  gender: "",
  age: "",
  height: "",
  job: "",
  family: "",
  income: "",
  marriage: "",
  children: "",
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string | number | string[]) =>
    setForm((p) => ({ ...p, [k]: v }));
  const isTeen = form.age === "10代";

  const validate = () => {
    if (step === 0 && (!form.nickname || !form.gender || !form.age || !form.job || !form.family))
      return false;
    if (step === 1 && (!form.marriage || !form.children)) return false;
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
      nickname: form.nickname,
      gender: form.gender,
      age: form.age,
      height: form.height,
      job: form.job,
      family: form.family,
      income: form.income,
      marriage: form.marriage,
      children: form.children,
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
      await addUser(newUser);
      console.log("[register] Supabase への保存成功");

      // 保存確認：読み直してユーザーが存在するか確認
      const db = await load();
      const saved = db.users.find((u) => u.id === newUser.id);
      if (!saved) {
        console.warn("[register] 保存後の確認でユーザーが見つかりません。少し待ってからリダイレクトします。");
        await new Promise((r) => setTimeout(r, 500));
      }

      saveSession(newUser.id);
      console.log("[register] セッション保存完了, redirect to /app");
      router.push("/app?screen=card");
      router.refresh();
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
      <p style={{ fontSize: 10, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 01</p>
      <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 300, lineHeight: 1.6, marginBottom: 32 }}>基本情報を<br />入力してください</h2>
      <div style={{ marginBottom: 32 }}><FormLabel required>ニックネーム</FormLabel><FormInput value={form.nickname} onChange={(v) => set("nickname", v)} placeholder="例：さくら" maxLength={10} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>性別</FormLabel><ChipGroup options={["男性", "女性"]} value={form.gender} onChange={(v) => set("gender", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>年齢</FormLabel><ChipGroup options={AGES} value={form.age} onChange={(v) => set("age", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>身長 (cm)</FormLabel><FormInput value={form.height} onChange={(v) => set("height", v)} placeholder="165" type="number" /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>職業</FormLabel><ChipGroup options={JOBS} value={form.job} onChange={(v) => set("job", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>家族構成</FormLabel><ChipGroup options={FAMILY} value={form.family} onChange={(v) => set("family", v as string)} /></div>
    </div>,
    // Step 2
    <div key={1}>
      <p style={{ fontSize: 10, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 02</p>
      <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 300, lineHeight: 1.6, marginBottom: 32 }}>価値観・希望を<br />教えてください</h2>
      <div style={{ marginBottom: 32 }}><FormLabel>年収帯</FormLabel><ChipGroup options={INCOME} value={form.income} onChange={(v) => set("income", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>結婚への希望</FormLabel><ChipGroup options={MARRIAGE} value={form.marriage} onChange={(v) => set("marriage", v as string)} accent /></div>
      <div style={{ marginBottom: 32 }}><FormLabel required>子供の希望</FormLabel><ChipGroup options={CHILDREN} value={form.children} onChange={(v) => set("children", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>趣味（複数選択可）</FormLabel><ChipGroup options={HOBBIES} value={form.hobbies} onChange={(v) => set("hobbies", v as string[])} multi /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>大事にしている価値観（複数可）</FormLabel><ChipGroup options={VALUES} value={form.values} onChange={(v) => set("values", v as string[])} multi /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>イベント参加経験</FormLabel><ChipGroup options={EVENT_EXP} value={form.eventExp} onChange={(v) => set("eventExp", v as string)} /></div>
    </div>,
    // Step 3
    <div key={2}>
      <p style={{ fontSize: 10, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 03</p>
      <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 300, lineHeight: 1.6, marginBottom: 32 }}>自己スコアを<br />入力してください</h2>
      <div style={{ marginBottom: 32 }}><FormLabel>自己肯定感スコア</FormLabel><SliderInput subLeft="低い" subRight="高い" value={form.esteem} onChange={(v) => set("esteem", v)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>異性への抵抗感</FormLabel><SliderInput subLeft="全くない" subRight="かなりある" value={form.resistance} onChange={(v) => set("resistance", v)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>自己投資額（月）</FormLabel><ChipGroup options={INVEST} value={form.invest} onChange={(v) => set("invest", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>自分の短所</FormLabel><ChipGroup options={WEAKNESS} value={form.weakness} onChange={(v) => set("weakness", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>周りからどんな人と言われますか？</FormLabel><FormInput value={form.personality} onChange={(v) => set("personality", v)} placeholder="例：よく笑う、聞き上手" /></div>
    </div>,
    // Step 4
    <div key={3}>
      <p style={{ fontSize: 10, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 04</p>
      <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 300, lineHeight: 1.6, marginBottom: 32 }}>自分磨きと<br />意識の変化について</h2>
      <InfoBox>⚠ このデータは徳島市の少子化対策に匿名統計として活用されます</InfoBox>
      <div style={{ marginBottom: 32 }}><FormLabel required>本日のイベントに向けて「自分磨き」を行いましたか？</FormLabel><p style={{ fontSize: 10, color: "#666", marginBottom: 12 }}>美容院・ジム・服の新調・スキンケアなど</p><ChipGroup options={["はい", "いいえ"]} value={form.selfImprovement} onChange={(v) => set("selfImprovement", v as string)} /></div>
      {form.selfImprovement === "はい" && (
        <div style={{ marginBottom: 32 }}><FormLabel>外見を変えたことで、自分に自信が持てましたか？</FormLabel><ChipGroup options={CONFIDENCE_5} value={form.improvementConfidence} onChange={(v) => set("improvementConfidence", v as string)} /></div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel>異性と話すことへの心理的ハードルは変化しましたか？</FormLabel><ChipGroup options={BARRIER_CHANGE} value={form.barrierChange} onChange={(v) => set("barrierChange", v as string)} /></div>
    </div>,
    // Step 5
    <div key={4}>
      <p style={{ fontSize: 10, letterSpacing: "0.4em", color: "#c8a96e", marginBottom: 8 }}>STEP 05</p>
      <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, fontWeight: 300, lineHeight: 1.6, marginBottom: 32 }}>徳島での生活と<br />将来について</h2>
      <div style={{ marginBottom: 32 }}><FormLabel required>良いパートナーがいれば、今後も徳島に住み続けたいですか？</FormLabel><ChipGroup options={["ぜひ住みたい", "条件次第で", "どちらとも", "県外に出たい"]} value={form.stayTokushima} onChange={(v) => set("stayTokushima", v as string)} accent /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>県外へ出たい（出た）最大の理由</FormLabel><ChipGroup options={LEAVE_REASONS} value={form.leaveReason} onChange={(v) => set("leaveReason", v as string)} /></div>
      {isTeen && (
        <div style={{ marginBottom: 32, background: "rgba(200,169,110,0.05)", border: `1px solid ${goldBorder}`, padding: 20 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.15em", color: "#c8a96e", marginBottom: 12 }}>10代の方への質問</p>
          <FormLabel>徳島に「これがあれば残る」という要素は？（複数可）</FormLabel>
          <ChipGroup options={STAY_CONDITIONS} value={form.stayConditions} onChange={(v) => set("stayConditions", v as string[])} multi accent small />
        </div>
      )}
      <div style={{ marginBottom: 32 }}><FormLabel>将来、結婚した際に徳島で家を購入したいですか？</FormLabel><ChipGroup options={["ぜひしたい", "条件が合えば", "あまり考えていない", "購入しない"]} value={form.buyHouse} onChange={(v) => set("buyHouse", v as string)} /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>結婚・出産後に必要な「住居の条件」は？（複数可）</FormLabel><ChipGroup options={HOUSING_CONDS} value={form.housingConditions} onChange={(v) => set("housingConditions", v as string[])} multi /></div>
      <div style={{ marginBottom: 32 }}><FormLabel>会社が「美容や出会い」を支援してくれるなら、その会社への愛着や定住意向は上がりますか？</FormLabel><ChipGroup options={COMPANY_SUPPORT} value={form.companySupport} onChange={(v) => set("companySupport", v as string)} /></div>
    </div>,
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", color: "#fff" }}>
      <Header
        title="Registration"
        onLeft={step > 0 ? () => setStep((s) => s - 1) : () => router.push("/login")}
        right={<span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#666" }}>{step + 1} / {TOTAL_STEPS}</span>}
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
