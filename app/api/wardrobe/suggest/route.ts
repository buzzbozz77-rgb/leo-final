import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

async function getWeather(city: string) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    )
    const data = await res.json()
    if (!data.main) throw new Error('No weather data')
    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      description: data.weather?.[0]?.description ?? 'clear sky',
      humidity: data.main.humidity,
    }
  } catch {
    return { temp: 20, feels_like: 20, description: 'clear sky', humidity: 50 }
  }
}

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function calcClosetScore(items: any[]): number {
  if (items.length === 0) return 0
  const categories = ['top', 'bottom', 'shoes', 'outerwear', 'accessory']
  const present = categories.filter(c => items.some(i => i.category === c)).length
  const balanceScore = (present / categories.length) * 25
  const colors = new Set(items.map(i => i.color?.toLowerCase())).size
  const colorScore = Math.min(colors / 5, 1) * 15
  const totalWears = items.reduce((s: number, i: any) => s + (i.wear_count || 0), 0)
  const avgWear = items.length > 0 ? totalWears / items.length : 0
  const usageScore = Math.min(avgWear / 5, 1) * 25
  const countScore = Math.min(items.length / 15, 1) * 15
  const neglected = items.filter(i => getDaysSince(i.last_worn_at) >= 14).length
  const neglectPenalty = Math.min((neglected / Math.max(items.length, 1)) * 20, 20)
  const neverWorn = items.filter(i => i.wear_count === 0).length
  const diversityBonus = Math.max(0, 20 - (neverWorn / Math.max(items.length, 1)) * 20)
  const raw = balanceScore + colorScore + usageScore + countScore + diversityBonus - neglectPenalty
  return Math.round(Math.min(Math.max(raw, 0), 100)) / 10
}

// ─── حساب style_score بشكل واقعي من الـ backend ─────────────
function calcOutfitScore(selectedItems: any[], weather: any, occasion: string): number {
  if (selectedItems.length === 0) return 50

  let score = 60 // base

  // ─── Color harmony ───────────────────────────────────────
  const colors = selectedItems.map(i => i.color?.toLowerCase() ?? '')
  const uniqueColors = new Set(colors).size
  if (uniqueColors === 1) score += 10        // monochrome — clean
  else if (uniqueColors === 2) score += 15   // 2 colors — ideal
  else if (uniqueColors === 3) score += 8    // 3 colors — acceptable
  else score -= 5                            // too many colors

  // ─── Category completeness ───────────────────────────────
  const cats = selectedItems.map(i => i.category)
  const hasTop = cats.includes('top')
  const hasBottom = cats.includes('bottom')
  const hasShoes = cats.includes('shoes')
  const hasOuterwear = cats.includes('outerwear')
  const hasAccessory = cats.includes('accessory')

  if (hasTop && hasBottom) score += 10
  if (hasShoes) score += 8
  if (hasOuterwear) score += 5
  if (hasAccessory) score += 4

  // ─── Occasion match ──────────────────────────────────────
  const occasionMatchCount = selectedItems.filter(i =>
    i.occasion === occasion || i.occasion === 'casual'
  ).length
  score += Math.min(occasionMatchCount * 3, 9)

  // ─── Weather bonus ───────────────────────────────────────
  const temp = weather.temp
  if (temp <= 15) {
    // Cold — bonus for outerwear
    if (hasOuterwear) score += 5
    else score -= 3
  } else if (temp >= 30) {
    // Hot — penalize heavy layers
    if (hasOuterwear) score -= 4
    else score += 3
  }

  // ─── Usage diversity bonus ───────────────────────────────
  const avgWear = selectedItems.reduce((s, i) => s + (i.wear_count || 0), 0) / selectedItems.length
  if (avgWear === 0) score += 8       // never-worn items get love
  else if (avgWear <= 2) score += 5   // rarely-worn
  else if (avgWear >= 10) score -= 3  // overused

  // ─── Neglected item bonus ────────────────────────────────
  const hasNeglected = selectedItems.some(i => getDaysSince(i.last_worn_at) >= 14)
  if (hasNeglected) score += 6

  return Math.min(Math.max(Math.round(score), 30), 99)
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, occasion = 'casual', city, lang = 'ar', forced_item_id, fix_mode } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const { data: items, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user_id)

    if (error) throw error
    if (!items || items.length < 2) {
      return NextResponse.json({ error: 'not_enough_items' }, { status: 400 })
    }

    const weather = city
      ? await getWeather(city)
      : { temp: 20, feels_like: 20, description: 'clear sky', humidity: 50 }

    const isAr = lang === 'ar'
    const closetScore = calcClosetScore(items)

    // ─── Missing categories ───────────────────────────────────
    const presentCategories = new Set(items.map((i: any) => i.category))
    const allCategories = ['top', 'bottom', 'shoes', 'outerwear', 'accessory']
    const missingCategories = allCategories.filter(c => !presentCategories.has(c))

    // ─── Recently worn (last 3 days) ──────────────────────────
    const recentlyWornIds = items
      .filter((i: any) => getDaysSince(i.last_worn_at) <= 3)
      .map((i: any) => i.id)

    // ─── Sort: forced first → neglected → never worn → rest ──
    const sortedItems = [...items].sort((a: any, b: any) => {
      if (forced_item_id) {
        if (a.id === forced_item_id) return -1
        if (b.id === forced_item_id) return 1
      }
      const daysA = getDaysSince(a.last_worn_at)
      const daysB = getDaysSince(b.last_worn_at)
      const scoreA = (daysA >= 14 ? daysA * 3 : daysA) + (a.wear_count === 0 ? 500 : 0)
      const scoreB = (daysB >= 14 ? daysB * 3 : daysB) + (b.wear_count === 0 ? 500 : 0)
      return scoreB - scoreA
    })

    const itemsSummary = sortedItems.map((item: any) => ({
      id: item.id,
      category: item.category,
      color: item.color,
      style: item.style,
      occasion: item.occasion,
      season: item.season,
      wear_count: item.wear_count || 0,
      days_since_worn: getDaysSince(item.last_worn_at),
      is_neglected: getDaysSince(item.last_worn_at) >= 14,
      never_worn: item.wear_count === 0,
      recently_worn: recentlyWornIds.includes(item.id),
    }))

    const imageContent: any[] = sortedItems.map((item: any) => ({
      type: 'image_url',
      image_url: { url: item.image_url, detail: 'low' },
    }))

    const forcedNote = forced_item_id
      ? isAr
        ? `\nإلزامي: يجب أن تتضمن الإطلالة القطعة id="${forced_item_id}". لا خيار آخر.`
        : `\nMANDATORY: Outfit MUST include item id="${forced_item_id}". No exceptions.`
      : ''

    const missingNote = missingCategories.length > 0
      ? isAr
        ? `\nفئات ناقصة: ${missingCategories.join(', ')}`
        : `\nMissing categories: ${missingCategories.join(', ')}`
      : ''

    const fixModeNote = fix_mode
      ? isAr
        ? `\nوضع Fix: قرار واضح — ماذا يلبس مع هذه القطعة وكيف يحسن خزانته.`
        : `\nFix mode: Give clear actionable advice on what to wear with this piece.`
      : ''

    const weatherContext = `${weather.temp}°C, ${weather.description}`
    const isHot = weather.temp >= 28
    const isCold = weather.temp <= 15
    const weatherNote = isHot
      ? isAr ? 'الجو حار — تجنب الطبقات الثقيلة' : 'Hot weather — avoid heavy layers'
      : isCold
      ? isAr ? 'الجو بارد — الطبقات والمعاطف مناسبة' : 'Cold weather — layers and outerwear welcome'
      : isAr ? 'الجو معتدل — أي إطلالة مناسبة' : 'Mild weather — any outfit works'

    const prompt = `You are a professional fashion stylist. I'm showing you ${sortedItems.length} wardrobe items.

WEATHER: ${weatherContext} — ${weatherNote}
OCCASION: ${occasion}
CLOSET HEALTH: ${closetScore}/10
${forcedNote}${fixModeNote}

Items (with metadata):
${JSON.stringify(itemsSummary, null, 2)}

SELECTION RULES (follow strictly):
1. Pick 2-4 items that look great together visually
2. MUST have: top + bottom (minimum)
3. NEVER pick recently_worn: true items if alternatives exist
4. PRIORITIZE never_worn: true items first, then is_neglected: true
5. Match the occasion and weather
6. Pick items whose colors harmonize (neutrals + one accent, or monochrome)
${missingNote}

Write outfit_name, reason, weather_tip in ${isAr ? 'Arabic' : 'English'}.
Do NOT include style_score in your response — it will be calculated separately.

Return ONLY valid JSON, no markdown:
{
  "selected_ids": ["id1", "id2"],
  "outfit_name": "...",
  "reason": "...",
  "weather_tip": "...",
  "missing_pieces": []
}`

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: prompt },
        ],
      }],
      max_tokens: 600,
    })

    const rawContent = aiResponse.choices[0].message.content || '{}'
    const cleanJson = rawContent.replace(/```json|```/g, '').trim()

    let suggestion: any
    try {
      suggestion = JSON.parse(cleanJson)
    } catch {
      const firstTop = items.find((i: any) => i.category === 'top')
      const firstBottom = items.find((i: any) => i.category === 'bottom')
      suggestion = {
        selected_ids: [firstTop?.id, firstBottom?.id].filter(Boolean),
        outfit_name: isAr ? 'إطلالة اليوم' : "Today's Outfit",
        reason: isAr ? 'تم اختيار هذه القطع بناءً على خزانتك.' : 'Selected based on your wardrobe.',
        weather_tip: isAr ? 'مناسبة للطقس الحالي.' : 'Suitable for current weather.',
        missing_pieces: [],
      }
    }

    if (!Array.isArray(suggestion.missing_pieces)) {
      suggestion.missing_pieces = []
    }

    // ─── Filter selected items ────────────────────────────────
    const selectedItems = items.filter((item: any) =>
      suggestion.selected_ids?.includes(item.id)
    )
    if (selectedItems.length === 0) {
      const top = items.find((i: any) => i.category === 'top')
      const bottom = items.find((i: any) => i.category === 'bottom')
      if (top) selectedItems.push(top)
      if (bottom) selectedItems.push(bottom)
    }

    // ─── Calculate style_score on the backend — realistic ────
    const styleScore = calcOutfitScore(selectedItems, weather, occasion)

    return NextResponse.json({
      success: true,
      suggestion: {
        ...suggestion,
        style_score: styleScore,
        items: selectedItems,
        weather,
        closet_score: closetScore,
      },
    })

  } catch (err: any) {
    console.error('Suggest error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}