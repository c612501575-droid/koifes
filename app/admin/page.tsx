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
    surveys: "アンケート結果",
    export: "エクスポート",
  };

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

  const csvString = (data: Record<string, unknown>[]) => {
    if (!data.length) return "";
    const headers = Object.keys(data[0]);
    return [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            const str = Array.isArray(val) ? val.join(";") : String(val ?? "");
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");
  };

  const downloadCsv = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) {
      alert("ダウンロードできるデータがありません");
      return;
    }
    const content = csvString(data);
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

  const downloadAllZip = () => {
    const files = [
      { name: "koifes_users.csv", content: "\uFEFF" + csvString(users) },
      { name: "koifes_ratings.csv", content: "\uFEFF" + csvString(ratings) },
      { name: "koifes_post_surveys.csv", content: "\uFEFF" + csvString(surveys) },
      { name: "koifes_favorites.csv", content: "\uFEFF" + csvString(favorites) },
      { name: "koifes_followups.csv", content: "\uFEFF" + csvString(followups) },
      { name: "koifes_connections.csv", content: "\uFEFF" + csvString(connections) },
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
                { l: "平均自己肯定感", v: avgEsteem, g: 1 },
                { l: "平均評価", v: avgRating, g: 1 },
                { l: "総接続数", v: connections.length },
                { l: "総評価数", v: ratings.length },
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
                <div>連絡先交換: <span style={{ color: gold }}>{followups.length}</span></div>
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
                        {["コード", "氏名", "ニックネーム", "性別", "年齢区分", "実年齢", "身長", "職業", "年収帯"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr
                          key={String(u.id)}
                          onClick={() => setExpandedUserId((prev) => (prev === String(u.id) ? null : String(u.id)))}
                          style={{ cursor: "pointer", background: expandedUserId === String(u.id) ? "rgba(200,169,110,0.08)" : "transparent" }}
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
                        </tr>
                      ))}
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
                          ["コード", detailUser.code],
                          ["氏名", detailUser.full_name],
                          ["ニックネーム", detailUser.nickname],
                          ["性別", detailUser.gender],
                          ["年齢区分", detailUser.age],
                          ["実年齢", detailUser.age_number],
                          ["身長", detailUser.height],
                          ["職業", detailUser.job],
                          ["年収帯", detailUser.income],
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
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                  <thead>
                    <tr>
                      {["評価者", "対象者", "見た目", "話しやすさ", "ステータス", "日時"].map((h) => (
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
                        return (
                          <tr key={String(r.id)}>
                            <td style={tdStyle}>{toCell(from?.nickname)}</td>
                            <td style={tdStyle}>{toCell(to?.nickname)}</td>
                            <td style={tdStyle}>{toCell(r.impression)}</td>
                            <td style={tdStyle}>{toCell(r.ease)}</td>
                            <td style={tdStyle}>{toCell(r.again)}</td>
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

        {tab === "surveys" && (
          <div>
            {surveys.length === 0 ? (
              <p style={{ textAlign: "center", color: "#555", padding: 48, fontSize: 12 }}>アンケート回答なし</p>
            ) : (
              <div style={tableWrapStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1400 }}>
                  <thead>
                    <tr>
                      {[
                        "回答者",
                        "満足度",
                        "楽しさ",
                        "居心地",
                        "運営",
                        "気になった人数",
                        "成長意欲",
                        "自己肯定感",
                        "抵抗感変化",
                        "再参加",
                        "周りの評価",
                        "他者評価希望",
                        "自由記述",
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
                          <td style={tdStyle}>{toCell(u?.nickname)}</td>
                          <td style={tdStyle}>{toCell(s.satisfaction)}</td>
                          <td style={tdStyle}>{toCell(s.fun_score)}</td>
                          <td style={tdStyle}>{toCell(s.comfort_score)}</td>
                          <td style={tdStyle}>{toCell(s.organization_score)}</td>
                          <td style={tdStyle}>{toCell(s.interested_count)}</td>
                          <td style={tdStyle}>{toCell(s.want_growth)}</td>
                          <td style={tdStyle}>{toCell(s.post_esteem)}</td>
                          <td style={tdStyle}>{toCell(s.resistance_change || s.post_barrier_change)}</td>
                          <td style={tdStyle}>{toCell(s.attend_again)}</td>
                          <td style={tdStyle}>{toCell(s.personality_tags)}</td>
                          <td style={tdStyle}>{toCell((s.want_others_evaluation as boolean | null) == null ? null : ((s.want_others_evaluation as boolean) ? "はい" : "いいえ"))}</td>
                          <td style={{ ...tdStyle, whiteSpace: "normal", minWidth: 220 }}>{toCell(s.feedback_text || s.free_comment)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "export" && (
          <div style={{ display: "grid", gap: 10 }}>
            <ExportBtn label="参加者データをCSVでダウンロード" onClick={() => downloadCsv(users, "koifes_users")} />
            <ExportBtn label="評価データをCSVでダウンロード" onClick={() => downloadCsv(ratings, "koifes_ratings")} />
            <ExportBtn label="アンケート結果をCSVでダウンロード" onClick={() => downloadCsv(surveys, "koifes_post_surveys")} />
            <ExportBtn label="お気に入りデータをCSVでダウンロード" onClick={() => downloadCsv(favorites, "koifes_favorites")} />
            <ExportBtn label="連絡先交換データをCSVでダウンロード" onClick={() => downloadCsv(followups, "koifes_followups")} />
            <ExportBtn label="全データ一括ダウンロード" onClick={downloadAllZip} />
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
