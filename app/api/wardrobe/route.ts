import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const FREE_LIMIT = 15
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VALID_CATEGORIES = ['top', 'bottom', 'shoes', 'outerwear', 'accessory']
const VALID_STYLES = ['casual', 'formal', 'sport', 'streetwear', 'traditional']
const VALID_OCCASIONS = ['work', 'casual', 'formal', 'sport', 'outdoor']
const VALID_SEASONS = ['summer', 'winter', 'spring', 'all']

// ========== POST ==========
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    const userId = formData.get('user_id') as string

    if (!file || !userId)
      return NextResponse.json({ error: 'Missing image or user_id' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: 'invalid_file_type' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: 'file_too_large' }, { status: 400 })

    const { count, error: countError } = await supabase
      .from('wardrobe_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) throw countError
    if ((count ?? 0) >= FREE_LIMIT)
      return NextResponse.json({ error: 'limit_reached' }, { status: 403 })

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('wardrobe')
      .upload(fileName, buffer, { contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('wardrobe').getPublicUrl(fileName)
    const imageUrl = urlData.publicUrl

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          {
            type: 'text',
            text: `Analyze this clothing item and return ONLY a JSON object with these fields:
{
  "category": "top" | "bottom" | "shoes" | "outerwear" | "accessory",
  "color": "main color in English",
  "style": "casual" | "formal" | "sport" | "streetwear" | "traditional",
  "occasion": "work" | "casual" | "formal" | "sport" | "outdoor",
  "season": "summer" | "winter" | "spring" | "all"
}
Return only the JSON, no explanation.`
          }
        ]
      }],
      max_tokens: 200,
    })

    const rawContent = aiResponse.choices[0].message.content || '{}'
    const cleanJson = rawContent.replace(/```json|```/g, '').trim()

    const fallback = { category: 'top', color: 'unknown', style: 'casual', occasion: 'casual', season: 'all' }
    let classification = { ...fallback }
    try {
      const parsed = JSON.parse(cleanJson)
      classification = {
        category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : fallback.category,
        color: typeof parsed.color === 'string' && parsed.color ? parsed.color : fallback.color,
        style: VALID_STYLES.includes(parsed.style) ? parsed.style : fallback.style,
        occasion: VALID_OCCASIONS.includes(parsed.occasion) ? parsed.occasion : fallback.occasion,
        season: VALID_SEASONS.includes(parsed.season) ? parsed.season : fallback.season,
      }
    } catch {
      console.warn('AI classification parse failed, using fallback values')
    }

    const { data, error: insertError } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        category: classification.category,
        color: classification.color,
        style: classification.style,
        occasion: classification.occasion,
        season: classification.season,
      })
      .select()
      .single()

    if (insertError) throw insertError
    return NextResponse.json({ success: true, item: data })

  } catch (err: any) {
    console.error('Wardrobe POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ========== GET ==========
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id')
    if (!userId)
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: data })

  } catch (err: any) {
    console.error('Wardrobe GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ========== PATCH: wear_count ✅ ==========
export async function PATCH(req: NextRequest) {
  try {
    const { id, user_id } = await req.json()
    if (!id || !user_id)
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const { data: item, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('wear_count')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !item)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error: updateError } = await supabase
      .from('wardrobe_items')
      .update({
        wear_count: (item.wear_count || 0) + 1,
        last_worn_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user_id)

    if (updateError) throw updateError
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Wardrobe PATCH error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ========== DELETE ==========
export async function DELETE(req: NextRequest) {
  try {
    const { id, user_id } = await req.json()
    if (!id || !user_id)
      return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 })

    const { data: item, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('image_url')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (fetchError) throw fetchError

    const { error: deleteError } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (deleteError) throw deleteError

    if (item?.image_url) {
      try {
        const urlParts = item.image_url.split('/wardrobe/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0]
          await supabase.storage.from('wardrobe').remove([filePath])
        }
      } catch (storageErr) {
        console.warn('Storage delete failed:', storageErr)
      }
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Wardrobe DELETE error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
