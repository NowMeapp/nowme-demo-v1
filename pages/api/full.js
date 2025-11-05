// pages/api/full.js
import OpenAI from "openai";
import { CATEGORY_COLORS } from "../../lib/categories";

const hasKey = !!process.env.OPENAI_API_KEY;
const client = hasKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TEMP = Number(process.env.OPENAI_TEMP ?? 0.3);

// --- カテゴリ名の正規化 + 絵文字付与（💕は使わず🩷で統一） ---
function normalizeName(raw = "") {
  const s = String(raw)
    .replace(/[💼💰✨🤝⚡🩷🌿]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

  if (/仕事|キャリア|work|career/.test(s)) return "💼仕事・キャリア";
  if (/お金|収入|金|finance|money|income/.test(s)) return "💰お金・収入";
  if (/自己成長|成長|夢|dream|growth/.test(s)) return "✨自己成長・夢";
  if (/人間関係|関係|relationship|relations/.test(s)) return "🤝人間関係";
  if (/感情|メンタル|心理|emotion|mental/.test(s)) return "⚡感情・メンタル";
  if (/恋愛|パートナー|love|partner/.test(s)) return "🩷恋愛・パートナー";
  if (/日常|暮らし|生活|daily|life/.test(s)) return "🌿日常・暮らし";
  return "💼仕事・キャリア"; // fallback
}

// 本文先頭からの自動タイトル（midが欠けたとき用）
function makeFallbackTitle(src = "") {
  const s = String(src).trim().replace(/\s+/g, " ");
  if (!s) return "タイトル（自動）";
  const head = s.split("。")[0] || s.slice(0, 24);
  return head + (s.length > head.length ? "…" : "");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method Not Allowed" });

    const { text = "" } = req.body || {};
    const clipped = String(text).slice(0, 6000);

    if (!hasKey) {
      return res.status(503).json({ error: "OPENAI_API_KEY is missing" });
    }

    // ▼ quick の仕様（高精度カテゴリ/タイトル/コメント）を first-class で要求しつつ、
    //   full 独自の summary / emotions / midTop / keywords / thoughts / hints も同時生成
    const system = `
あなたは日本語の日記を整理するアシスタントです。
入力テキストを次の7カテゴリに分類・要約し、分析結果をJSONだけで返してください（余計なテキスト禁止）。

【カテゴリ（日本語・絵文字なしで指示・モデル出力は最後に正規化）】
仕事・キャリア, お金・収入, 自己成長・夢, 人間関係, 感情・メンタル, 恋愛・パートナー, 日常・暮らし

【返却JSON仕様】
{
  "highLevelCategories": [
    {"name":"仕事・キャリア","ratio":0.6},
    {"name":"自己成長・夢","ratio":0.4}
  ],                       // 上位最大2つ。nameは上記のカテゴリ名、ratioは0〜1（合計1でなくてよい）
  "midCategories": ["友達の転職に焦る"], // 1件。出来事と感情を含む短いタイトル。本文コピペ禁止。
  "aiComment": "その気持ちめっちゃわかるよ。小さく一歩だけ動いてみよう。", // 2行。前半共感＋後半前向きアドバイス。敬語NG。

  "title": "本文を丸写しせず、出来事と感情を一言で表すタイトル(20字以内)",
  "summary": "短い要約(40-80字)",
  "emotions": {"positive":0.0,"neutral":0.0,"negative":0.0},
  "categories": [{"name":"仕事・キャリア"},{"name":"人間関係"}], // 冗長だが互換のため返す
  "midTop": ["評価","将来不安","感謝"],
  "keywords": ["挑戦","安心","負担","頑張る"],
  "thoughts": ["〜の傾向", "〜しがち", "〜に影響されやすい"],   // 🧠 思考のクセ（3件）
  "hints": ["〜を意識しよう…", "〜してみよう…"]              // 💡 ヒント（2件、\\nで補足OK）
}

【制約】
- "midCategories": 1件のみ。本文コピペ禁止。同一フレーズ再掲不可。
- "aiComment": 2行・友達口調（〜だよ/〜してみよう/〜かも 等）。
- "thoughts": 具体的・重複なし・主語省略可・各30字以内。
- "hints": 行動に落とせる提案を2つ。必要なら\\nで短い補足可・各150字以内。
- "categories" / "highLevelCategories" の name は必ず上記7カテゴリ名（絵文字なし）を使用。
- 必ず "thoughts" と "hints" を配列で出力する（空配列禁止）。
`.trim();

    const rsp = await client.chat.completions.create({
      model: MODEL,
      temperature: TEMP,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `テキスト:\n${clipped}` },
      ],
    });

    const raw = rsp.choices?.[0]?.message?.content || "{}";
    const base = JSON.parse(raw);

    // --- highLevelCategories 正規化（emoji 付与 / ratioは使わないので削除） ---
    const hl = Array.isArray(base.highLevelCategories) ? base.highLevelCategories : [];
    const top = hl.slice(0, 2).map(c => ({ name: normalizeName(c?.name) }));
    if (top.length === 0) top.push({ name: "💼仕事・キャリア" });

    // colors（絵文字を除去して COLOR マップ照合）
    const colors = top.map((c) => {
      const clean = c.name.replace(/[💼💰✨🤝⚡🩷🌿]/g, "");
      return CATEGORY_COLORS[clean] || "#ddd";
    });

    // midCategories → title（quick互換）
    const mid = Array.isArray(base.midCategories) ? base.midCategories : [];
    const titleFromMid = mid[0];
    const title =
      (typeof titleFromMid === "string" && titleFromMid.trim()) ||
      (typeof base.title === "string" && base.title.trim()) ||
      makeFallbackTitle(clipped);

    // aiComment（quick互換）
    const aiComment =
      typeof base.aiComment === "string" && base.aiComment.trim()
        ? base.aiComment.trim()
        : "気持ちわかるよ。深呼吸していこう。";

    // thoughts / hints（full固有）
    const thoughts = Array.isArray(base.thoughts) ? base.thoughts.slice(0, 3) : [];
    const hints = Array.isArray(base.hints) ? base.hints.slice(0, 2) : [];

    // 互換用 categories も返す（従来UIで使う場合）
    const categoriesRaw = Array.isArray(base.categories) ? base.categories : [];
    const categories = (categoriesRaw.length ? categoriesRaw : top).slice(0, 2).map((c) => ({
      name: normalizeName(c?.name),
    }));

    // デバッグしたいときはコメントアウト解除
    // console.log("AI RESPONSE:", JSON.stringify(base, null, 2));

    return res.status(200).json({
      // quick互換フィールド
      highLevelCategories: top, // emoji付き
      colors,
      title,
      aiComment,

      // full互換フィールド
      summary: base.summary || "",
      emotions: base.emotions || { positive: 0.33, neutral: 0.34, negative: 0.33 },
      categories,                 // emoji付き（topと同内容）
      midTop: base.midTop || [],
      keywords: base.keywords || [],
      thoughts,                   // 🧠
      hints,                      // 💡
      streak: 1,
      posts: 1,
    });
  } catch (e) {
    console.error("full api error:", e);
    return res.status(500).json({ error: "server error" });
  }
}
