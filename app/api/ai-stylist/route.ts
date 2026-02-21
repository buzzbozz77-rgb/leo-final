import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* ================= MEMORY ================= */

const MEMORY_DB = new Map<string, any>();
const RATE_LIMIT = new Map<string, number>();

/* ================= CONSTANTS ================= */

const MAX_INPUT_LENGTH = 120;
const MAX_HISTORY = 25;
const MAX_IMAGE_HISTORY = 10;
const RATE_LIMIT_MS = 1500;
const MAX_SCORE = 200;
const DNA_DISSATISFACTION_THRESHOLD = 0.4;
const DNA_STREAK_THRESHOLD = 3;
const VALID_LANGUAGES = new Set(["ar", "en"]);
const VALID_FEEDBACKS = new Set(["liked", "disliked", null, undefined]);
const VALID_MODES = new Set(["accurate", "normal"]);
const VALID_VARIATIONS = new Set([0, 1]);
const INJECTION_PATTERN = /ignore\s+previous|system\s*:|assistant\s*:|<\s*\/?\s*(system|prompt|instruction)/gi;

/* ================= TYPES ================= */

type Language = "ar" | "en";
type Variation = 0 | 1;

interface OutfitPart {
  top: string;
  bottom: string;
  shoes: string;
  fit: string;
  colors: string;
}

interface ParsedAI {
  outfit: OutfitPart;
  reason: string[];
  note: string;
  accuracy: number;
  confidence: number;
  imagePrompt: string;
}

interface DNA {
  dominantStyle: string;
  boldness: string;
  satisfaction: number;
  experience: number;
  dissatisfactionStreak: number;
  recentMomentum: string;
}

/* ================= UTILS ================= */

function sanitize(input: any): any {
  if (typeof input !== "string") return input;
  const cleaned = input
    .replace(/[<>{}`\\]/g, "")
    .replace(INJECTION_PATTERN, "")
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
  return cleaned;
}

function safeString(val: any, fallback = ""): string {
  if (typeof val !== "string") return fallback;
  const s = val.trim();
  return s.length > 0 ? s : fallback;
}

function safeNumber(val: any, fallback: number, min = 0, max = 100): number {
  const n = Number(val);
  if (!Number.isFinite(n) || isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampScore(val: number): number {
  if (!Number.isFinite(val) || isNaN(val)) return 0;
  return Math.min(MAX_SCORE, Math.max(0, Math.round(val * 10) / 10));
}

function validateOutfit(outfit: any): OutfitPart {
  if (!outfit || typeof outfit !== "object") {
    return { top: "", bottom: "", shoes: "", fit: "", colors: "" };
  }
  return {
    top: safeString(outfit.top),
    bottom: safeString(outfit.bottom),
    shoes: safeString(outfit.shoes),
    fit: safeString(outfit.fit),
    colors: safeString(outfit.colors),
  };
}

function validateReasons(reasons: any): string[] {
  if (!Array.isArray(reasons)) return ["", "", ""];
  return [
    safeString(reasons[0]),
    safeString(reasons[1]),
    safeString(reasons[2]),
  ];
}

function sanitizeHistoryEntry(entry: any): any {
  if (!entry || typeof entry !== "object") return null;
  const occasion = safeString(entry.occasion).slice(0, MAX_INPUT_LENGTH);
  const variation = VALID_VARIATIONS.has(entry.variation) ? entry.variation : 0;
  const feedback = VALID_FEEDBACKS.has(entry.feedback) ? entry.feedback : null;
  if (!occasion) return null;
  return { occasion, variation, feedback };
}

/* ================= SIZE ================= */

function getSize(height: number, weight: number) {
  const h = Math.round(height);
  const w = Math.round(weight);
  if (h < 170 && w < 65) return { eu: "S", us: "S", cn: "M" };
  if (h < 175 && w < 75) return { eu: "M", us: "M", cn: "L" };
  if (h < 180 && w < 85) return { eu: "L", us: "L", cn: "XL" };
  return { eu: "XL", us: "XL", cn: "XXL" };
}

/* ================= SEASON ================= */

function getSeasonByMonth(month: number): string {
  if (month === 11 || month === 0 || month === 1) return "winter";
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  return "autumn";
}

/* ================= DNA ================= */

function buildDNA(profile: any): DNA | null {
  const history = profile?.history;
  if (!Array.isArray(history) || history.length === 0) return null;

  let classic = 0;
  let bold = 0;
  let liked = 0;
  let dissatisfactionStreak = 0;
  let currentStreak = 0;
  const recentWindow = history.slice(-5);
  let recentLiked = 0;

  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    if (!h || typeof h !== "object") continue;
    if (h.variation === 0) classic++;
    else bold++;
    if (h.feedback === "liked") {
      liked++;
      currentStreak = 0;
    } else if (h.feedback === "disliked") {
      currentStreak++;
      if (currentStreak > dissatisfactionStreak) {
        dissatisfactionStreak = currentStreak;
      }
    }
  }

  for (const r of recentWindow) {
    if (r?.feedback === "liked") recentLiked++;
  }

  const total = history.length;
  const satisfaction = total > 0 ? liked / total : 0;
  const recentSatisfaction = recentWindow.length > 0 ? recentLiked / recentWindow.length : satisfaction;
  const recentMomentum = recentSatisfaction >= satisfaction ? "improving" : "declining";

  return {
    dominantStyle: classic >= bold ? "classic" : "modern",
    boldness: bold > classic ? "high" : "low",
    satisfaction: Math.min(1, Math.max(0, satisfaction)),
    experience: total,
    dissatisfactionStreak,
    recentMomentum,
  };
}

/* ================= STYLE EVOLUTION ================= */

function predictNextStyle(dna: DNA | null, variation: number): Variation {
  const base = VALID_VARIATIONS.has(variation as Variation) ? (variation as Variation) : 0;
  if (!dna) return base;
  if (dna.dissatisfactionStreak >= DNA_STREAK_THRESHOLD) return 1;
  if (dna.recentMomentum === "declining" && dna.satisfaction < DNA_DISSATISFACTION_THRESHOLD) return 1;
  if (dna.satisfaction < DNA_DISSATISFACTION_THRESHOLD) return ((base + 1) % 2) as Variation;
  if (dna.boldness === "high") return 1;
  return base;
}

/* ================= PROMPT ================= */

function buildPrompt({
  gender,
  hijab,
  language,
  occasion,
  season,
  mode,
  variation,
  feedback,
  dna,
}: any): string {

  const isAr = language === "ar";

  const base = isAr
    ? `أنت LEO مستشار أزياء عالمي فاخر. تصرف كخبير أزياء راقٍ من مستوى النخبة مع فهم عميق للجماليات والانسجام وعلم الألوان والأقمشة والتناسب والمناسبات.`
    : `You are LEO, an elite global luxury fashion stylist. You think like a senior creative director at a top-tier fashion house — with mastery of color theory, fabric compatibility, silhouette balance, proportion logic, occasion dressing, and seasonal realism.`;

  const languageEnforcement = isAr
    ? `يجب أن يكون الرد باللغة العربية الفصحى الراقية فقط. لا تستخدم أي كلمات إنجليزية داخل النص.`
    : `Respond exclusively in fluent, professional English. Every garment description must be specific — include fabric type, cut, and texture.`;

  const intelligence = mode === "accurate"
    ? isAr
      ? `حلل بعمق شديد. فكر في الانسجام اللوني، توافق الأقمشة، توازن السيلويت، منطق التناسب، واقعية المناسبة والموسم.`
      : `Analyze with expert depth. Reason through color harmony, fabric compatibility, silhouette balance, proportion logic, occasion realism, and seasonal practicality before suggesting.`
    : isAr
      ? `اقترح بسرعة وأناقة مع الحرص على التفاصيل الجوهرية.`
      : `Suggest with speed and precision. Keep descriptions rich but concise.`;

  const style = variation === 0
    ? isAr
      ? `الاتجاه: كلاسيكي أنيق — قطع خالدة، خطوط نظيفة، انسجام محكم.`
      : `Direction: Elegant classic — timeless cuts, clean lines, refined harmony. Avoid trend-dependent pieces.`
    : isAr
      ? `الاتجاه: عصري جريء — خيارات مدروسة من الموضة الراقية الحديثة، تعبيرية وواثقة.`
      : `Direction: Modern bold — considered high-fashion choices with expressive silhouettes and confident styling. Push boundaries intelligently.`;

  const colorHarmony = isAr
    ? `انسجام الألوان: استخدم نظرية الألوان — تناغم، تكامل، أو ألوان متجاورة في الطيف. تجنب التنافر العشوائي.`
    : `Color Harmony: Apply color theory — use analogous, complementary, or tonal palettes. Avoid random clashing. Consider skin tone universality.`;

  const fabricLogic = isAr
    ? `توافق الأقمشة: لا تجمع الأقمشة المتنافرة كالجينز الثقيل مع الحرير. راعِ الموسم والمناسبة.`
    : `Fabric Logic: Never pair incompatible textures — e.g., heavy denim with delicate silk. Match fabric weight to season and occasion formality.`;

  const proportionLogic = isAr
    ? `منطق التناسب: وازن بين القطع الفضفاضة والمحكمة. لا تُركّب قطعتين واسعتين أو محكمتين معاً إلا بقصد أسلوبي واضح.`
    : `Proportion Logic: Balance fitted and relaxed pieces. Avoid pairing two oversized or two skin-tight items unless there is a clear intentional style rationale.`;

  const occasionLogic = isAr
    ? `واقعية المناسبة: يجب أن يكون الزي مناسباً فعلياً للمناسبة المذكورة — ليس فقط جمالياً بل وظيفياً.`
    : `Occasion Realism: The outfit must be genuinely appropriate for the stated occasion — not just aesthetically pleasing but functionally correct.`;

  const seasonLogic = isAr
    ? `واقعية الموسم: اختر الأقمشة، الطبقات، والألوان المناسبة لـ ${season}. تجنب القطع الصيفية في الشتاء والعكس.`
    : `Seasonal Realism: Select fabrics, layering, and palette appropriate for ${season}. No summer-weight fabrics in winter or vice versa.`;

  const hijabBlock = hijab
    ? isAr
      ? `
معايير الحجاب الإلزامية (احترافية فائقة):
- تجنب فتحات الرقبة المنخفضة أو الواسعة تماماً
- لا أكمام قصيرة أو بلا أكمام
- لا أقمشة شفافة أو شبه شفافة
- لا كشف الكتفين أو الرقبة
- لا فتحات أمامية عميقة
- يُفضَّل الأكمام الطويلة والقطع الهيكلية
- انسجم الألوان مع الحجاب بذكاء
- حافظ على الأناقة الراقية في كل حال
- ${variation === 1 ? "يُسمح بالجرأة الأسلوبية عبر الطباعة، التفاصيل، والتصميم الهيكلي الجريء — الأناقة لا حدود لها." : ""}
`
      : `
Hijab Styling Constraints (Professional Fashion Mandate):
- Zero exposed necklines — high necks, turtlenecks, or draped collars only
- No sleeveless — minimum long sleeves; three-quarter is acceptable only in warm formal contexts
- No transparent, sheer, or semi-transparent fabrics
- No shoulder exposure under any circumstances
- No deep or plunging front openings
- Prefer structured, tailored cuts that define silhouette without exposure
- Harmonize outfit colors intelligently with head covering — treat hijab as an intentional design element
- Maintain full luxury styling and elegance — hijab is a design parameter, not a limitation
- ${variation === 1 ? "Bold fashion is fully permitted through pattern, structure, texture, and statement accessories. Hijab-friendly does not mean conservative aesthetics." : ""}
`
    : "";

  const genderLogic = isAr
    ? `التوجيه الجندري: صمم لـ ${gender} مع الأخذ بعين الاعتبار نسب الجسم، الأساليب المعتادة، والتوقعات الثقافية الراقية.`
    : `Gender-Specific Tailoring: Design specifically for ${gender}. Consider body proportions, conventional style hierarchies, and luxury fashion conventions for this gender.`;

  const dnaBlock = dna
    ? isAr
      ? `
الـ DNA الأسلوبي للمستخدم:
- الأسلوب السائد: ${dna.dominantStyle}
- مستوى الجرأة: ${dna.boldness}
- معدل الرضا الكلي: ${Math.round(dna.satisfaction * 100)}%
- زخم الرضا الأخير: ${dna.recentMomentum}
- عدد التجارب: ${dna.experience}
- سلسلة عدم الرضا: ${dna.dissatisfactionStreak}
استخدم هذه البيانات لتطور أسلوبك نحو ما يُرضي المستخدم أكثر.
`
      : `
User Style DNA (use to personalize intelligently):
- Dominant Style: ${dna.dominantStyle}
- Boldness Level: ${dna.boldness}
- Overall Satisfaction Rate: ${Math.round(dna.satisfaction * 100)}%
- Recent Satisfaction Momentum: ${dna.recentMomentum}
- Total Interactions: ${dna.experience}
- Dissatisfaction Streak: ${dna.dissatisfactionStreak}
Shift your approach based on this data. If dissatisfaction is high, change direction meaningfully.
`
    : "";

  const feedbackLine = feedback === "liked"
    ? isAr
      ? "المستخدم أعجبه الاقتراح السابق — عمّق وطور هذا الاتجاه."
      : "User liked the previous suggestion — deepen and elevate that direction."
    : feedback === "disliked"
      ? isAr
        ? "المستخدم لم يعجبه الاقتراح السابق — غيّر الاتجاه بشكل كامل ومدروس."
        : "User disliked the previous suggestion — pivot completely to a meaningfully different direction."
      : "";

  const stylistHierarchy = isAr
    ? `
تسلسل الأولويات الأسلوبية:
1. المناسبة أولاً — التناسب مع السياق إلزامي
2. الانسجام اللوني — الألوان يجب أن تعمل معاً
3. توازن السيلويت — لا يجب أن يثقل أي جزء على الآخر
4. توافق الأقمشة — الملمس والوزن يجب أن يتناسبا
5. الرقي — كل قطعة يجب أن تُضيف قيمة للمظهر الكلي
`
    : `
Styling Hierarchy (apply in this order):
1. Occasion first — contextual appropriateness is non-negotiable
2. Color harmony — palette must work cohesively
3. Silhouette balance — no element should visually overpower
4. Fabric compatibility — texture and weight must align
5. Elegance — every piece must add to the overall visual narrative
`;

  const outputRules = isAr
    ? `
قواعد الإخراج الصارمة:
- أعد JSON فقط — لا نص خارج الـ JSON
- لا markdown، لا شرح، لا مقدمة
- accuracy يجب أن يكون رقماً من 0 إلى 100
- confidence يجب أن يكون رقماً من 0 إلى 100
- كل قطعة ملبس يجب أن تكون محددة — تشمل نوع القماش، القصة، اللون
- reason يجب أن يشرح منطق التنسيق بعمق، لا مجرد وصف
- imagePrompt يجب أن يكون وصفاً بصرياً احترافياً باللغة الإنجليزية لتوليد صورة
`
    : `
Strict Output Rules:
- Return ONLY valid JSON — zero text outside the JSON object
- No markdown, no explanation, no preamble
- accuracy must be a number 0–100 reflecting how well this outfit fits the brief
- confidence must be a number 0–100 reflecting your certainty in this recommendation
- Each outfit piece must be specific — include fabric type, cut, and color
- Each reason entry must explain the styling logic intelligently, not just describe the item
- imagePrompt must be a professional English visual prompt for image generation depicting the complete outfit on a model
`;

  return `
${base}
${languageEnforcement}

${intelligence}
${style}

Occasion: ${occasion}
Season: ${season}
Gender: ${gender}

${colorHarmony}
${fabricLogic}
${proportionLogic}
${occasionLogic}
${seasonLogic}
${genderLogic}
${hijabBlock}
${stylistHierarchy}
${dnaBlock}
${feedbackLine}

${outputRules}

JSON FORMAT:
{
 "outfit":{
   "top":"string",
   "bottom":"string",
   "shoes":"string",
   "fit":"string",
   "colors":"string"
 },
 "reason":["string","string","string"],
 "note":"string",
 "accuracy":0,
 "confidence":0,
 "imagePrompt":"string"
}
`.trim();
}

/* ================= POST ================= */

export async function POST(req: NextRequest) {
  try {

    const ip = req.headers.get("x-forwarded-for") || "local";

    /* RATE LIMIT */
    const now = Date.now();
    const last = RATE_LIMIT.get(ip) || 0;
    if (now - last < RATE_LIMIT_MS) {
      return NextResponse.json({ error: "Too fast" }, { status: 429 });
    }
    RATE_LIMIT.set(ip, now);

    /* BODY */
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const rawFeedback = body.feedback ?? null;
    const feedback = VALID_FEEDBACKS.has(rawFeedback) ? rawFeedback : null;
    const userId = sanitize(safeString(body.userId, "guest")).slice(0, 64) || "guest";

    let gender = sanitize(body.gender);
    let occasion = sanitize(body.occasion);
    let language = sanitize(body.language);
    const hijab = body.hijab === true;

    const rawHeight = body.height;
    const rawWeight = body.weight;
    const rawMode = sanitize(body.mode);
    const rawVariation = body.variation;
    const clientSeason = sanitize(body.season);

    /* VALIDATE LANGUAGE */
    if (!VALID_LANGUAGES.has(language)) {
      language = "en";
    }

    /* VALIDATE MODE */
    const mode = VALID_MODES.has(rawMode) ? rawMode : "normal";

    /* VALIDATE VARIATION */
    const variation: Variation = VALID_VARIATIONS.has(rawVariation) ? rawVariation : 0;

    /* VALIDATE REQUIRED */
    gender = safeString(gender);
    occasion = safeString(occasion);

    if (!gender || !occasion || !language) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    /* MEMORY LOAD + SANITIZE */
    const rawProfile = MEMORY_DB.get(userId);
    const profile: any = { history: [] };
    if (rawProfile && typeof rawProfile === "object" && Array.isArray(rawProfile.history)) {
      for (const entry of rawProfile.history) {
        const safe = sanitizeHistoryEntry(entry);
        if (safe) profile.history.push(safe);
        if (profile.history.length >= MAX_HISTORY) break;
      }
    }

    /* DNA */
    const dna = buildDNA(profile);

    /* EVOLUTION */
    const evolvedVariation = predictNextStyle(dna, variation);

    /* SIZE */
    const h = Number(rawHeight);
    const w = Number(rawWeight);
    const hasMeasurements = Number.isFinite(h) && Number.isFinite(w) && h > 0 && w > 0 && h < 300 && w < 500;
    const size = hasMeasurements ? getSize(h, w) : null;

    const month = new Date().getMonth();
    const season = safeString(clientSeason) || getSeasonByMonth(month);

    /* PROMPT */
    const prompt = buildPrompt({
      gender,
      hijab,
      language,
      occasion,
      season,
      mode,
      variation: evolvedVariation,
      feedback,
      dna,
    });

    /* GPT CALL */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: mode === "accurate" ? 0.4 : 0.7,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });

    /* SAFE PARSE */
    let parsed: any;
    try {
      const raw = completion.choices?.[0]?.message?.content || "{}";
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid AI JSON" }, { status: 500 });
    }

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json({ error: "Invalid AI JSON" }, { status: 500 });
    }

    /* VALIDATE PARSED FIELDS */
    const outfit = validateOutfit(parsed.outfit);
    const reasons = validateReasons(parsed.reason);
    const note = safeString(parsed.note);
    const accuracy = safeNumber(parsed.accuracy, 70, 0, 100);
    const confidence = safeNumber(parsed.confidence, 70, 0, 100);
    const imagePromptRaw = safeString(parsed.imagePrompt).slice(0, 500);

    /* IMAGE GENERATION */
    let image: string | null = null;
    if (imagePromptRaw && profile.history.length < MAX_IMAGE_HISTORY) {
      try {
        const img = await openai.images.generate({
          model: "gpt-image-1",
          prompt: imagePromptRaw,
          size: "512x512",
        });
        image = img.data?.[0]?.url || null;
      } catch {
        image = null;
      }
    }

    /* MEMORY SAVE */
    profile.history.push({
      occasion,
      variation: evolvedVariation,
      feedback,
    });

    if (profile.history.length > MAX_HISTORY) {
      profile.history.shift();
    }

    MEMORY_DB.set(userId, profile);

    /* SCORE — deterministic, bounded, NaN-safe */
    const experienceBonus = Math.min(dna?.experience || 0, 30);
    const satisfactionBonus = dna ? Math.round(dna.satisfaction * 10) : 0;
    const rawScore =
      accuracy * 0.6 +
      confidence * 0.4 +
      experienceBonus +
      satisfactionBonus;
    const score = clampScore(rawScore);

    /* TEXT */
    const topVal = outfit.top || (language === "ar" ? "—" : "—");
    const bottomVal = outfit.bottom || (language === "ar" ? "—" : "—");
    const shoesVal = outfit.shoes || (language === "ar" ? "—" : "—");
    const fitVal = outfit.fit || (language === "ar" ? "—" : "—");
    const colorsVal = outfit.colors || (language === "ar" ? "—" : "—");

    const textFormatted = language === "ar"
      ? `الجزء العلوي: ${topVal}\nالسفلي: ${bottomVal}\nالحذاء: ${shoesVal}\nالقَصّة: ${fitVal}\nالألوان: ${colorsVal}\n\nلماذا:\n- ${reasons[0]}\n- ${reasons[1]}\n- ${reasons[2]}\n\nملاحظة:\n${note}`
      : `Top: ${topVal}\nBottom: ${bottomVal}\nShoes: ${shoesVal}\nFit: ${fitVal}\nColors: ${colorsVal}\n\nWhy:\n- ${reasons[0]}\n- ${reasons[1]}\n- ${reasons[2]}\n\nNote:\n${note}`;

    const finalText = hasMeasurements && size
      ? language === "ar"
        ? `المقاس\nEU:${size.eu} US:${size.us} CN:${size.cn}\n${textFormatted}`
        : `Size\nEU:${size.eu} US:${size.us} CN:${size.cn}\n${textFormatted}`
      : textFormatted;

    /* RESPONSE */
    return NextResponse.json({
      text: finalText,
      outfit,
      accuracy,
      confidence,
      score,
      image,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}