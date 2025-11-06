// pages/result.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { CATEGORY_COLORS } from "../lib/categories";

// 受け渡し：?data=<encodeURIComponent(JSON)>
// or sessionStorage.setItem('nm-latest-result', JSON.stringify(result))
function readResult() {
  try {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("data");
    if (q) return JSON.parse(decodeURIComponent(q));
  } catch {}
  try {
    const s = sessionStorage.getItem("nm-latest-result");
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}

// HEX -> {r,g,b}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// 思考のクセを作る（APIに thoughts が無い時のフォールバック）
function buildThoughts(data) {
  if (Array.isArray(data?.thoughts) && data.thoughts.length) return data.thoughts.slice(0, 3);
  const pool = [];
  if (Array.isArray(data?.midTop)) pool.push(...data.midTop);
  if (Array.isArray(data?.keywords)) pool.push(...data.keywords);
  const seen = new Set();
  const uniq = pool.filter((t) => {
    const s = String(t || "").trim();
    if (!s || seen.has(s)) return false;
    seen.add(s);
    return true;
  });
  // 少し人間っぽく補う
  const fallback = [
    "仕事によって得られる内面の達成感を重視",
    "他人の期待に合わせて動きがち",
    "自分軸での仕事の立ち位置を模索中",
  ];
  const out = uniq.slice(0, 3);
  while (out.length < 3) out.push(fallback[out.length]);
  return out.slice(0, 3);
}

// ヒントを作る（APIに hints が無い時のフォールバック）
function buildHints(data) {
  if (Array.isArray(data?.hints) && data.hints.length) return data.hints.slice(0, 2);
  return [
    "他人の期待より、自分の納得を大事にしよう\nー誰かに褒められても、すぐに消える\nー自分で「これでいい」と思えた瞬間のほうが、ずっと残る",
    "何をやるかより、どんな気持ちでやれるか\nー内容よりも、働いているときの自分の感情を大切に\nー心が動く瞬間こそ“自分らしさ”のサイン",
  ];
}

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(readResult());
  }, []);

  // 背景のカテゴリ色（最優先は categories[0]）
  const bgRgba = useMemo(() => {
    const first = data?.categories?.[0]?.name || "";
    const clean = first.replace(/[💼💰✨🤝⚡🩷🌿]/g, "").trim();
    const hex = CATEGORY_COLORS[clean] || "#d9d9d9";
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, 0.3)`; // 30% 透明度
  }, [data]);

  const photoUrl = data?.photoUrl || "";
  const posts = Number(data?.posts ?? 1);
  const streak = Number(data?.streak ?? 1);
  const thoughts = buildThoughts(data || {});
  const hints = buildHints(data || {});

  return (
    <main
      style={{
        minHeight: "100vh",
        background: bgRgba,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px 120px",
        fontFamily: "system-ui",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 10px 28px rgba(0,0,0,.08)",
          padding: "28px 22px 36px",
        }}
      >
        {/* --- 結果領域 --- */}
        <div>
          {/* ヘッドショット */}
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: "50%",
                margin: "0 auto 12px",
                background: "#f2f3f5",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,.10)",
              }}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="face" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontSize: 52, color: "#9aa0a6" }}>🙂</div>
              )}
            </div>

            {/* 投稿数 / ストリーク */}
            <div style={{ fontSize: 14, color: "#333", fontWeight: 700 }}>
              投稿数: {posts}　/　ストリーク: {streak}
            </div>
          </div>

          {/* タイトル（あれば） */}
          {data?.title && (
            <h1
              style={{
                margin: "16px 0 10px",
                textAlign: "center",
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1.4,
              }}
            >
              📊 日記からわかるあなたの分析結果
            </h1>
          )}

          {/* 🧠 思考のクセ */}
          <section style={{ marginTop: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>🧠 思考のクセ</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {thoughts.map((t, i) => (
                <li key={i} style={{ color: "#222" }}>
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {/* 💡 自分を見つめなおすためのヒント */}
          <section style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>💡 自分を見つめなおすためのヒント</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {hints.map((h, i) => (
                <li key={i} style={{ whiteSpace: "pre-line", color: "#333" }}>
                  {h}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ▼ 再分析ボタン + 案内文 + ソーシャルボタン群 */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          {/* 大きな再分析ボタン */}
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => router.push("/analyze")}
              style={{
                background: "#0ea5e9",
                color: "#fff",
                padding: "14px 20px",
                borderRadius: 12,
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 280,
                boxShadow: "0 10px 28px rgba(14,165,233,.25)",
                fontSize: 18,
              }}
            >
              他の日記も試してみる
            </button>
          </div>

          {/* 新しい文言（フォローボタンの前） */}
          <div style={{ marginTop: 6, marginBottom: 10, color: "#444", fontSize: 14, fontWeight: 700 }}>
            もうすぐNowMeアプリベータ版が登場予定🚀
            <br />
            先行案内は公式SNSでチェック！
          </div>

          {/* フォローボタン */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 6,
            }}
          >
            <button
              onClick={() => window.open("https://lin.ee/wwmzy4G", "_blank", "noopener,noreferrer")}
              style={{
                background: "#06C755",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 999,
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 140,
                fontSize: 16,
              }}
            >
              LINE をフォロー
            </button>

            <button
              onClick={() => window.open("https://x.com/NowMe_app_", "_blank", "noopener,noreferrer")}
              style={{
                background: "#111",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 999,
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 140,
                fontSize: 16,
              }}
            >
              X をフォロー
            </button>

            <button
              onClick={() => window.open("https://www.instagram.com/now_me_app", "_blank", "noopener,noreferrer")}
              style={{
                background: "linear-gradient(45deg, #f58529, #feda77, #dd2a7b, #8134af, #515bd4)",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 999,
                border: "none",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 140,
                fontSize: 16,
              }}
            >
              Instagram をフォロー
            </button>
          </div>
        </div>
      </div>

      {/* footer copyright */}
      <div
        style={{
          position: "fixed",
          left: 12,
          bottom: 8,
          color: "#444",
          fontSize: 12,
          opacity: 0.95,
          fontFamily: "system-ui",
        }}
      >
        © 2025 NowMe. All rights reserved.
      </div>
    </main>
  );
}
