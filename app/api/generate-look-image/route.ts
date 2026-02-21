import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/* ================= RATE LIMIT ================= */

const RATE_LIMIT = 3;
const WINDOW = 60 * 1000;

const ipMap = new Map<string, { count: number; time: number }>();

function rateLimit(ip: string) {
  const now = Date.now();

  if (!ipMap.has(ip)) {
    ipMap.set(ip, { count: 1, time: now });
    return true;
  }

  const data = ipMap.get(ip)!;

  if (now - data.time > WINDOW) {
    ipMap.set(ip, { count: 1, time: now });
    return true;
  }

  if (data.count >= RATE_LIMIT) {
    return false;
  }

  data.count++;
  return true;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* =========================
   UTIL
========================= */

function safe(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

/* =========================
   HIJAB COLOR MATCHER
========================= */

function resolveHijabColor(outfit: any, description?: string): string {
  const colorSources = [
    outfit?.colors ?? "",
    outfit?.top ?? "",
    outfit?.bottom ?? "",
    description ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // Map dominant outfit colors to complementary hijab colors
  const colorMap: Record<string, string> = {
    black: "soft white or light grey",
    white: "soft beige or ivory",
    navy: "light grey or soft white",
    beige: "warm camel or soft brown",
    brown: "warm cream or soft gold",
    camel: "off-white or warm ivory",
    grey: "charcoal or deep navy",
    cream: "warm taupe or blush rose",
    pink: "dusty rose or soft mauve",
    blush: "ivory or nude beige",
    red: "deep burgundy or soft ivory",
    burgundy: "dusty rose or warm beige",
    green: "sage or soft olive",
    olive: "warm cream or sand",
    blue: "soft white or light grey",
    yellow: "warm white or soft sand",
    orange: "deep brown or warm ivory",
    purple: "lavender or soft grey",
    lavender: "soft white or pale grey",
    gold: "warm ivory or champagne",
    silver: "soft white or pale grey",
    teal: "ivory or soft sand",
    mustard: "warm cream or soft brown",
    cobalt: "soft white or light grey",
    emerald: "warm ivory or champagne",
    coral: "soft blush or ivory",
  };

  for (const [color, hijabColor] of Object.entries(colorMap)) {
    if (colorSources.includes(color)) {
      return hijabColor;
    }
  }

  // Default fallback
  return "soft neutral tone that complements the outfit";
}

/* =========================
   BUILD IMAGE PROMPT
========================= */

function buildImagePrompt(
  outfit: any,
  gender: string,
  description?: string,
  hijab?: boolean,
  age?: number,
  height?: number,
  weight?: number,
  style?: string
) {
  const genderLabel = gender === "female" ? "woman" : "man";

  const isHijabi = gender === "female" && hijab === true;
  const hijabColor = isHijabi ? resolveHijabColor(outfit, description) : "";

  const hijabSentence = isHijabi
    ? `wearing a clearly visible modest hijab in ${hijabColor} color that fully covers the hair and neck, neatly and elegantly draped to complement the outfit,`
    : "";

  const agePart = age ? `aged ${age},` : "";
  const heightPart = height ? `height ${height} cm,` : "";
  const weightPart = weight ? `weight ${weight} kg,` : "";

  const bodyProportions =
    height && weight
      ? `realistic body proportions matching height ${height} cm and weight ${weight} kg,`
      : "";

  const stylePart = style ? `in ${style} fashion style,` : "";

  const outfitDetail = [
    outfit?.top         ? `top: ${outfit.top}`                : "",
    outfit?.bottom      ? `bottom: ${outfit.bottom}`          : "",
    outfit?.shoes       ? `shoes: ${outfit.shoes}`            : "",
    outfit?.fit         ? `fit: ${outfit.fit}`                : "",
    outfit?.colors      ? `colors: ${outfit.colors}`          : "",
    outfit?.accessories ? `accessories: ${outfit.accessories}`: "",
  ]
    .filter(Boolean)
    .join(", ");

  const outfitDescription = description || outfitDetail || "stylish outfit";

  const accessoriesRule = outfit?.accessories
    ? `- ALL accessories (${outfit.accessories}) MUST be clearly visible and rendered in full detail.`
    : "- Do NOT add accessories that are not mentioned.";

  const hijabRule = isHijabi
    ? `- Hijab MUST be clearly visible, neatly draped in ${hijabColor}, and fully covering the hair and neck. Color MUST complement the outfit. This is NON-NEGOTIABLE.`
    : "";

  const prompt = `A realistic full-body fashion editorial photo of a ${genderLabel},
${hijabSentence}
${agePart}
${heightPart}
${weightPart}
${bodyProportions}
wearing ${outfitDescription},
${stylePart}

CAMERA FRAMING:
The shot starts from just below the mid-face — showing the lower portion of the face, chin, and neck clearly.
The shot ends at the very bottom of the feet — both shoes must be FULLY visible with NO cropping.
Full torso, full legs, and complete footwear must all appear in the frame.
Do NOT show the full forehead or top of the head.
Do NOT crop or cut the shoes or feet in any way.

ACCESSORIES:
Every accessory mentioned in the outfit description must appear clearly in the rendered image.
Render accessories with sharp detail — including watches, bags, belts, jewelry, hats, or scarves if mentioned.

OUTFIT FIDELITY:
Render every garment exactly as described — correct type, cut, color, and texture.
Fabric details including stitching, patterns, draping, and material texture must be sharp and realistic.

LIGHTING AND BACKGROUND:
Clean professional studio lighting.
Plain neutral studio background — no props, no distractions.

QUALITY:
Photorealistic render.
Fashion magazine editorial quality.
Ultra sharp.
4K detail level.
Realistic human skin texture.

STRICT RULES:
- Outfit MUST match the description exactly — no substitutions.
- Do NOT change garment type, silhouette, or colors.
- Body proportions MUST realistically reflect height ${height ?? "average"} cm and weight ${weight ?? "average"} kg.
- Shoes MUST be fully visible and uncut at the bottom of the frame.
- Neutral standing pose, arms relaxed naturally at sides.
${accessoriesRule}
${hijabRule}`;

  return prompt.replace(/\n{3,}/g, "\n").trim();
}

/* =========================
   POST
========================= */

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { outfit, gender, description, hijab, age, height, weight, style } = body;

    /* VALIDATION */
    if (!outfit || typeof outfit !== "object")
      return NextResponse.json({ error: "Missing outfit" }, { status: 400 });

    /* PROMPT */
    const prompt = buildImagePrompt(
      outfit,
      gender,
      description,
      hijab,
      age,
      height,
      weight,
      style
    );

    console.log("IMAGE PROMPT:\n", prompt);

    /* IMAGE GENERATION */
    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
    });

    /* SAFE READ */
    const imageData = img?.data?.[0];

    const url =
      imageData?.url ??
      (imageData?.b64_json
        ? `data:image/png;base64,${imageData.b64_json}`
        : null);

    /* FAIL SAFE */
    if (!url)
      return NextResponse.json(
        { error: "Image model returned empty result" },
        { status: 500 }
      );

    /* RESPONSE */
    return NextResponse.json({ url });

  } catch (err) {
    console.error("IMAGE API ERROR:", err);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}