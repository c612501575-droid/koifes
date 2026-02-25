export const AGES = ["10代", "20代前半", "20代後半", "30代前半", "30代後半", "40代以上"];
export const AGE_NUMBERS = Array.from({ length: 51 }, (_, i) => `${18 + i}`); // 18〜68歳
export const JOBS = ["会社員", "公務員", "医療・看護", "教育・教員", "IT・エンジニア", "美容師", "自営業", "学生", "フリーランス", "その他"];
export const FAMILY = ["長男・長女", "次男・次女以降", "一人っ子", "ひとり親家庭", "その他"];
export const SIBLINGS = ["長男", "長女", "次男", "次女", "三人目以降", "一人っ子"];
export const LIVING_WITH_FAMILY = ["実家暮らし", "一人暮らし", "ルームシェア", "その他"];
export const INCOME = ["〜200万", "200〜300万", "300〜400万", "400〜500万", "500〜600万", "600〜700万", "700〜800万", "800〜1000万", "1000万以上", "回答しない"];
export const MARRIAGE = ["強く望んでいる", "できればしたい", "縁があれば", "あまり考えていない", "結婚したくない"];
export const MARRIAGE_BY_WHEN = ["30歳まで", "35歳まで", "40歳まで", "5年以内", "10年以内", "時期は決めていない"];
export const CHILDREN = ["欲しい", "どちらでも", "欲しくない", "すでにいる"];
export const CHILDREN_BY_WHEN = ["結婚後すぐ", "30歳まで", "35歳まで", "40歳まで", "5年以内", "時期は決めていない"];
export const HOBBIES = ["アウトドア", "料理", "映画・ドラマ", "旅行", "スポーツ", "音楽", "読書", "ゲーム", "カフェ巡り", "ジム・筋トレ", "ペット", "写真", "ドライブ", "ショッピング", "お酒・グルメ", "アニメ・漫画", "DIY・ものづくり", "推し活", "ダンス", "釣り", "キャンプ", "サウナ・温泉", "美容・コスメ", "ボランティア", "食べ歩き", "YouTube・動画鑑賞"];
export const INVEST = ["ほぼなし", "〜1万円", "1〜3万円", "3〜5万円", "5万円以上"];
export const WEAKNESS = ["心配性", "飽きっぽい", "優柔不断", "人見知り", "完璧主義", "せっかち", "頑固", "マイペース", "頑張りすぎる", "素直すぎる", "甘えベタ", "嫉妬しやすい", "めんどくさがり"];
export const EVENT_EXP = ["初めて", "2〜3回", "4回以上"];
export const VALUES = ["家族", "仕事", "自由", "安定", "挑戦", "成長", "思いやり", "誠実さ", "楽しさ", "健康"];
export const CONFIDENCE_5 = ["1 — 全く持てなかった", "2", "3 — どちらとも", "4", "5 — とても持てた"];
export const BARRIER_CHANGE = ["かなり下がった", "少し下がった", "変わらない", "少し上がった", "かなり上がった"];
export const LEAVE_REASONS = ["出会いが少ない", "仕事・キャリア", "住環境", "娯楽・遊び場", "交通の便が悪い", "教育環境", "刺激が少ない", "買い物・商業施設"];
export const STAY_CONDITIONS = ["家賃補助", "若者コミュニティ", "出会いの場", "子育て支援", "交通の便", "商業施設"];
export const HOUSING_CONDS = ["広さ", "価格の安さ", "リノベ済み", "駅・学校の近さ", "実家との距離", "新築"];
export const COMPANY_SUPPORT = ["かなり上がる", "少し上がる", "変わらない", "あまり関係ない"];

export const gold = "#c8a96e";
export const goldFade = "rgba(200,169,110,0.12)";
export const goldBorder = "rgba(200,169,110,0.25)";
export const faintLine = "rgba(255,255,255,0.08)";
export const faintLine2 = "rgba(255,255,255,0.06)";

export const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
export const code4 = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};
