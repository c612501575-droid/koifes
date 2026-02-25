"use client";

import { useState } from "react";
import { gold, goldFade, goldBorder } from "@/app/lib/koifes-constants";

export function Chip({
  label,
  selected,
  onClick,
  accent,
  small,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? (accent ? gold : "#fff") : "transparent",
        border: `1px solid ${selected ? (accent ? gold : "#fff") : "rgba(255,255,255,0.15)"}`,
        color: selected ? "#000" : "rgba(255,255,255,0.55)",
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: small ? 12 : 13,
        fontWeight: 400,
        padding: small ? "7px 14px" : "10px 18px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        letterSpacing: "0.05em",
        lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  );
}

export function ChipGroup({
  options,
  value,
  onChange,
  multi,
  accent,
  small,
}: {
  options: string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
  accent?: boolean;
  small?: boolean;
}) {
  const toggle = (opt: string) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      onChange(
        arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]
      );
    } else {
      onChange(opt);
    }
  };
  const isSel = (opt: string) =>
    multi ? (value || []).includes(opt) : value === opt;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: small ? 8 : 10 }}>
      {options.map((o) => (
        <Chip
          key={o}
          label={o}
          selected={isSel(o)}
          onClick={() => toggle(o)}
          accent={accent}
          small={small}
        />
      ))}
    </div>
  );
}

export function SliderInput({
  subLeft,
  subRight,
  value,
  onChange,
  max = 10,
}: {
  subLeft: string;
  subRight: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 11, color: "#666" }}>{subLeft}</span>
        <span style={{ fontSize: 11, color: "#666" }}>{subRight}</span>
      </div>
      <input
        type="range"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <div
        style={{
          textAlign: "center",
          marginTop: 12,
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: 28,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {value}
        <span style={{ fontSize: 14, color: "#666", marginLeft: 4 }}>
          / {max}
        </span>
      </div>
    </div>
  );
}

export function RankingSelector({
  title,
  options,
  value,
  onChange,
  maxRank = 3,
}: {
  title: string;
  options: string[];
  value: string[];
  onChange: (ranked: string[]) => void;
  maxRank?: number;
}) {
  const ranked = value.slice(0, maxRank);
  const isSelected = (opt: string) => ranked.includes(opt);
  const isFull = ranked.length >= maxRank;

  const add = (opt: string) => {
    if (isSelected(opt) || isFull) return;
    onChange([...ranked, opt]);
  };

  const remove = (opt: string) => {
    onChange(ranked.filter((x) => x !== opt));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...ranked];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ marginBottom: 32 }}>
      <label style={{ display: "block", fontSize: 13, letterSpacing: "0.1em", color: "#999", marginBottom: 12 }}>{title}</label>

      {/* ランキングエリア */}
      {ranked.length > 0 && (
        <div style={{ marginBottom: 16, padding: 16, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 10 }}>
          {ranked.map((item, i) => (
            <div
              key={`${item}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                marginBottom: i < ranked.length - 1 ? 8 : 0,
                background: "rgba(200,169,110,0.06)",
                border: `1px solid rgba(200,169,110,0.2)`,
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{medals[i] ?? `${i + 1}位`}</span>
              <span style={{ flex: 1, fontSize: 13, color: "#fff" }}>{item}</span>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: i === 0 ? "#222" : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    color: i === 0 ? "#444" : gold,
                    fontSize: 14,
                    cursor: i === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === ranked.length - 1}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: i === ranked.length - 1 ? "#222" : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    color: i === ranked.length - 1 ? "#444" : gold,
                    fontSize: 14,
                    cursor: i === ranked.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    border: "1px solid rgba(255,100,100,0.3)",
                    borderRadius: 6,
                    color: "#e55",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 選択肢一覧 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const selected = isSelected(opt);
          const blocked = !selected && isFull;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => (selected ? remove(opt) : add(opt))}
              style={{
                background: selected ? gold : "transparent",
                border: `1px solid ${selected ? gold : blocked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.15)"}`,
                color: selected ? "#000" : blocked ? "#444" : "rgba(255,255,255,0.65)",
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fontWeight: 400,
                padding: "7px 14px",
                cursor: blocked ? "not-allowed" : "pointer",
                transition: "all 0.25s ease",
                letterSpacing: "0.05em",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FormLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 13,
        letterSpacing: "0.1em",
        color: "#999",
        marginBottom: 12,
      }}
    >
      {children}
      {required && <span style={{ color: gold, marginLeft: 4 }}>*</span>}
    </label>
  );
}

export function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  min?: number;
  max?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      maxLength={maxLength}
      min={min}
      max={max}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${focused ? gold : "rgba(255,255,255,0.18)"}`,
        color: "#fff",
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 16,
        fontWeight: 400,
        padding: "12px 0",
        outline: "none",
        borderRadius: 0,
        transition: "border-color 0.4s",
      }}
    />
  );
}

export function BtnPrimary({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: "100%",
        background: disabled ? "#222" : h ? gold : "#fff",
        color: disabled ? "#555" : "#000",
        border: disabled ? "1px solid #333" : "none",
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 14,
        fontWeight: 400,
        letterSpacing: "0.3em",
        padding: 18,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.3s",
      }}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: "100%",
        background: "transparent",
        color: h ? "#fff" : "#999",
        border: `1px solid ${h ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}`,
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "0.2em",
        padding: 14,
        cursor: "pointer",
        marginTop: 12,
        transition: "all 0.3s",
      }}
    >
      {children}
    </button>
  );
}

export function Header({
  title,
  onLeft,
  right,
}: {
  title: string;
  onLeft?: () => void;
  right?: React.ReactNode;
}) {
  const faintLine = "rgba(255,255,255,0.08)";
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${faintLine}`,
        padding: "20px 24px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      {onLeft ? (
        <button
          onClick={onLeft}
          style={{
            background: "none",
            border: "none",
            color: "#999",
            cursor: "pointer",
            fontSize: 20,
            padding: 4,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          ←
        </button>
      ) : (
        <div style={{ width: 28 }} />
      )}
      <span
        style={{
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: 20,
          fontStyle: "italic",
          fontWeight: 400,
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </span>
      {right || <div style={{ width: 28 }} />}
    </div>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  const faintLine = "rgba(255,255,255,0.08)";
  return (
    <div
      style={{
        height: 1,
        background: faintLine,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          background: gold,
          transition: "width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
          width: `${(step / total) * 100}%`,
        }}
      />
    </div>
  );
}

export function Avatar({ char, size = 72, borderColor }: { char?: string; size?: number; borderColor?: string }) {
  const bc = borderColor || "rgba(255,255,255,0.12)";
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `1px solid ${bc}`,
        flexShrink: 0,
        background: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontFamily: "'Noto Sans JP', sans-serif",
        color: gold,
        fontStyle: "italic",
        margin: "0 auto",
      }}
    >
      {char || "♡"}
    </div>
  );
}

export function EditIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#555",
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.2s",
        fontSize: 12,
        padding: 0,
      }}
    >
      ✎
    </button>
  );
}

export function BottomNav({
  active,
  onNav,
}: {
  active: string;
  onNav: (id: string) => void;
}) {
  const faintLine = "rgba(255,255,255,0.08)";
  const items = [
    { id: "home", icon: "⌂", label: "HOME" },
    { id: "card", icon: "◈", label: "CARD" },
    { id: "scan", icon: "⊡", label: "SCAN" },
    { id: "profile", icon: "◎", label: "PROFILE" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${faintLine}`,
        display: "flex",
        zIndex: 200,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onNav(it.id)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "14px 8px 22px",
            cursor: "pointer",
            border: "none",
            background: "none",
            color: active === it.id ? gold : "#555",
            gap: 5,
            transition: "color 0.2s",
          }}
        >
          <span style={{ fontSize: 18 }}>{it.icon}</span>
          <span style={{ fontSize: 8, letterSpacing: "0.25em", fontFamily: "'Noto Sans JP'" }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Toast({ msg, show, variant = "success" }: { msg: string; show: boolean; variant?: "success" | "error" }) {
  const isError = variant === "error";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 100,
        left: "50%",
        transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`,
        background: isError ? "#ef4444" : gold,
        color: isError ? "#fff" : "#000",
        padding: "14px 28px",
        fontSize: 12,
        letterSpacing: "0.15em",
        opacity: show ? 1 : 0,
        transition: "all 0.4s ease",
        zIndex: 999,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        fontFamily: "'Noto Sans JP'",
        fontWeight: 400,
      }}
    >
      {msg}
    </div>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: goldFade,
        border: `1px solid ${goldBorder}`,
        padding: "12px 16px",
        marginBottom: 24,
      }}
    >
      <p
        style={{
        fontSize: 12,
        letterSpacing: "0.06em",
          color: gold,
          lineHeight: 1.8,
        }}
      >
        {children}
      </p>
    </div>
  );
}
