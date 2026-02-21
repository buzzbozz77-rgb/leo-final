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
   SYSTEM PROMPT (Optimized)
========================= */
const SYSTEM_PROMPT = `
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
`;

/* =========================
   REQUEST HANDLER
========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body ?? {};

    /* ---------- INPUT VALIDATION ---------- */
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: "Please provide a valid message." },
        { status: 400 }
      );
    }

    /* ---------- SANITIZE ---------- */
    const sanitizedMessage = message.trim().slice(0, 2000);

    /* ---------- SAFE HISTORY ---------- */
    const conversationHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter(
            (m: any) =>
              m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant")
          )
          .map((m: any) => ({
            role: m.role,
            content: m.content.slice(0, 1500),
          }))
      : [];

    /* ---------- OPENAI CALL ---------- */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: sanitizedMessage }
      ],
      temperature: 0.7,
      max_tokens: 700,
      top_p: 0.9,
      frequency_penalty: 0.2,
      presence_penalty: 0.2,
    });

    /* ---------- EXTRACT REPLY ---------- */
    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      null;

    if (!reply) {
      return NextResponse.json(
        { reply: "Unable to generate response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("LEO AI ERROR:", error?.message || error);

    /* ---------- KNOWN ERRORS ---------- */

    if (error?.status === 401) {
      return NextResponse.json(
        { reply: "Authentication error." },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { reply: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    if (error?.status >= 500) {
      return NextResponse.json(
        { reply: "AI service temporarily unavailable." },
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
        { reply: "Network connection issue." },
        { status: 503 }
      );
    }

    /* ---------- FALLBACK ---------- */
    return NextResponse.json(
      { reply: "Unexpected server error." },
      { status: 500 }
    );
  }
}