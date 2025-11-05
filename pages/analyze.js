// pages/analyze.js
import { useState } from "react";
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
  const [preview, setPreview] = useState(null);          // quickの結果（画面表示専用）
  const [loading, setLoading] = useState(false);
  const [resultFixed, setResultFixed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

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
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        🧠 あなたの日記を10秒で整理・分析
      </h1>
      <p style={{ color: "#666", marginBottom: 12 }}>
        貼り付け → まずは<strong>カテゴリ・タイトル・一言コメント</strong>を表示するよ。
      </p>

      <textarea
        value={text}
        onChange={handleChange}
        placeholder="ここに日記やメモをコピペ（長いほうがより正確な分析ができるよ！）"
        style={{
          width: "100%",
          height: 180,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 12,
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

      {preview && (
        <section
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
            <div
              style={{
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              {preview.title}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>コメント</div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
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

      <style jsx>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
