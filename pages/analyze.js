// pages/analyze.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

function fallbackTitle(src) {
  const s = (src || "").trim().replace(/\s+/g, " ");
  if (!s) return "タイトル（自動）";
  const idx = s.indexOf("。");
  let t = idx > 0 ? s.slice(0, idx) : s.slice(0, 24);
  if (t.length < s.length) t += "…";
  return t;
}

export default function Analyze() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null); // quickの結果（画面表示専用）
  const [loading, setLoading] = useState(false);
  const [resultFixed, setResultFixed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

  // ref: 結果セクションにスクロールするため
  const previewRef = useRef(null);

  const runQuick = async () => {
    if (!text.trim()) return;
    setLoading(true);

    const fetchPromise = fetch("/api/quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).then((r) => r.json());

    const delay = new Promise((res) => setTimeout(res, 1500));
    const data = await Promise.all([fetchPromise, delay]).then(([json]) => json);

    setPreview({
      highLevelCategories: data?.highLevelCategories ?? [],
      colors: data?.colors ?? [],
      title: data?.title || fallbackTitle(text),
      aiComment: data?.aiComment ?? "気持ちわかるよ。深呼吸していこう。",
    });

    setLoading(false);
    setResultFixed(true);

    // ここでは nm-latest-result は保存しない（gateでfull結果を保存する）
  };

  // previewがセットされたら自動でスクロール
  useEffect(() => {
    if (!preview) return;
    // 少し待ってからスクロール（レンダリング完了を待つ）
    const t = setTimeout(() => {
      const el = previewRef.current;
      if (!el) return;
      // スムーズスクロール（"start" で要素の上端に寄せる）
      // 少しオフセット（上の余白）を作るために window.scrollTo を使う
      const rect = el.getBoundingClientRect();
      const offset = 16; // 上に余白を作るピクセル数
      const targetY = window.scrollY + rect.top - offset;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [preview]);

  const handleChange = (e) => {
    setText(e.target.value);
    setPreview(null);
    setResultFixed(false);
  };

  // gateへ：nowme_text だけ保存
  const handleGoNext = async () => {
    setTransitioning(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("nowme_text", text);
    }
    setTimeout(() => {
      setTransitioning(false);
      router.push("/gate");
    }, 800);
  };

  return (
    <main style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: 16, fontFamily: "system-ui", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8 }}>🧠 あなたの日記を10秒で整理・分析</h1>
      <p style={{ color: "#666", marginBottom: 12 }}>
        貼り付け → まずは<strong>カテゴリ・タイトル・一言コメント</strong>を表示するよ。
      </p>

      <textarea
        value={text}
        onChange={handleChange}
        placeholder="ここに日記やメモをコピペ（長いほうがより正確な分析ができるよ！）"
        style={{
          width: "100%",
          height: "33vh", // 高さを画面の1/3くらいに
          minHeight: 120,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 12,
          fontSize: 16, // プレースホルダーと入力のフォントサイズを大きく
          lineHeight: 1.5,
          boxSizing: "border-box",
          overflow: "auto",
          resize: "vertical",
        }}
      />

      <button
        onClick={runQuick}
        disabled={loading || resultFixed || !text.trim()}
        style={{
          background: loading ? "#93c5fd" : resultFixed ? "#9ca3af" : "#0ea5e9",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          cursor: loading || resultFixed ? "default" : "pointer",
          position: "relative",
          fontSize: 16, // ボタンのフォントサイズを16に
        }}
      >
        {loading ? (
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              border: "2px solid #fff",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              verticalAlign: "middle",
            }}
          />
        ) : (
          "結果を見る"
        )}
      </button>

      {/* preview がレンダリングされるエリア。ref をここに渡す */}
      {preview && (
        <section
          ref={previewRef}
          style={{
            marginTop: 16,
            padding: 16,
            background: "#f9fafb",
            border: "1px solid #eee",
            borderRadius: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>カテゴリ</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {preview.highLevelCategories.map((c, i) => (
              <span
                key={`${c.name}-${i}`}
                style={{
                  background: "#fff",
                  border: `1px solid ${preview.colors?.[i] || "#ddd"}`,
                  color: preview.colors?.[i] || "#333",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontWeight: 600,
                }}
              >
                {c.name}
              </span>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>タイトル</div>
            <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 16 }}>
              {preview.title}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>コメント</div>
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "8px 10px", fontSize: 16 }}>
              {preview.aiComment}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleGoNext}
              disabled={transitioning}
              style={{
                background: transitioning ? "#93c5fd" : "#0ea5e9",
                color: "#fff",
                padding: "10px 14px",
                border: "none",
                borderRadius: 8,
                cursor: transitioning ? "default" : "pointer",
                position: "relative",
                fontSize: 16, // ボタンのフォントを16に
              }}
            >
              {transitioning ? (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    border: "2px solid #fff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    verticalAlign: "middle",
                  }}
                />
              ) : (
                "この日記からわかるあなたの性格を見る（無料）"
              )}
            </button>
          </div>
        </section>
      )}

      <p style={{ marginTop: 12, color: "#888", fontSize: 12, lineHeight: 1.6 }}>
        ご入力いただいた内容やメッセージは、本サービスの体験以外には一切利用いたしません。<br />
        お客様のデータが外部と共有されることはございませんので、安心してご利用下さい。
      </p>

      {/* footer copyright */}
      <div style={{ position: "fixed", left: 12, bottom: 8, color: "#444", fontSize: 12, opacity: 0.95, fontFamily: "system-ui" }}>
        © 2025 NowMe. All rights reserved.
      </div>

      <style jsx>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        textarea::placeholder { font-size: 16px; }
        button { font-family: inherit; }
      `}</style>
    </main>
  );
}
