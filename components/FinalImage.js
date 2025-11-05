// components/FinalImage.js
import { useMemo } from "react";

function gradientTextStyle(colors) {
  if (!colors || colors.length === 0) return { color: "#222" };
  if (colors.length === 1) {
    return { color: colors[0], textShadow: "0 0 2px rgba(0,0,0,0.05)" };
  }
  // 2色グラデーション
  const g = `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
  return {
    backgroundImage: g,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textShadow: "0 0 2px rgba(0,0,0,0.08)",
  };
}

export default function FinalImage({
  title,
  elements,
  categoryColors,
  size = 520,
  photoUrl,
  posts = 1,
  streak = 1,
}) {
  const center = size / 2;
  const faceRadius = 88;
  const ringRadius = center - 36;
  const items = Array.isArray(elements) ? elements.slice(0, 14) : [];

  const positioned = useMemo(() => {
    const n = Math.max(items.length, 1);
    const startShift = Math.PI / 24;
    return items.map((el, idx) => {
      const theta = (2 * Math.PI * idx) / n - Math.PI / 2 + startShift;
      const x = center + Math.cos(theta) * ringRadius;
      const y = center + Math.sin(theta) * ringRadius;
      const cats = Array.isArray(el.categories) ? el.categories : [];
      const colors = cats.slice(0, 2).map((c) => categoryColors[c]).filter(Boolean);
      return { ...el, x, y, theta, colors };
    });
  }, [items, center, ringRadius, categoryColors]);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: 24,
        background: "#fff",
        boxShadow: "0 10px 28px rgba(0,0,0,.07)",
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      {title && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 16,
            right: 16,
            textAlign: "center",
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1.2,
            color: "#222",
          }}
        >
          {title}
        </div>
      )}

      {/* 顔 */}
      <div
        style={{
          position: "absolute",
          left: center - faceRadius,
          top: center - faceRadius,
          width: faceRadius * 2,
          height: faceRadius * 2,
          borderRadius: "50%",
          background: "#f3f4f6",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
          overflow: "hidden",
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="face"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ fontSize: 56, color: "#8a8d94" }}>🙂</div>
        )}
      </div>

      {/* 要素ラベル */}
      {positioned.map((it, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: it.x,
            top: it.y,
            transform: "translate(-50%, -50%)",
            fontSize: 14,
            fontWeight: 800,
            padding: "6px 10px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,.05)",
            boxShadow: "0 2px 8px rgba(0,0,0,.05)",
            userSelect: "none",
            ...gradientTextStyle(it.colors),
          }}
          title={(it.categories || []).join(" / ")}
        >
          {it.text}
        </div>
      ))}

      {/* 投稿数 / ストリーク */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: center + faceRadius + 10,
          textAlign: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "#333",
        }}
      >
        投稿数: {posts}　/　ストリーク: {streak}
      </div>
    </div>
  );
}
