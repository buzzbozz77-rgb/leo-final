import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT = 10;
const WINDOW = 60 * 1000;
const ipMap = new Map<string, { count: number; time: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  if (!ipMap.has(ip)) { ipMap.set(ip, { count: 1, time: now }); return true; }
  const data = ipMap.get(ip)!;
  if (now - data.time > WINDOW) { ipMap.set(ip, { count: 1, time: now }); return true; }
  if (data.count >= RATE_LIMIT) return false;
  data.count++;
  return true;
}

function getXPFromScore(score: number): number {
  if (score >= 9) return 150;
  if (score >= 7) return 100;
  if (score >= 5) return 60;
  return 30;
}

function getCurrentWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

const AR_STYLE: Record<string, string> = {
  "Old Money": "أولد موني", "Streetwear": "ستريت وير", "Minimalist": "مينيماليست",
  "Elegant": "أنيق", "Luxury": "فاخر", "Sporty": "رياضي",
  "Casual": "كاجوال", "Classic": "كلاسيك", "Hybrid": "هجين",
};
const AR_FIT: Record<string, string> = {
  "Oversized": "أوفر سايز", "Tailored": "مفصّل", "Balanced": "متوازن", "Poor": "ضعيف",
};
const AR_COLOR: Record<string, string> = {
  "Muted": "هادئ", "Contrasted": "متباين", "Monochrome": "أحادي اللون",
  "Balanced": "متوازن", "Clashing": "متضارب",
};
const AR_PRESENCE: Record<string, string> = {
  "Weak": "ضعيف", "Average": "متوسط", "Strong": "قوي", "Commanding": "مسيطر",
};
const AR_CONFIDENCE: Record<string, string> = {
  "Low": "منخفض", "Medium": "متوسط", "Strong": "قوي", "Dominant": "مهيمن",
};

function localizeLabels(parsed: any, lang: string) {
  if (lang !== "ar") return parsed;
  return {
    ...parsed,
    styleType:        AR_STYLE[parsed.styleType]             ?? parsed.styleType,
    fitType:          AR_FIT[parsed.fitType]                 ?? parsed.fitType,
    colorProfile:     AR_COLOR[parsed.colorProfile]          ?? parsed.colorProfile,
    presenceRating:   AR_PRESENCE[parsed.presenceRating]     ?? parsed.presenceRating,
    confidenceSignal: AR_CONFIDENCE[parsed.confidenceSignal] ?? parsed.confidenceSignal,
  };
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function calculateNewStreak(lastAnalysisDate: string | null, currentStreak: number): number {
  if (!lastAnalysisDate) return 1;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = new Date(lastAnalysisDate); last.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  if (diffDays === 0) return currentStreak;
  if (diffDays === 1) return currentStreak + 1;
  return 1;
}

function buildPrompt(language: string, gender: string, hijab: boolean): string {
  const userLanguage = language === "ar" ? "Arabic" : "English";
  const isAr = language === "ar";

  const genderContext = gender === "female"
    ? hijab
      ? isAr
        ? `المستخدمة أنثى محجبة. ركّز على تحليل الحجاب (لونه، تناسقه، طريقة لفه، مدى أناقته)، والملابس المناسبة للحجاب. قيّم الإطلالة الكاملة بما يشمل الحجاب كجزء أساسي.`
        : `The user is a hijab-wearing female. Focus on analyzing the hijab (color, harmony, draping style, elegance) and modest clothing. Evaluate the full outfit including the hijab as a core component.`
      : isAr
        ? `المستخدمة أنثى. قيّم الإطلالة من منظور الموضة النسائية الكاملة.`
        : `The user is female. Evaluate the outfit from a full women's fashion perspective.`
    : isAr
      ? `المستخدم ذكر. قيّم الإطلالة من منظور الموضة الرجالية.`
      : `The user is male. Evaluate the outfit from a men's fashion perspective.`;

  return `You are LEO — an elite world-class fashion analyst. Think like a luxury stylist, fashion judge, image consultant, and personal branding expert combined.

${genderContext}

Tone: Brutally honest. Direct. No flattery. Like a top-tier fashion critic who genuinely wants to help this person level up.

SCORING RULES — OUT OF 10:
- 9.0–10: Flawless. Rare.
- 7.5–8.9: Strong look, minor refinements needed.
- 6.0–7.4: Decent foundation but clear issues.
- 4.0–5.9: Multiple problems. Needs significant work.
- Below 4: Serious style issues.
Never give high scores to mediocre looks. Most people score between 5 and 7.5.

Evaluate (each 0–100 for bars, finalScore out of 10):
1. Color Harmony (15%)  2. Fit Accuracy (20%)  3. Proportion Balance (15%)
4. Style Consistency (15%)  5. Detail Level (10%)  6. Presence Impact (25%)

FINAL SCORE: ((presence×25)+(fit×20)+(proportion×15)+(color×15)+(style×15)+(details×10))/1000

Detect:
- STYLE ARCHETYPE: Old Money / Streetwear / Minimalist / Elegant / Luxury / Sporty / Casual / Classic / Hybrid
- FIT TYPE: Oversized / Tailored / Balanced / Poor
- COLOR TYPE: Muted / Contrasted / Monochrome / Balanced / Clashing
- CONFIDENCE SIGNAL: Low / Medium / Strong / Dominant
- PRESENCE RATING: Weak / Average / Strong / Commanding

DETECTED ITEMS — scan the image and list which of these are visible:
top, pants, shoes, accessories, hijab, blazer
Only include items you can actually see.

WEAKEST PIECE — identify the single biggest problem element:
Choose from: top, pants, shoes, accessories, fit, color, hijab, blazer

STYLE IDENTITY — one short label describing the vibe:
Examples: "Clean Casual", "Undefined", "Street Ready", "Old Money", "Needs Identity"

INSTANT UPGRADES — 2-3 very specific, direct, actionable changes:
Example: "Switch to slim-fit dark navy chinos", "Add a leather belt in brown"

RULES: Be specific. Name what you see. 3 actionable priorityFixes. 3 styleImprovements. 2-3 sentence analysis.

Respond ONLY with valid JSON — no markdown, no backticks:
{
  "styleType":"",
  "fitType":"",
  "colorProfile":"",
  "presenceRating":"",
  "confidenceSignal":"",
  "finalScore":0.0,
  "scores":{"color":0,"fit":0,"proportion":0,"style":0,"details":0,"presence":0},
  "analysis":"",
  "priorityFixes":["","",""],
  "styleImprovements":["","",""],
  "weakestPiece":"",
  "styleIdentity":"",
  "instantUpgrades":["",""],
  "detectedItems":["",""]
}

IMPORTANT:
- finalScore: decimal out of 10 (e.g. 7.5)
- scores: 0–100 for bars
- analysis/priorityFixes/styleImprovements/styleIdentity/instantUpgrades in ${userLanguage}
- styleType/fitType/colorProfile/presenceRating/confidenceSignal/weakestPiece/detectedItems in English only
- weakestPiece: single English keyword only (e.g. "pants", "shoes", "fit", "color")
- detectedItems: array of English keywords only from: top, pants, shoes, accessories, hijab, blazer`;
}

function buildItemPrompt(language: string, gender: string, hijab: boolean, item: string): string {
  const userLanguage = language === "ar" ? "Arabic" : "English";
  const isAr = language === "ar";

  const itemLabels: Record<string, { ar: string; en: string }> = {
    top:         { ar: "القطعة العلوية (قميص/تيشيرت/جاكيت)", en: "top piece (shirt/t-shirt/jacket)" },
    pants:       { ar: "البنطلون أو الجزء السفلي",            en: "pants or bottom piece"            },
    shoes:       { ar: "الأحذية",                             en: "shoes/footwear"                   },
    accessories: { ar: "الإكسسوارات (ساعة/حزام/قبعة/إلخ)",   en: "accessories (watch/belt/hat/etc)" },
    hijab:       { ar: "الحجاب",                              en: "hijab"                            },
    blazer:      { ar: "البليزر أو الجاكيت الرسمي",           en: "blazer or formal jacket"          },
  };

  const itemLabel = isAr
    ? (itemLabels[item]?.ar ?? item)
    : (itemLabels[item]?.en ?? item);

  const genderCtx = gender === "female" && hijab
    ? isAr ? "المستخدمة محجبة — راعِ ذلك في التحليل." : "User wears hijab — consider this in analysis."
    : gender === "female"
      ? isAr ? "المستخدمة أنثى." : "User is female."
      : isAr ? "المستخدم ذكر." : "User is male.";

  return `You are LEO — elite fashion analyst. ${genderCtx}

Focus ONLY on the ${isAr ? itemLabel : itemLabel} in this outfit image. Ignore everything else.

Analyze this specific piece with surgical precision:
- What is it exactly? Color, cut, material (if visible), fit
- What's working? What's not?
- Is it right for the overall outfit?

SCORING (out of 10): Be harsh and realistic. Most pieces score 4–7.

DECISION SYSTEM — choose exactly one:
- KEEP: The piece is good. No change needed.
- IMPROVE: The piece has potential but needs specific adjustments.
- REPLACE: This piece is hurting the outfit. It needs to go.

Respond ONLY with valid JSON — no markdown, no backticks:
{"item":"${item}","score":0.0,"comment":"","problem":"","decision":"KEEP","solution":""}

Rules:
- item: exactly "${item}"
- score: decimal out of 10
- comment: 1-2 sentences honest assessment in ${userLanguage}
- problem: the core issue in ONE sentence in ${userLanguage}
- decision: exactly "KEEP" or "IMPROVE" or "REPLACE"
- solution: ONE clear, direct, actionable sentence in ${userLanguage} (e.g. "Switch to slim-fit dark navy chinos")`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { image, language, accessToken, gender, hijab, mode, item } = await req.json();

    if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string | null = null;

    // ─── Registered user: verify token only (no limit check) ───
    if (accessToken) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key missing" }, { status: 500 });

    // ─── Build prompt ─────────────────────────────────────────
    const isItemMode = mode === "item" && item;
    const prompt = isItemMode
      ? buildItemPrompt(language ?? "ar", gender ?? "male", hijab === true, item)
      : buildPrompt(language ?? "ar", gender ?? "male", hijab === true);

    let openaiData: any;
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: isItemMode ? 600 : 1400,
          temperature: 0.3,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}`, detail: "high" } },
            ],
          }],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!openaiRes.ok) {
        const errData = await openaiRes.json().catch(() => ({}));
        return NextResponse.json({ error: "OpenAI API error: " + ((errData as any)?.error?.message ?? openaiRes.statusText) }, { status: 500 });
      }
      openaiData = await openaiRes.json();
    } catch (fetchErr: any) {
      return NextResponse.json({ error: "OpenAI API error: " + (fetchErr?.message ?? "unknown") }, { status: 500 });
    }

    const raw = openaiData?.choices?.[0]?.message?.content ?? "";
    if (!raw) return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 500 });

    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Failed to parse OpenAI response" }, { status: 500 }); }

    // ─── Item mode — return itemResult directly ───────────────
    if (isItemMode) {
      if (parsed.score > 10) parsed.score = parseFloat((parsed.score / 10).toFixed(1));
      return NextResponse.json({ itemResult: parsed });
    }

    // ─── Normalize score ──────────────────────────────────────
    if (parsed.finalScore > 10) {
      parsed.finalScore = parseFloat((parsed.finalScore / 10).toFixed(1));
    }
    parsed = localizeLabels(parsed, language);

    // ─── Track registered user usage ─────────────────────────
    if (accessToken && userId) {
      const { error: insertError } = await supabase.from("analysis_usage").insert({ user_id: userId });
      if (insertError) console.error("Supabase insert error:", insertError.message);
    }

    // ─── XP update (registered users only) ───────────────────
    let xpEarned = 0;
    if (userId && accessToken) {
      try {
        const score    = parsed.finalScore ?? 0;
        const baseXP   = getXPFromScore(score);
        const weekId   = getCurrentWeekId();
        const todayStr = getTodayDateString();

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: profile } = await supabaseAdmin
          .from("profiles").select("total_xp, weekly_points, week_id, streak, last_analysis_date")
          .eq("id", userId).single();

        if (profile) {
          const newStreak = calculateNewStreak(profile.last_analysis_date ?? null, profile.streak ?? 1);
          const streakMultiplier = newStreak >= 7 ? 1.5 : newStreak >= 3 ? 1.2 : 1;
          const finalXP = Math.round(baseXP * streakMultiplier);
          const newTotalXP = (profile.total_xp ?? 0) + finalXP;
          const currentWeeklyPoints = profile.week_id === weekId ? (profile.weekly_points ?? 0) : 0;
          const newLeague = newTotalXP >= 3000 ? "elite" : newTotalXP >= 1500 ? "gold" : newTotalXP >= 500 ? "silver" : "bronze";

          await supabaseAdmin.from("profiles").update({
            total_xp: newTotalXP, weekly_points: currentWeeklyPoints + finalXP,
            week_id: weekId, streak: newStreak, last_analysis_date: todayStr, league: newLeague,
          }).eq("id", userId);

          xpEarned = finalXP;
        }
      } catch (xpErr) { console.error("XP update error:", xpErr); }
    }

    return NextResponse.json({ result: parsed, xpEarned });

  } catch (err: any) {
    console.error("ANALYZE OUTFIT ERROR:", err?.message ?? err);
    return NextResponse.json({ error: "Analysis failed: " + (err?.message ?? "unknown") }, { status: 500 });
  }
}
