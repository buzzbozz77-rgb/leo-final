import { NextResponse } from "next/server";
import OpenAI from "openai";

/* =========================
   ENV VALIDATION
========================= */
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   RATE LIMITING
========================= */
// ✅ FIX #1: Rate limiting عشان نحمي الـ API من الـ abuse
// كل IP يقدر يرسل MAX_REQUESTS_PER_WINDOW request كل WINDOW_MS
const RATE_LIMIT_MAP = new Map<string, { count: number; windowStart: number }>();
const MAX_REQUESTS_PER_WINDOW = 20;       // أقصى عدد requests
const WINDOW_MS = 60 * 1000;             // كل دقيقة
const RATE_LIMIT_CLEANUP_MS = 5 * 60 * 1000; // تنظيف الـ map كل 5 دقائق

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);

  // تنظيف دوري بنسبة 5% من الـ requests
  if (Math.random() < 0.05) {
    for (const [key, val] of RATE_LIMIT_MAP.entries()) {
      if (now - val.windowStart > RATE_LIMIT_CLEANUP_MS) {
        RATE_LIMIT_MAP.delete(key);
      }
    }
  }

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // نافذة جديدة
    RATE_LIMIT_MAP.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // تجاوز الحد
  }

  entry.count++;
  return true;
}

/* =========================
   CONSTANTS
========================= */
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CONTENT_LENGTH = 1500;
// ✅ FIX #2: حد إجمالي للـ history عشان ما نرسل كثير للـ API
const MAX_TOTAL_HISTORY_CHARS = 8000;

/* =========================
   SYSTEM PROMPT
========================= */
// ✅ FIX #3: حولناه لـ function عشان يكون قابل للتخصيص مستقبلاً
function buildSystemPrompt(): string {
  return `
You are LEO, an elite luxury fashion stylist AI.

IDENTITY
- World-class luxury stylist
- Sophisticated, confident, precise
- Think like a celebrity stylist

LANGUAGE RULE (STRICT)
- Always reply in the SAME language as user
- Arabic → Arabic (formal)
- English → English
- Never mix languages
- Never translate unless asked

STYLING INTELLIGENCE
- Prioritize timeless elegance over trends
- Give specific pieces, colors, fabrics, cuts
- Suggest complete outfits
- Include accessories when relevant
- Tailor suggestions to context

RESPONSE STYLE
- Concise but premium
- Confident tone
- Specific not generic
- 2–4 sentences ideal
- Personalize responses

QUALITY EXAMPLE
Bad: Try dark colors
Good: Wear a charcoal wool blazer with navy trousers and a crisp white Oxford shirt for a sharp refined silhouette.

You are not giving advice.
You are delivering a luxury styling experience.
`.trim();
}

/* =========================
   ERROR MESSAGES
========================= */
// ✅ FIX #5: رسائل الخطأ بالعربي والإنجليزي
const ERROR_MESSAGES = {
  invalidMessage: {
    ar: "من فضلك أرسل رسالة صحيحة.",
    en: "Please provide a valid message.",
  },
  rateLimit: {
    ar: "طلبات كثيرة جداً. انتظر دقيقة وحاول مجدداً.",
    en: "Too many requests. Please wait a minute and try again.",
  },
  noReply: {
    ar: "تعذر توليد الرد. حاول مجدداً.",
    en: "Unable to generate response. Please try again.",
  },
  auth: {
    ar: "خطأ في المصادقة.",
    en: "Authentication error.",
  },
  tooManyRequests: {
    ar: "الخدمة مشغولة. أبطئ قليلاً.",
    en: "Too many requests. Please slow down.",
  },
  serviceUnavailable: {
    ar: "الخدمة غير متاحة مؤقتاً.",
    en: "AI service temporarily unavailable.",
  },
  network: {
    ar: "مشكلة في الاتصال بالشبكة.",
    en: "Network connection issue.",
  },
  unexpected: {
    ar: "خطأ غير متوقع في الخادم.",
    en: "Unexpected server error.",
  },
};

function getErrorMsg(key: keyof typeof ERROR_MESSAGES, lang: "ar" | "en"): string {
  return ERROR_MESSAGES[key][lang];
}

function detectLang(message: string): "ar" | "en" {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(message) ? "ar" : "en";
}

/* =========================
   REQUEST HANDLER
========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body ?? {};

    // ✅ FIX #5: نكتشف اللغة أول شي عشان نرجع الأخطاء بنفس اللغة
    const lang = detectLang(typeof message === "string" ? message : "");

    /* ---------- INPUT VALIDATION ---------- */
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: getErrorMsg("invalidMessage", lang) },
        { status: 400 }
      );
    }

    /* ---------- RATE LIMIT ---------- */
    // ✅ FIX #1: تطبيق الـ rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { reply: getErrorMsg("rateLimit", lang) },
        { status: 429 }
      );
    }

    /* ---------- SANITIZE ---------- */
    const sanitizedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);

    /* ---------- SAFE HISTORY ---------- */
    // ✅ FIX #2: نحسب الـ total chars ونوقف لو تجاوزنا الحد
    let totalChars = 0;
    const conversationHistory = Array.isArray(history)
      ? history
          .slice(-MAX_HISTORY_MESSAGES)
          .filter(
            (m: any) =>
              m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant")
          )
          .map((m: any) => ({
            role: m.role,
            content: m.content.slice(0, MAX_HISTORY_CONTENT_LENGTH),
          }))
          .filter((m) => {
            totalChars += m.content.length;
            return totalChars <= MAX_TOTAL_HISTORY_CHARS;
          })
      : [];

    /* ---------- OPENAI CALL ---------- */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...conversationHistory,
        { role: "user", content: sanitizedMessage },
      ],
      temperature: 0.7,
      max_tokens: 700,
      top_p: 0.9,
      frequency_penalty: 0.2,
      presence_penalty: 0.2,
    });

    /* ---------- EXTRACT REPLY ---------- */
    const reply = completion.choices?.[0]?.message?.content?.trim() || null;

    if (!reply) {
      return NextResponse.json(
        { reply: getErrorMsg("noReply", lang) },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("LEO AI ERROR:", error?.message || error);

    const lang = "en"; // fallback للـ catch لأننا ما عندنا access للـ message

    /* ---------- KNOWN ERRORS ---------- */
    if (error?.status === 401) {
      return NextResponse.json(
        { reply: getErrorMsg("auth", lang) },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { reply: getErrorMsg("tooManyRequests", lang) },
        { status: 429 }
      );
    }

    // ✅ FIX #4: typeof check عشان ما نقع بمشكلة undefined >= 500
    if (typeof error?.status === "number" && error.status >= 500) {
      return NextResponse.json(
        { reply: getErrorMsg("serviceUnavailable", lang) },
        { status: 503 }
      );
    }

    /* ---------- NETWORK ERRORS ---------- */
    if (
      error?.code === "ECONNREFUSED" ||
      error?.code === "ENOTFOUND" ||
      error?.code === "ETIMEDOUT"
    ) {
      return NextResponse.json(
        { reply: getErrorMsg("network", lang) },
        { status: 503 }
      );
    }

    /* ---------- FALLBACK ---------- */
    return NextResponse.json(
      { reply: getErrorMsg("unexpected", lang) },
      { status: 500 }
    );
  }
}
