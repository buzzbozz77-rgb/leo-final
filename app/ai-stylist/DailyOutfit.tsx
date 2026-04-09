'use client'

import { useState } from 'react'

interface WeatherData {
  temp: number
  feels_like: number
  description: string
  humidity: number
}

interface SuggestionItem {
  id: string
  image_url: string
  category: string
  color: string
  style: string
  wear_count?: number
  last_worn_at?: string | null
}

interface MissingPiece {
  category: string
  suggestion: string
}

interface Suggestion {
  selected_ids: string[]
  outfit_name: string
  reason: string
  weather_tip: string
  style_score: number
  items: SuggestionItem[]
  weather: WeatherData
  missing_pieces?: MissingPiece[]
}

interface DailyOutfitProps {
  username: string
  city: string | null
  lang?: 'ar' | 'en'
  onXpGain?: (amount: number) => void
}

const DT = {
  ar: {
    title: 'إطلالة اليوم',
    subtitle: 'AI يشوف قطعك ويختار الأحلى حسب الطقس والمناسبة',
    btnGenerate: '✨ اقترح إطلالة اليوم',
    btnLoading: 'AI يشوف قطعك ويختار...',
    btnRetry: '🔄 اقترح إطلالة ثانية',
    btnWear: '👕 البسها اليوم (+10 XP)',
    btnWearing: '✓ تم التسجيل',
    whyTitle: '💡 ليش هالإطلالة؟',
    weatherTip: '🌡️',
    notEnough: 'أضف أكثر من قطعة للخزانة عشان أقترح إطلالة 👕',
    genericError: 'حصل خطأ، حاول مرة ثانية',
    yourCity: 'مدينتك',
    styleLabel: 'Style',
    missingTitle: '🛍️ ناقص عندك',
    missingSubtitle: 'قطع تحسّن إطلالتك',
    wornTimes: (n: number) => `لُبس ${n} مرة`,
    lastWorn: (d: number) => d === 0 ? 'لُبست اليوم' : `آخر لبسة: ${d} يوم`,
    bestChoice: '🔥 الأفضل اليوم',
    inAppNotif: '💡 إطلالة جديدة جاهزة ليك اليوم!',
    occasions: [
      { value: 'casual',  label: 'كاجوال', icon: '😎' },
      { value: 'work',    label: 'عمل',     icon: '💼' },
      { value: 'formal',  label: 'رسمي',    icon: '🎩' },
      { value: 'sport',   label: 'رياضي',   icon: '🏃' },
      { value: 'outdoor', label: 'خارجي',   icon: '🌿' },
    ],
    categoryLabels: {
      top: 'علوي', bottom: 'سفلي', shoes: 'أحذية',
      outerwear: 'جاكيت', accessory: 'إكسسوار',
    } as Record<string, string>,
  },
  en: {
    title: "Today's Outfit",
    subtitle: 'AI picks the best look from your wardrobe based on weather & occasion',
    btnGenerate: "✨ Suggest Today's Outfit",
    btnLoading: 'AI is picking your look...',
    btnRetry: '🔄 Suggest Another Outfit',
    btnWear: '👕 Wear This Today (+10 XP)',
    btnWearing: '✓ Logged',
    whyTitle: '💡 Why this outfit?',
    weatherTip: '🌡️',
    notEnough: 'Add more items to your wardrobe so AI can suggest an outfit 👕',
    genericError: 'Something went wrong, please try again',
    yourCity: 'Your city',
    styleLabel: 'Style',
    missingTitle: "🛍️ You're Missing",
    missingSubtitle: 'Pieces that would upgrade your look',
    wornTimes: (n: number) => `Worn ${n}×`,
    lastWorn: (d: number) => d === 0 ? 'Worn today' : `Last worn: ${d}d ago`,
    bestChoice: '🔥 Best choice today',
    inAppNotif: '💡 A fresh outfit suggestion is ready for you today!',
    occasions: [
      { value: 'casual',  label: 'Casual',  icon: '😎' },
      { value: 'work',    label: 'Work',    icon: '💼' },
      { value: 'formal',  label: 'Formal',  icon: '🎩' },
      { value: 'sport',   label: 'Sport',   icon: '🏃' },
      { value: 'outdoor', label: 'Outdoor', icon: '🌿' },
    ],
    categoryLabels: {
      top: 'Top', bottom: 'Bottom', shoes: 'Shoes',
      outerwear: 'Jacket', accessory: 'Accessory',
    } as Record<string, string>,
  },
}

const weatherIcon = (desc: string) => {
  if (desc.includes('rain'))  return '🌧️'
  if (desc.includes('cloud')) return '☁️'
  if (desc.includes('snow'))  return '❄️'
  if (desc.includes('storm')) return '⛈️'
  return '☀️'
}

function getGridCols(count: number) {
  if (count === 1) return '1fr'
  if (count === 2) return '1fr 1fr'
  return 'repeat(3, 1fr)'
}

function getDaysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export default function DailyOutfit({ username, city, lang = 'ar', onXpGain }: DailyOutfitProps) {
  const t = DT[lang]
  const isRTL = lang === 'ar'

  const [occasion, setOccasion] = useState('casual')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wearing, setWearing] = useState(false)
  const [worn, setWorn] = useState(false)
  const [showInAppNotif, setShowInAppNotif] = useState(true)

  async function getSuggestion() {
    setLoading(true)
    setError(null)
    setSuggestion(null)
    setWorn(false)

    try {
      const res = await fetch('/api/wardrobe/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: username, occasion, city }),
      })
      const data = await res.json()
      if (data.error === 'not_enough_items') { setError(t.notEnough); return }
      if (!data.success) throw new Error(data.error)
      setSuggestion(data.suggestion)
      setShowInAppNotif(false)
    } catch {
      setError(t.genericError)
    } finally {
      setLoading(false)
    }
  }

  // ─── Wear This — يسجل كل قطعة في الإطلالة ───────────────────
  async function handleWearThis() {
    if (!suggestion || wearing || worn) return
    setWearing(true)
    try {
      await Promise.all(
        suggestion.items.map(item =>
          fetch('/api/wardrobe/wear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, user_id: username }),
          })
        )
      )
      setWorn(true)
      if (onXpGain) onXpGain(10)
    } catch (err) { console.error(err) }
    finally { setWearing(false) }
  }

  return (
    <div className="mb-8" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── In-App Notification Banner ─── */}
      {showInAppNotif && !suggestion && (
        <div style={{
          background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 12, padding: '10px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#D4AF37', fontSize: 13 }}>{t.inAppNotif}</span>
          <button
            onClick={() => setShowInAppNotif(false)}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        </div>
      )}

      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a, #111)',
        border: '1px solid rgba(212,175,55,0.35)',
        borderRadius: 20, padding: 24, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>🌤️</span>
          <div>
            <h3 style={{ color: '#D4AF37', fontWeight: 700, fontSize: 18, margin: 0 }}>{t.title}</h3>
            <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{t.subtitle}</p>
          </div>
        </div>

        {/* Occasion Selector */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {t.occasions.map(opt => (
            <button key={opt.value} onClick={() => setOccasion(opt.value)} style={{
              padding: '7px 14px', borderRadius: 999,
              border: `1px solid ${occasion === opt.value ? '#D4AF37' : 'rgba(212,175,55,0.25)'}`,
              background: occasion === opt.value ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: occasion === opt.value ? '#D4AF37' : '#888',
              fontSize: 13, cursor: 'pointer',
              fontWeight: occasion === opt.value ? 600 : 400,
              transition: 'all 0.2s ease',
            }}>
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button onClick={getSuggestion} disabled={loading} style={{
          width: '100%', padding: 14, borderRadius: 14, border: 'none',
          background: loading ? 'rgba(212,175,55,0.3)' : 'linear-gradient(135deg,#B8941F,#D4AF37)',
          color: loading ? '#D4AF37' : 'black',
          fontWeight: 700, fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.3s ease',
        }}>
          {loading ? (
            <>
              <div style={{ width: 16, height: 16, border: '2px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              {t.btnLoading}
            </>
          ) : t.btnGenerate}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 14, padding: 16, color: '#E74C3C', textAlign: 'center',
          fontSize: 14, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Suggestion Result */}
      {suggestion && (
        <div style={{
          background: '#0a0a0a', border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: 20, padding: 24,
          animation: 'reveal 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Best Choice Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 999, padding: '4px 12px', marginBottom: 16,
          }}>
            <span style={{ color: '#D4AF37', fontSize: 12, fontWeight: 700 }}>{t.bestChoice}</span>
          </div>

          {/* Weather Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 24 }}>{weatherIcon(suggestion.weather.description)}</span>
            <div>
              <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: 18 }}>{suggestion.weather.temp}°C</span>
              <span style={{ color: '#666', fontSize: 13, marginRight: 8 }}> {suggestion.weather.description}</span>
            </div>
            <div style={{ marginRight: 'auto' }}>
              <span style={{
                background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              }}>
                {city || t.yourCity}
              </span>
            </div>
          </div>

          {/* Outfit Name + Score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: 20, margin: 0 }}>{suggestion.outfit_name}</h3>
            <div style={{
              background: 'linear-gradient(135deg,#B8941F,#D4AF37)',
              borderRadius: 12, padding: '6px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52,
            }}>
              <span style={{ color: 'black', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{suggestion.style_score}</span>
              <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: 10 }}>{t.styleLabel}</span>
            </div>
          </div>

          {/* Items Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: getGridCols(suggestion.items.length),
            gap: 12, marginBottom: 20,
          }}>
            {suggestion.items.map((item, index) => {
              const daysSince = getDaysSince(item.last_worn_at)
              return (
                <div key={item.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 16, overflow: 'hidden',
                  gridColumn: suggestion.items.length === 3 && index === 0 ? 'span 2' : 'span 1',
                }}>
                  <div style={{
                    aspectRatio: suggestion.items.length === 3 && index === 0 ? '16/9' : '1',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    <img src={item.image_url} alt={t.categoryLabels[item.category] || item.category}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(212,175,55,0.4)',
                      borderRadius: 999, padding: '3px 10px',
                    }}>
                      <span style={{ color: '#D4AF37', fontSize: 11, fontWeight: 700 }}>
                        {t.categoryLabels[item.category] || item.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                      <span style={{ color: '#aaa', fontSize: 12 }}>{item.color}</span>
                      <span style={{ marginRight: 'auto', background: 'rgba(255,255,255,0.06)', color: '#666', fontSize: 10, padding: '2px 7px', borderRadius: 999 }}>
                        {item.style}
                      </span>
                    </div>
                    {/* Outfit History per item */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      {item.wear_count !== undefined && item.wear_count > 0 && (
                        <span style={{ fontSize: 10, color: '#D4AF37' }}>{t.wornTimes(item.wear_count)}</span>
                      )}
                      {daysSince !== null && (
                        <span style={{ fontSize: 10, color: '#555' }}>{t.lastWorn(daysSince)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ─── Wear This Today Button ─── */}
          <button onClick={handleWearThis} disabled={wearing || worn} style={{
            width: '100%', padding: 14, borderRadius: 14, border: worn ? '1px solid rgba(39,174,96,0.3)' : 'none',
            background: worn
              ? 'rgba(39,174,96,0.15)'
              : 'linear-gradient(135deg,#B8941F,#D4AF37)',
            color: worn ? '#27AE60' : 'black',
            fontWeight: 700, fontSize: 15,
            cursor: worn || wearing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 16, transition: 'all 0.3s ease',
          } as React.CSSProperties}>
            {wearing ? (
              <div style={{ width: 16, height: 16, border: '2px solid black', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            ) : worn ? t.btnWearing : t.btnWear}
          </button>

          {/* Why this outfit */}
          <div style={{
            background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 12,
          }}>
            <p style={{ color: '#D4AF37', fontSize: 12, fontWeight: 600, margin: '0 0 6px' }}>{t.whyTitle}</p>
            <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{suggestion.reason}</p>
          </div>

          {/* Weather Tip */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12,
          }}>
            <span style={{ fontSize: 16 }}>{t.weatherTip}</span>
            <p style={{ color: '#888', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{suggestion.weather_tip}</p>
          </div>

          {/* ─── Missing Pieces ─── */}
          {suggestion.missing_pieces && suggestion.missing_pieces.length > 0 && (
            <div style={{
              background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 12,
            }}>
              <p style={{ color: '#D4AF37', fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>{t.missingTitle}</p>
              <p style={{ color: '#555', fontSize: 11, margin: '0 0 12px' }}>{t.missingSubtitle}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestion.missing_pieces.map((piece, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: 18 }}>
                      {piece.category === 'shoes' ? '👟' : piece.category === 'top' ? '👕' : piece.category === 'bottom' ? '👖' : piece.category === 'outerwear' ? '🧥' : '⌚'}
                    </span>
                    <p style={{ color: '#ccc', fontSize: 13, margin: 0, flex: 1 }}>{piece.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retry Button */}
          <button onClick={getSuggestion} disabled={loading} style={{
            marginTop: 4, width: '100%', padding: 11, borderRadius: 12,
            border: '1px solid rgba(212,175,55,0.3)', background: 'transparent',
            color: '#D4AF37', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => (e.target as HTMLButtonElement).style.background = 'rgba(212,175,55,0.08)'}
            onMouseLeave={e => (e.target as HTMLButtonElement).style.background = 'transparent'}
          >
            {t.btnRetry}
          </button>
        </div>
      )}
    </div>
  )
}
