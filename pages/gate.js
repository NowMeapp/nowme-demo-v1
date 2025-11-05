// pages/gate.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// ✅ 公式アカウントのリンク（必要に応じて差し替えてください）
const LINKS = {
  line: "https://lin.ee/wwmzy4G",        // 例: LINE公式の招待URL
  x: "https://x.com/NowMe_app_",      // 例: X(旧Twitter)
  insta: "https://www.instagram.com/now_me_app", // 例: Instagram
};

export default function Gate() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(true);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);   // 1秒後に表示
  const [followed, setFollowed] = useState(false);       // どれか押したら true
  const [err, setErr] = useState("");

  // --- 起動時：テキスト読込 + 解析開始 + 1秒後にCTA表示 ---
  useEffect(() => {
    const t = sessionStorage.getItem("nowme_text") || "";
    setText(t);

    // 解析を自動スタート
    (async () => {
      try {
        const rsp = await fetch("/api/full", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: t }),
        });
        const json = await rsp.json();

        // 最新結果で上書き保存
        try { sessionStorage.removeItem("nm-latest-result"); } catch {}
        sessionStorage.setItem("nm-latest-result", JSON.stringify(json));

        setAnalysisDone(true);
      } catch (e) {
        console.error("gate full error:", e);
        setErr("分析に失敗しました。もう一度お試しください。");
      } finally {
        setAnalyzing(false);
      }
    })();

    // 1秒後にCTA表示
    const timer = setTimeout(() => setCtaVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // --- どれかのフォローボタンを押したら、新しいタブで開いてフラグON。分析も終わっていれば /result へ ---
  const handleFollow = (platform) => {
    const url = LINKS[platform];
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setFollowed(true);
  };

  // 条件を満たしたら自動遷移
  useEffect(() => {
    if (followed && analysisDone) {
      router.replace("/result");
    }
  }, [followed, analysisDone, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui",
        padding: 24,
        background: "#f6f7f8",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          textAlign: "center",
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 16,
          padding: "28px 22px",
          boxShadow: "0 10px 28px rgba(0,0,0,.06)",
        }}
      >
        {/* 分析中カードはそのまま */}
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>分析中…</div>
        <div style={{ color: "#666", marginBottom: 16 }}>
          あなたの言葉を読み取り、思考のクセと内省ヒントを作成しています。
        </div>
        <div
          aria-hidden
          style={{
            width: 28,
            height: 28,
            margin: "12px auto 14px",
            border: "3px solid #93c5fd",
            borderTop: "3px solid transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />

        {/* 1秒後にCTAを表示 */}
        {ctaVisible && (
          <div style={{ marginTop: 12 }}>
            <h2
              style={{
                textDecoration: "underline",
                fontSize: 16,
                fontWeight: 800,
                margin: "8px 0 10px",
              }}
            >
              NowMe公式アカウントを登録して、分析結果を受け取る
            </h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 6,
                marginBottom: 8,
              }}
            >
              <button
                onClick={() => handleFollow("line")}
                style={{
                  background: "#06C755",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontWeight: 800,
                  cursor: "pointer",
                  minWidth: 140,
                }}
              >
                LINE をフォロー
              </button>

              <button
                onClick={() => handleFollow("x")}
                style={{
                  background: "#111",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontWeight: 800,
                  cursor: "pointer",
                  minWidth: 140,
                }}
              >
                X をフォロー
              </button>

              <button
                onClick={() => handleFollow("insta")}
                style={{
                  background:
                    "linear-gradient(45deg, #f58529, #feda77, #dd2a7b, #8134af, #515bd4)",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontWeight: 800,
                  cursor: "pointer",
                  minWidth: 140,
                }}
              >
                Instagram をフォロー
              </button>
            </div>

            <div style={{ color: "#7a7a7a", fontSize: 12, marginTop: 4 }}>
              ※ フォローボタンを押すと、新しいタブで公式アカウントが開きます。
            </div>

            {/* 次の動作ヒント */}
            {!followed && (
              <div style={{ marginTop: 10, color: "#ef4444", fontSize: 13, fontWeight: 700 }}>
                いずれかの登録ボタンを押すと、分析結果へ進みます。
              </div>
            )}
            {followed && !analysisDone && (
              <div style={{ marginTop: 10, color: "#666", fontSize: 13 }}>
                登録ありがとう！分析が完了し次第、自動で結果画面に進みます…
              </div>
            )}
          </div>
        )}

        {err && <div style={{ color: "#ef4444", marginTop: 14 }}>{err}</div>}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
