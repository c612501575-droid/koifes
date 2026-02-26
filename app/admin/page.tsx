"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gold } from "@/app/lib/koifes-constants";
import { Header } from "@/app/components/koifes/ui";

const faintLine = "rgba(255,255,255,0.08)";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [ratings, setRatings] = useState<Record<string, unknown>[]>([]);
  const [surveys, setSurveys] = useState<Record<string, unknown>[]>([]);
  const [favorites, setFavorites] = useState<Record<string, unknown>[]>([]);
  const [followups, setFollowups] = useState<Record<string, unknown>[]>([]);
  const [connections, setConnections] = useState<Record<string, unknown>[]>([]);
  const [contactExchanges, setContactExchanges] = useState<Record<string, unknown>[]>([]);
  const [aggregates, setAggregates] = useState<{
    avgRatingByUser?: Record<string, number>;
    wantReceivedByUser?: Record<string, number>;
    wantGivenByUser?: Record<string, number>;
    mutualCountByUser?: Record<string, number>;
    topPartnerTagsByUser?: Record<string, string[]>;
    mutualMatches?: Array<{ a: string; b: string; aScore?: number; bScore?: number; aReason?: string[]; bReason?: string[]; createdAt?: string }>;
    popularityRanking?: Record<string, { byReceived: Array<{ id: string; count: number }>; byAvgRating: Array<{ id: string; avg: number }> }>;
  }>({});
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin-auth", { credentials: "include", cache: "no-store" })
      .then((res) => {
        if (!res.ok) router.replace("/admin/login");
        else setAuthChecked(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const loadAll = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin-data", { credentials: "include", cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setUsers((data.users || []) as Record<string, unknown>[]);
        setRatings((data.ratings || []) as Record<string, unknown>[]);
        setSurveys((data.surveys || []) as Record<string, unknown>[]);
        setFavorites((data.favorites || []) as Record<string, unknown>[]);
        setFollowups((data.followups || []) as Record<string, unknown>[]);
        setConnections((data.connections || []) as Record<string, unknown>[]);
        setContactExchanges((data.contactExchanges || []) as Record<string, unknown>[]);
        setAggregates(data.aggregates || {});
      } catch {
        console.error("[admin] Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [authChecked]);

  if (!authChecked || loading) {
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

  const male = users.filter((u) => u.gender === "男性").length;
  const female = users.filter((u) => u.gender === "女性").length;
  const avgEsteem = users.length
    ? (users.reduce((a, u) => a + Number((u.esteem as number) || 0), 0) / users.length).toFixed(1)
    : "—";
  const avgRating = ratings.length
    ? (ratings.reduce((a, r) => a + Number((r.overall as number) || 0), 0) / ratings.length).toFixed(1)
    : "—";

  const tabs: Record<string, string> = {
    overview: "Overview",
    users: "参加者一覧",
    ratings: "評価データ",
    matching: "マッチング",
    surveys: "アンケート",
    followups: "連絡先交換",
    export: "エクスポート",
  };

  const ag = aggregates;
  const wantYes = ratings.filter((r) => r.want_exchange === true).length;
  const wantRate = ratings.length ? ((wantYes / ratings.length) * 100).toFixed(1) : "—";
  const mutualCount = ag.mutualMatches?.length ?? 0;

  const userById = new Map(users.map((u) => [String(u.id || ""), u]));
  const filteredUsers = users.filter((u) => {
    const nick = String(u.nickname || "");
    const fullName = String(u.full_name || "");
    const gender = String(u.gender || "");
    const matchSearch = !search || `${nick} ${fullName}`.toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === "all" || gender === genderFilter;
    return matchSearch && matchGender;
  });

  const tableWrapStyle: React.CSSProperties = {
    overflowX: "auto",
    border: `1px solid ${faintLine}`,
    background: "rgba(255,255,255,0.01)",
  };

  const thStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: "#0d0d0d",
    color: "#999",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: `1px solid ${faintLine}`,
    whiteSpace: "nowrap",
    zIndex: 1,
  };

  const tdStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#ddd",
    padding: "10px 12px",
    borderBottom: `1px solid rgba(255,255,255,0.04)`,
    whiteSpace: "nowrap",
    verticalAlign: "top",
  };

  const SC = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div style={{ border: `1px solid ${faintLine}`, padding: 16, marginBottom: 8 }}>
      {title && <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "#666", marginBottom: 16 }}>{title}</div>}
      {children}
    </div>
  );

  const toCell = (v: unknown) => {
    if (Array.isArray(v)) return v.join(" / ");
    if (typeof v === "boolean") return v ? "はい" : "いいえ";
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  };

  const formatDate = (v: unknown) => {
    if (!v) return "—";
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const csvString = (data: Record<string, unknown>[], canonicalHeaders?: string[]) => {
    const headers = canonicalHeaders && canonicalHeaders.length
      ? canonicalHeaders
      : data.length
        ? Object.keys(data[0])
        : [];
    if (!headers.length) return "";
    const row = (r: Record<string, unknown>) =>
      headers
        .map((h) => {
          const val = r[h];
          const str = Array.isArray(val) ? val.join(";") : String(val ?? "");
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    return [headers.join(","), ...data.map(row)].join("\n");
  };

  const CSV_HEADERS: Record<string, string[]> = {
    koifes_users: ["id", "code", "email", "full_name", "nickname", "gender", "age", "age_number", "height", "siblings", "living_with_family", "job", "family", "income", "marriage", "marriage_by_when", "children", "children_by_when", "hobbies", "values", "dealbreakers", "unmarried_reasons", "event_exp", "esteem", "resistance", "invest", "weakness", "personality", "self_improvement", "improvement_confidence", "barrier_change", "stay_tokushima", "leave_reason", "stay_conditions", "buy_house", "housing_conditions", "company_support", "created_at"],
    koifes_ratings: ["id", "from_user_id", "to_user_id", "impression", "ease", "again", "overall", "want_exchange", "exchange_reason", "reject_reason", "partner_tags", "duration_seconds", "created_at"],
    koifes_post_surveys: ["id", "user_id", "post_esteem", "post_resistance", "post_barrier_change", "satisfaction", "fun_score", "comfort_score", "organization_score", "interested_count", "want_growth", "resistance_change", "self_discovery", "confidence_change", "communication_growth", "attend_again", "recommend_score", "recommend_reason", "loneliness_change", "community_feeling", "tokushima_impression_change", "marriage_motivation_change", "best_moment", "improvement_suggestion", "personality_tags", "want_others_evaluation", "want_contact_exchange", "contact_targets", "free_comment", "feedback_text", "created_at"],
    koifes_followups: ["id", "from_user_id", "to_user_id", "want_contact", "contact_method", "message", "created_at"],
    koifes_contact_exchanges: ["id", "from_user", "target_nickname", "contact_info", "created_at"],
    koifes_connections: ["id", "from_user_id", "to_user_id", "created_at"],
    koifes_favorites: ["id", "user_id", "favorite_user_id", "created_at"],
  };

  const downloadCsv = (data: Record<string, unknown>[], filename: string, tableKey?: string) => {
    const headers = tableKey ? CSV_HEADERS[tableKey] : undefined;
    const content = csvString(data, headers);
    if (!content) {
      alert("ダウンロードできるデータがありません");
      return;
    }
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const crc32 = (bytes: Uint8Array) => {
    let c = -1;
    for (let i = 0; i < bytes.length; i += 1) {
      c ^= bytes[i];
      for (let j = 0; j < 8; j += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return (c ^ -1) >>> 0;
  };

  const toU32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  const toU16 = (n: number) => [n & 255, (n >>> 8) & 255];
  const dosTimeDate = (date: Date) => {
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | ((date.getSeconds() / 2) | 0);
    const year = Math.max(1980, date.getFullYear());
    const day = (year - 1980) << 9 | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, day };
  };

  const concatBytes = (chunks: Uint8Array[]) => {
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((c) => {
      out.set(c, offset);
      offset += c.length;
    });
    return out;
  };

  const createZipBlob = (files: { name: string; content: string }[]) => {
    const encoder = new TextEncoder();
    const now = new Date();
    const { time, day } = dosTimeDate(now);
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    files.forEach((f) => {
      const nameBytes = encoder.encode(f.name);
      const dataBytes = encoder.encode(f.content);
      const crc = crc32(dataBytes);
      const localHeader = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04,
        ...toU16(20), ...toU16(0), ...toU16(0),
        ...toU16(time), ...toU16(day),
        ...toU32(crc), ...toU32(dataBytes.length), ...toU32(dataBytes.length),
        ...toU16(nameBytes.length), ...toU16(0),
      ]);
      localParts.push(localHeader, nameBytes, dataBytes);

      const central = new Uint8Array([
        0x50, 0x4b, 0x01, 0x02,
        ...toU16(20), ...toU16(20), ...toU16(0), ...toU16(0),
        ...toU16(time), ...toU16(day),
        ...toU32(crc), ...toU32(dataBytes.length), ...toU32(dataBytes.length),
        ...toU16(nameBytes.length), ...toU16(0), ...toU16(0), ...toU16(0), ...toU16(0),
        ...toU32(0), ...toU32(offset),
      ]);
      centralParts.push(central, nameBytes);
      offset += localHeader.length + nameBytes.length + dataBytes.length;
    });

    const centralBytes = concatBytes(centralParts);
    const localBytes = concatBytes(localParts);
    const end = new Uint8Array([
      0x50, 0x4b, 0x05, 0x06,
      ...toU16(0), ...toU16(0),
      ...toU16(files.length), ...toU16(files.length),
      ...toU32(centralBytes.length), ...toU32(localBytes.length),
      ...toU16(0),
    ]);
    return new Blob([localBytes, centralBytes, end], { type: "application/zip" });
  };

  const participantsWithAgg = users.map((u) => {
    const uid = String(u.id);
    return {
      ...u,
      被評価平均: ag.avgRatingByUser?.[uid]?.toFixed(1) ?? "",
      交換希望された数: ag.wantReceivedByUser?.[uid] ?? "",
      交換希望した数: ag.wantGivenByUser?.[uid] ?? "",
      相互マッチ数: ag.mutualCountByUser?.[uid] ?? "",
      もらったタグTOP3: (ag.topPartnerTagsByUser?.[uid] || []).join(" / "),
    };
  });

  const mutualMatchesCsv = (ag.mutualMatches || []).map((m) => {
    const uA = userById.get(m.a);
    const uB = userById.get(m.b);
    return {
      "Aコード": uA?.code,
      "Aニックネーム": uA?.nickname,
      "Bコード": uB?.code,
      "Bニックネーム": uB?.nickname,
      "A→B評価": m.aScore,
      "B→A評価": m.bScore,
      "交換理由": [m.aReason, m.bReason].filter(Boolean).flat().join(" "),
      日時: m.createdAt,
    };
  });

  const popularityCsv = [
    ...(ag.popularityRanking?.male?.byReceived || []).map((p, i) => ({ 性別: "男性", 順位: i + 1, ニックネーム: toCell(userById.get(p.id)?.nickname), 交換希望された数: p.count })),
    ...(ag.popularityRanking?.female?.byReceived || []).map((p, i) => ({ 性別: "女性", 順位: i + 1, ニックネーム: toCell(userById.get(p.id)?.nickname), 交換希望された数: p.count })),
  ];

  const downloadAllZip = () => {
    const files = [
      { name: "participants.csv", content: "\uFEFF" + csvString(participantsWithAgg) },
      { name: "koifes_users.csv", content: "\uFEFF" + csvString(users, CSV_HEADERS.koifes_users) },
      { name: "koifes_ratings.csv", content: "\uFEFF" + csvString(ratings, CSV_HEADERS.koifes_ratings) },
      { name: "mutual_matches.csv", content: "\uFEFF" + csvString(mutualMatchesCsv) },
      { name: "koifes_post_surveys.csv", content: "\uFEFF" + csvString(surveys, CSV_HEADERS.koifes_post_surveys) },
      { name: "koifes_followups.csv", content: "\uFEFF" + csvString(followups, CSV_HEADERS.koifes_followups) },
      { name: "koifes_contact_exchanges.csv", content: "\uFEFF" + csvString(contactExchanges, CSV_HEADERS.koifes_contact_exchanges) },
      { name: "koifes_connections.csv", content: "\uFEFF" + csvString(connections, CSV_HEADERS.koifes_connections) },
      { name: "koifes_favorites.csv", content: "\uFEFF" + csvString(favorites, CSV_HEADERS.koifes_favorites) },
      { name: "popularity_ranking.csv", content: "\uFEFF" + csvString(popularityCsv) },
    ];
    if (files.every((f) => !f.content || f.content === "\uFEFF")) {
      alert("ダウンロードできるデータがありません");
      return;
    }
    const blob = createZipBlob(files);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `koifes_all_data_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const detailUser = users.find((u) => String(u.id) === expandedUserId);

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: 24, color: "#fff" }}>
      <Header
          title="Admin"
          onLeft={() => {
            fetch("/api/admin-auth", { method: "DELETE", credentials: "include" }).then(() =>
              router.push("/admin/login")
            );
          }}
        />
      <div style={{ display: "flex", gap: 1, margin: "16px 16px", background: "rgba(255,255,255,0.06)", padding: 2 }}>
        {Object.entries(tabs).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              flex: 1,
              padding: "10px 4px",
              fontSize: 12,
              letterSpacing: "0.08em",
              background: tab === k ? "#fff" : "transparent",
              color: tab === k ? "#000" : "#666",
              border: "none",
              cursor: "pointer",
              fontWeight: tab === k ? 700 : 400,
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 16px", maxWidth: 1280, margin: "0 auto" }}>
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { l: "総参加者", v: users.length },
                { l: "男性/女性", v: `${male}/${female}` },
                { l: "総評価数", v: ratings.length },
                { l: "1人あたり平均", v: users.length ? (ratings.length / users.length).toFixed(1) : "—" },
                { l: "総接続数", v: connections.length },
                { l: "平均自己肯定感", v: avgEsteem, g: 1 },
                { l: "平均評価", v: avgRating, g: 1 },
                { l: "交換希望率(はい)", v: `${wantRate}%`, g: 1 },
                { l: "相互マッチ数", v: mutualCount, g: 1 },
                { l: "連絡先申請", v: followups.length + contactExchanges.length },
              ].map((s, i) => (
                <div key={i} style={{ border: `1px solid ${faintLine}`, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: (s as { g?: number }).g ? gold : "#fff", marginBottom: 6 }}>{s.v}</div>
                  <div style={{ fontSize: 12, letterSpacing: "0.1em", color: "#666" }}>{s.l}</div>
                </div>
              ))}
            </div>
            <SC title="データ取得状況">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                <div>参加者: <span style={{ color: gold }}>{users.length}</span></div>
                <div>評価: <span style={{ color: gold }}>{ratings.length}</span></div>
                <div>アンケート: <span style={{ color: gold }}>{surveys.length}</span></div>
                <div>お気に入り: <span style={{ color: gold }}>{favorites.length}</span></div>
                <div>followups: <span style={{ color: gold }}>{followups.length}</span></div>
                <div>contact_exchanges: <span style={{ color: gold }}>{contactExchanges.length}</span></div>
                <div>接続: <span style={{ color: gold }}>{connections.length}</span></div>
              </div>
            </SC>
          </div>
        )}

        {tab === "users" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ニックネーム/氏名で検索"
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: "transparent",
                  border: `1px solid ${faintLine}`,
                  color: "#fff",
                  padding: "10px 12px",
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                style={{
                  background: "transparent",
                  border: `1px solid ${faintLine}`,
                  color: "#fff",
                  padding: "10px 12px",
                  fontSize: 12,
                }}
              >
                <option value="all" style={{ background: "#111", color: "#fff" }}>性別: すべて</option>
                <option value="男性" style={{ background: "#111", color: "#fff" }}>男性</option>
                <option value="女性" style={{ background: "#111", color: "#fff" }}>女性</option>
              </select>
            </div>
            {filteredUsers.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555", padding: 48, fontSize: 12 }}>参加者なし</p>
            ) : (
              <>
                <div style={tableWrapStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                    <thead>
                      <tr>
                        {["コード", "氏名", "ニックネーム", "性別", "年齢区分", "実年齢", "身長", "職業", "年収帯", "被評価平均", "交換希望された数", "交換希望した数", "相互マッチ数", "もらったタグTOP3"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const uid = String(u.id);
                        return (
                        <tr
                          key={uid}
                          onClick={() => setExpandedUserId((prev) => (prev === uid ? null : uid))}
                          style={{ cursor: "pointer", background: expandedUserId === uid ? "rgba(200,169,110,0.08)" : "transparent" }}
                        >
                          <td style={tdStyle}>{toCell(u.code)}</td>
                          <td style={tdStyle}>{toCell(u.full_name)}</td>
                          <td style={tdStyle}>{toCell(u.nickname)}</td>
                          <td style={tdStyle}>{toCell(u.gender)}</td>
                          <td style={tdStyle}>{toCell(u.age)}</td>
                          <td style={tdStyle}>{toCell(u.age_number)}</td>
                          <td style={tdStyle}>{toCell(u.height)}</td>
                          <td style={tdStyle}>{toCell(u.job)}</td>
                          <td style={tdStyle}>{toCell(u.income)}</td>
                          <td style={tdStyle}>{ag.avgRatingByUser?.[uid] != null ? ag.avgRatingByUser[uid].toFixed(1) : "—"}</td>
                          <td style={tdStyle}>{ag.wantReceivedByUser?.[uid] ?? "—"}</td>
                          <td style={tdStyle}>{ag.wantGivenByUser?.[uid] ?? "—"}</td>
                          <td style={tdStyle}>{ag.mutualCountByUser?.[uid] ?? "—"}</td>
                          <td style={tdStyle}>{(ag.topPartnerTagsByUser?.[uid] || []).join(" / ") || "—"}</td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>

                {detailUser && (
                  <div style={{ marginTop: 12, border: `1px solid ${faintLine}`, padding: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                      参加者詳細: {toCell(detailUser.nickname)}（{toCell(detailUser.code)}）
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <SC title="基本情報">
                        <DetailList rows={[
                          ["ID", detailUser.id],
                          ["コード", detailUser.code],
                          ["メール", detailUser.email],
                          ["氏名", detailUser.full_name],
                          ["ニックネーム", detailUser.nickname],
                          ["性別", detailUser.gender],
                          ["年齢区分", detailUser.age],
                          ["実年齢", detailUser.age_number],
                          ["身長", detailUser.height],
                          ["職業", detailUser.job],
                          ["年収帯", detailUser.income],
                          ["登録日時", detailUser.created_at],
                        ]} />
                      </SC>
                      <SC title="家族・結婚">
                        <DetailList rows={[
                          ["家族構成", detailUser.family],
                          ["兄弟姉妹", detailUser.siblings],
                          ["家族と同居", detailUser.living_with_family],
                          ["結婚への希望", detailUser.marriage],
                          ["結婚の時期", detailUser.marriage_by_when],
                          ["子供の希望", detailUser.children],
                          ["子供の時期", detailUser.children_by_when],
                        ]} />
                      </SC>
                      <SC title="価値観・趣味">
                        <DetailList rows={[
                          ["趣味", detailUser.hobbies],
                          ["価値観", detailUser.values],
                          ["dealbreakers", detailUser.dealbreakers],
                          ["未婚理由", detailUser.unmarried_reasons],
                          ["参加歴", detailUser.event_exp],
                        ]} />
                      </SC>
                      <SC title="自己分析（運営用データ）">
                        <DetailList rows={[
                          ["自己肯定感", detailUser.esteem],
                          ["異性への抵抗感", detailUser.resistance],
                          ["自己投資額", detailUser.invest],
                          ["短所・弱み", detailUser.weakness],
                          ["周りの評価", detailUser.personality],
                        ]} />
                      </SC>
                      <SC title="自分磨き">
                        <DetailList rows={[
                          ["自分磨きの取り組み", detailUser.self_improvement],
                          ["自信度", detailUser.improvement_confidence],
                          ["変化の障壁", detailUser.barrier_change],
                        ]} />
                      </SC>
                      <SC title="徳島定住">
                        <DetailList rows={[
                          ["徳島に住み続けたいか", detailUser.stay_tokushima],
                          ["県外に出たい理由", detailUser.leave_reason],
                          ["住み続ける条件", detailUser.stay_conditions],
                          ["家を買いたいか", detailUser.buy_house],
                          ["住宅の条件", detailUser.housing_conditions],
                          ["会社のサポート", detailUser.company_support],
                        ]} />
                      </SC>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "ratings" && (
          <div>
            {ratings.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555", padding: 48, fontSize: 12 }}>評価データなし</p>
            ) : (
              <div style={tableWrapStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
                  <thead>
                    <tr>
                      {["id", "評価者", "対象者", "見た目", "話しやすさ", "ステータス", "overall", "交換希望", "交換理由", "拒否理由", "相手タグ", "所要秒", "日時"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ratings]
                      .sort((a, b) => new Date(String(b.created_at || b.createdAt || 0)).getTime() - new Date(String(a.created_at || a.createdAt || 0)).getTime())
                      .map((r) => {
                        const from = userById.get(String(r.from_user_id || r.from || ""));
                        const to = userById.get(String(r.to_user_id || r.to || ""));
                        const excReason = r.exchange_reason as string[] | null;
                        const rejReason = r.reject_reason as string[] | null;
                        return (
                          <tr key={String(r.id)}>
                            <td style={tdStyle}>{toCell(r.id)}</td>
                            <td style={tdStyle}>{toCell(from?.nickname)} ({toCell(from?.code)})</td>
                            <td style={tdStyle}>{toCell(to?.nickname)} ({toCell(to?.code)})</td>
                            <td style={tdStyle}>{toCell(r.impression)}</td>
                            <td style={tdStyle}>{toCell(r.ease)}</td>
                            <td style={tdStyle}>{toCell(r.again)}</td>
                            <td style={tdStyle}>{toCell(r.overall)}</td>
                            <td style={tdStyle}>{r.want_exchange === true ? "はい" : r.want_exchange === false ? "いいえ" : "—"}</td>
                            <td style={tdStyle}>{Array.isArray(excReason) ? excReason.join(" ") : "—"}</td>
                            <td style={tdStyle}>{Array.isArray(rejReason) ? rejReason.join(" ") : "—"}</td>
                            <td style={tdStyle}>{Array.isArray(r.partner_tags) ? (r.partner_tags as string[]).join(" ") : "—"}</td>
                            <td style={tdStyle}>{toCell(r.duration_seconds)}</td>
                            <td style={tdStyle}>{formatDate(r.created_at || r.createdAt)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "matching" && (
          <div>
            <SC title="相互マッチ一覧">
              {(ag.mutualMatches?.length ?? 0) === 0 ? (
                <p style={{ color: "#555", fontSize: 12 }}>相互マッチなし</p>
              ) : (
                <div style={tableWrapStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>ペア（A ↔ B）</th>
                        <th style={thStyle}>A→B評価</th>
                        <th style={thStyle}>B→A評価</th>
                        <th style={thStyle}>交換理由</th>
                        <th style={thStyle}>日時</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ag.mutualMatches?.map((m, i) => {
                        const uA = userById.get(m.a);
                        const uB = userById.get(m.b);
                        return (
                          <tr key={i}>
                            <td style={tdStyle}>
                              {toCell(uA?.nickname)}（{toCell(uA?.code)}） ↔ {toCell(uB?.nickname)}（{toCell(uB?.code)}）
                            </td>
                            <td style={tdStyle}>{m.aScore?.toFixed(1) ?? "—"}</td>
                            <td style={tdStyle}>{m.bScore?.toFixed(1) ?? "—"}</td>
                            <td style={tdStyle}>
                              {[m.aReason, m.bReason].filter(Boolean).map((r) => Array.isArray(r) ? r.join(", ") : "").join(" / ")}
                            </td>
                            <td style={tdStyle}>{formatDate(m.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SC>
            <SC title="人気ランキング（交換希望された数TOP20）">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: gold, marginBottom: 8 }}>男性</div>
                  {(ag.popularityRanking?.male?.byReceived || []).map((p, i) => {
                    const u = userById.get(p.id);
                    return <div key={p.id} style={{ fontSize: 12, marginBottom: 4 }}>{i + 1}. {toCell(u?.nickname)} — {p.count}件</div>;
                  })}
                  {(ag.popularityRanking?.male?.byReceived?.length ?? 0) === 0 && <div style={{ fontSize: 12, color: "#555" }}>なし</div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: gold, marginBottom: 8 }}>女性</div>
                  {(ag.popularityRanking?.female?.byReceived || []).map((p, i) => {
                    const u = userById.get(p.id);
                    return <div key={p.id} style={{ fontSize: 12, marginBottom: 4 }}>{i + 1}. {toCell(u?.nickname)} — {p.count}件</div>;
                  })}
                  {(ag.popularityRanking?.female?.byReceived?.length ?? 0) === 0 && <div style={{ fontSize: 12, color: "#555" }}>なし</div>}
                </div>
              </div>
            </SC>
          </div>
        )}

        {tab === "surveys" && (
          <div>
            {surveys.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555", padding: 48, fontSize: 12 }}>アンケート回答なし</p>
            ) : (
              <div style={tableWrapStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 2200 }}>
                  <thead>
                    <tr>
                      {[
                        "id",
                        "user_id",
                        "回答者",
                        "post_esteem",
                        "post_resistance",
                        "post_barrier_change",
                        "satisfaction",
                        "fun_score",
                        "comfort_score",
                        "organization_score",
                        "interested_count",
                        "want_growth",
                        "resistance_change",
                        "self_discovery",
                        "confidence_change",
                        "communication_growth",
                        "attend_again",
                        "recommend_score",
                        "recommend_reason",
                        "loneliness_change",
                        "community_feeling",
                        "tokushima_impression_change",
                        "marriage_motivation_change",
                        "best_moment",
                        "improvement_suggestion",
                        "personality_tags",
                        "want_others_evaluation",
                        "want_contact_exchange",
                        "contact_targets",
                        "free_comment",
                        "feedback_text",
                        "created_at",
                      ].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((s) => {
                      const u = userById.get(String(s.user_id || ""));
                      return (
                        <tr key={String(s.id)}>
                          <td style={tdStyle}>{toCell(s.id)}</td>
                          <td style={tdStyle}>{toCell(s.user_id)}</td>
                          <td style={tdStyle}>{toCell(u?.nickname)}</td>
                          <td style={tdStyle}>{toCell(s.post_esteem)}</td>
                          <td style={tdStyle}>{toCell(s.post_resistance)}</td>
                          <td style={tdStyle}>{toCell(s.post_barrier_change)}</td>
                          <td style={tdStyle}>{toCell(s.satisfaction)}</td>
                          <td style={tdStyle}>{toCell(s.fun_score)}</td>
                          <td style={tdStyle}>{toCell(s.comfort_score)}</td>
                          <td style={tdStyle}>{toCell(s.organization_score)}</td>
                          <td style={tdStyle}>{toCell(s.interested_count)}</td>
                          <td style={tdStyle}>{toCell(s.want_growth)}</td>
                          <td style={tdStyle}>{toCell(s.resistance_change)}</td>
                          <td style={tdStyle}>{toCell(s.self_discovery)}</td>
                          <td style={tdStyle}>{toCell(s.confidence_change)}</td>
                          <td style={tdStyle}>{toCell(s.communication_growth)}</td>
                          <td style={tdStyle}>{toCell(s.attend_again)}</td>
                          <td style={tdStyle}>{toCell(s.recommend_score)}</td>
                          <td style={tdStyle}>{toCell(s.recommend_reason)}</td>
                          <td style={tdStyle}>{toCell(s.loneliness_change)}</td>
                          <td style={tdStyle}>{toCell(s.community_feeling)}</td>
                          <td style={tdStyle}>{toCell(s.tokushima_impression_change)}</td>
                          <td style={tdStyle}>{toCell(s.marriage_motivation_change)}</td>
                          <td style={{ ...tdStyle, whiteSpace: "normal" }}>{toCell(s.best_moment)}</td>
                          <td style={{ ...tdStyle, whiteSpace: "normal" }}>{toCell(s.improvement_suggestion)}</td>
                          <td style={tdStyle}>{toCell(s.personality_tags)}</td>
                          <td style={tdStyle}>{toCell((s.want_others_evaluation as boolean | null) == null ? null : ((s.want_others_evaluation as boolean) ? "はい" : "いいえ"))}</td>
                          <td style={tdStyle}>{toCell(s.want_contact_exchange)}</td>
                          <td style={tdStyle}>{toCell(s.contact_targets)}</td>
                          <td style={{ ...tdStyle, whiteSpace: "normal", minWidth: 180 }}>{toCell(s.free_comment)}</td>
                          <td style={{ ...tdStyle, whiteSpace: "normal", minWidth: 180 }}>{toCell(s.feedback_text)}</td>
                          <td style={tdStyle}>{formatDate(s.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "followups" && (
          <div>
            <SC title="followups（連絡先交換申請）">
              {followups.length === 0 ? (
                <p style={{ color: "#555", fontSize: 12 }}>データなし</p>
              ) : (
                <div style={tableWrapStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["id", "from_user_id", "申請者", "to_user_id", "対象者", "want_contact", "contact_method", "message", "created_at"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {followups.map((f) => {
                        const from = userById.get(String(f.from_user_id || ""));
                        const to = userById.get(String(f.to_user_id || ""));
                        return (
                          <tr key={String(f.id)}>
                            <td style={tdStyle}>{toCell(f.id)}</td>
                            <td style={tdStyle}>{toCell(f.from_user_id)}</td>
                            <td style={tdStyle}>{toCell(from?.nickname)} ({toCell(from?.code)})</td>
                            <td style={tdStyle}>{toCell(f.to_user_id)}</td>
                            <td style={tdStyle}>{toCell(to?.nickname)} ({toCell(to?.code)})</td>
                            <td style={tdStyle}>{toCell(f.want_contact)}</td>
                            <td style={tdStyle}>{toCell(f.contact_method)}</td>
                            <td style={{ ...tdStyle, whiteSpace: "normal", maxWidth: 200 }}>{toCell(f.message)}</td>
                            <td style={tdStyle}>{formatDate(f.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SC>
            <SC title="contact_exchanges（アンケート経由の連絡先交換）">
              {contactExchanges.length === 0 ? (
                <p style={{ color: "#555", fontSize: 12 }}>データなし</p>
              ) : (
                <div style={tableWrapStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["id", "from_user", "申請者", "target_nickname", "contact_info", "created_at"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contactExchanges.map((c) => {
                        const from = userById.get(String(c.from_user || ""));
                        return (
                          <tr key={String(c.id)}>
                            <td style={tdStyle}>{toCell(c.id)}</td>
                            <td style={tdStyle}>{toCell(c.from_user)}</td>
                            <td style={tdStyle}>{toCell(from?.nickname)} ({toCell(from?.code)})</td>
                            <td style={tdStyle}>{toCell(c.target_nickname)}</td>
                            <td style={tdStyle}>{toCell(c.contact_info)}</td>
                            <td style={tdStyle}>{formatDate(c.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SC>
            <SC title="connections（接続）">
              {connections.length === 0 ? (
                <p style={{ color: "#555", fontSize: 12 }}>データなし</p>
              ) : (
                <div style={tableWrapStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["id", "from_user_id", "申請者", "to_user_id", "対象者", "created_at"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {connections.map((c) => {
                        const from = userById.get(String(c.from_user_id || c.from_user || ""));
                        const to = userById.get(String(c.to_user_id || c.to_user || ""));
                        return (
                          <tr key={String(c.id)}>
                            <td style={tdStyle}>{toCell(c.id)}</td>
                            <td style={tdStyle}>{toCell(c.from_user_id || c.from_user)}</td>
                            <td style={tdStyle}>{toCell(from?.nickname)} ({toCell(from?.code)})</td>
                            <td style={tdStyle}>{toCell(c.to_user_id || c.to_user)}</td>
                            <td style={tdStyle}>{toCell(to?.nickname)} ({toCell(to?.code)})</td>
                            <td style={tdStyle}>{formatDate(c.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SC>
            <SC title="favorites（お気に入り）">
              {favorites.length === 0 ? (
                <p style={{ color: "#555", fontSize: 12 }}>データなし</p>
              ) : (
                <div style={tableWrapStyle}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["id", "user_id", "登録者", "favorite_user_id", "お気に入り相手", "created_at"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {favorites.map((f) => {
                        const u = userById.get(String(f.user_id || ""));
                        const fav = userById.get(String(f.favorite_user_id || ""));
                        return (
                          <tr key={String(f.id)}>
                            <td style={tdStyle}>{toCell(f.id)}</td>
                            <td style={tdStyle}>{toCell(f.user_id)}</td>
                            <td style={tdStyle}>{toCell(u?.nickname)} ({toCell(u?.code)})</td>
                            <td style={tdStyle}>{toCell(f.favorite_user_id)}</td>
                            <td style={tdStyle}>{toCell(fav?.nickname)} ({toCell(fav?.code)})</td>
                            <td style={tdStyle}>{formatDate(f.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SC>
          </div>
        )}

        {tab === "export" && (
          <div style={{ display: "grid", gap: 10 }}>
            <ExportBtn label="participants.csv（参加者+集計）" onClick={() => downloadCsv(participantsWithAgg, "participants")} />
            <ExportBtn label="koifes_users.csv（参加者生データ）" onClick={() => downloadCsv(users, "koifes_users", "koifes_users")} />
            <ExportBtn label="ratings.csv（評価データ）" onClick={() => downloadCsv(ratings, "koifes_ratings", "koifes_ratings")} />
            <ExportBtn label="mutual_matches.csv（相互マッチ）" onClick={() => downloadCsv(mutualMatchesCsv, "mutual_matches")} />
            <ExportBtn label="surveys.csv（アンケート）" onClick={() => downloadCsv(surveys, "koifes_post_surveys", "koifes_post_surveys")} />
            <ExportBtn label="followups.csv（連絡先申請）" onClick={() => downloadCsv(followups, "koifes_followups", "koifes_followups")} />
            <ExportBtn label="contact_exchanges.csv" onClick={() => downloadCsv(contactExchanges, "koifes_contact_exchanges", "koifes_contact_exchanges")} />
            <ExportBtn label="connections.csv" onClick={() => downloadCsv(connections, "koifes_connections", "koifes_connections")} />
            <ExportBtn label="favorites.csv" onClick={() => downloadCsv(favorites, "koifes_favorites", "koifes_favorites")} />
            <ExportBtn label="popularity_ranking.csv" onClick={() => downloadCsv(popularityCsv, "popularity_ranking")} />
            <ExportBtn label="全CSV一括ダウンロード（ZIP）" onClick={downloadAllZip} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailList({ rows }: { rows: [string, unknown][] }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: 4 }}>
          <span style={{ color: "#777", fontSize: 12 }}>{k}</span>
          <span style={{ color: "#ddd", fontSize: 12, textAlign: "right" }}>{Array.isArray(v) ? v.join(" / ") : v == null || v === "" ? "—" : String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function ExportBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "1px solid rgba(200,169,110,0.3)",
        background: "rgba(200,169,110,0.06)",
        color: "#fff",
        padding: "12px 14px",
        textAlign: "left",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
