'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DailyOutfit from './DailyOutfit'

interface WardrobeItem {
  id: string
  image_url: string
  category: string
  color: string
  style: string
  occasion: string
  season: string
  wear_count: number
  last_worn_at: string | null
  created_at: string
}

interface WardrobeSectionProps {
  username: string
  city?: string | null
  lang?: 'ar' | 'en'
}

const FREE_LIMIT = 15

// ─── Mission Types ────────────────────────────────────────────
type MissionType = 'neglected' | 'color_mix' | 'improve_score' | 'no_repeat'

interface Mission {
  type: MissionType
  title_ar: string
  title_en: string
  desc_ar: string
  desc_en: string
  xp: number
}

const MISSIONS: Mission[] = [
  {
    type: 'neglected',
    title_ar: '😴 أعطِ قطعة مهملة فرصة',
    title_en: '😴 Wake Up a Neglected Piece',
    desc_ar: 'البس شيء ما لبسته من 7 أيام أو أكثر',
    desc_en: "Wear something you haven't worn in 7 days",
    xp: 20,
  },
  {
    type: 'color_mix',
    title_ar: '🎨 مزج الألوان',
    title_en: '🎨 Color Mix Challenge',
    desc_ar: 'ابني إطلالة بلونين مختلفين على الأقل',
    desc_en: 'Build an outfit using 2 different colors',
    xp: 20,
  },
  {
    type: 'improve_score',
    title_ar: '📈 رفع الـ Score',
    title_en: '📈 Boost Your Score',
    desc_ar: 'سجّل لبسة جديدة وارفع نقاط خزانتك',
    desc_en: 'Log a new wear and improve your closet score',
    xp: 25,
  },
  {
    type: 'no_repeat',
    title_ar: '🚫 لا تكرار اليوم',
    title_en: '🚫 No Repeat Today',
    desc_ar: "لا تكرر إطلالة أمس — جرب شيء جديد",
    desc_en: "Don't repeat yesterday's outfit — try something fresh",
    xp: 15,
  },
]

// ─── Levels ───────────────────────────────────────────────────
const LEVELS = [
  { min: 0,   label_ar: 'مبتدئ',   label_en: 'Beginner', icon: '🌱' },
  { min: 100, label_ar: 'أنيق',    label_en: 'Styled',   icon: '✨' },
  { min: 300, label_ar: 'حاد',     label_en: 'Sharp',    icon: '🔥' },
  { min: 600, label_ar: 'النخبة',  label_en: 'Elite',    icon: '💎' },
]

function getLevel(xp: number, lang: 'ar' | 'en') {
  let current = LEVELS[0]
  for (const lvl of LEVELS) { if (xp >= lvl.min) current = lvl }
  return { label: lang === 'ar' ? current.label_ar : current.label_en, icon: current.icon }
}

const T = {
  ar: {
    smartWardrobe: '🗄️ خزانتك الذكية',
    wardrobeSubtitle: 'صوّر قطعك مرة وحدة، الـ AI يتكفل بالباقي',
    totalItems: 'إجمالي القطع',
    top: 'علوي', bottom: 'سفلي', shoes: 'أحذية', outerwear: 'جاكيت', accessory: 'إكسسوار',
    all: '🗂️ الكل',
    limitReachedTitle: 'وصلت للحد المجاني',
    limitProgress: (count: number, limit: number) => `${count} / ${limit} قطعة`,
    limitRemaining: (n: number) => `باقي ${n} قطع في الخطة المجانية`,
    limitUpgrade: 'ترقّ للـ Pro للخزانة غير المحدودة',
    upgradePro: '✨ Pro',
    dragOrClick: 'اسحب صورة أو اضغط للرفع',
    aiClassify: 'AI يصنف القطعة تلقائياً',
    analyzing: 'AI يحلل القطعة...',
    limitReachedUpload: 'وصلت لحد الـ 15 قطعة المجانية',
    limitReachedSub: 'ترقّ للـ Pro لخزانة غير محدودة',
    seePro: '✨ شوف خطط الـ Pro',
    noItems: 'ما في قطع بعد — ارفع أول قطعة!',
    wornTimes: (n: number) => `لُبس ${n} مرة`,
    deleteItem: '✕',
    closetScore: 'Closet Score',
    closetScoreSubtitle: 'صحة خزانتك',
    neglectedTitle: '😴 قطع مهملة',
    neglectedSubtitle: (days: number) => `ما انلبست من ${days} يوم`,
    buildOutfit: '✨ بني إطلالة معها',
    fixCloset: '🔧 Fix my closet',
    lastWorn: (days: number) => days === 0 ? 'لُبست اليوم' : `آخر لبسة: ${days} يوم`,
    neverWorn: 'لم تُلبس بعد',
    wornCount: (n: number) => `${n} مرة`,
    missionTitle: '🔥 مهمة اليوم',
    missionComplete: '✅ أكملت المهمة',
    missionCompleteBtn: 'اكتملت! +XP 🎉',
    streakLabel: 'يوم متتالي 🔥',
    xpLabel: 'XP',
    levelLabel: 'المستوى',
    notifGranted: '🔔 سيتم تذكيرك!',
    enableNotif: '🔔 فعّل الإشعارات',
    outfitHistory: '📅 سجل الإطلالات',
    historyEmpty: 'ما في إطلالات مسجلة بعد',
  },
  en: {
    smartWardrobe: '🗄️ Your Smart Wardrobe',
    wardrobeSubtitle: 'Upload your pieces once, AI handles the rest',
    totalItems: 'Total Items',
    top: 'Top', bottom: 'Bottom', shoes: 'Shoes', outerwear: 'Jacket', accessory: 'Accessory',
    all: '🗂️ All',
    limitReachedTitle: 'Free limit reached',
    limitProgress: (count: number, limit: number) => `${count} / ${limit} items`,
    limitRemaining: (n: number) => `${n} items left on the free plan`,
    limitUpgrade: 'Upgrade to Pro for unlimited wardrobe',
    upgradePro: '✨ Pro',
    dragOrClick: 'Drag an image or click to upload',
    aiClassify: 'AI classifies your item automatically',
    analyzing: 'AI is analyzing your item...',
    limitReachedUpload: "You've reached the 15 free items limit",
    limitReachedSub: 'Upgrade to Pro for unlimited wardrobe',
    seePro: '✨ See Pro Plans',
    noItems: 'No items yet — upload your first piece!',
    wornTimes: (n: number) => `Worn ${n} time${n !== 1 ? 's' : ''}`,
    deleteItem: '✕',
    closetScore: 'Closet Score',
    closetScoreSubtitle: 'Wardrobe health',
    neglectedTitle: '😴 Neglected Items',
    neglectedSubtitle: (days: number) => `Not worn in ${days} days`,
    buildOutfit: '✨ Build outfit with this',
    fixCloset: '🔧 Fix my closet',
    lastWorn: (days: number) => days === 0 ? 'Worn today' : `Last worn: ${days}d ago`,
    neverWorn: 'Never worn',
    wornCount: (n: number) => `${n}×`,
    missionTitle: '🔥 Today\'s Mission',
    missionComplete: '✅ Mission Complete',
    missionCompleteBtn: 'Done! +XP 🎉',
    streakLabel: 'day streak 🔥',
    xpLabel: 'XP',
    levelLabel: 'Level',
    notifGranted: '🔔 You\'ll be reminded!',
    enableNotif: '🔔 Enable Notifications',
    outfitHistory: '📅 Outfit History',
    historyEmpty: 'No outfits logged yet',
  },
}

const categoryIcons: Record<string, string> = {
  top: '👕', bottom: '👖', shoes: '👟', outerwear: '🧥', accessory: '⌚',
}

// ─── Closet Health Score (upgraded) ──────────────────────────
function calcClosetScore(items: WardrobeItem[]): number {
  if (items.length === 0) return 0

  const categories = ['top', 'bottom', 'shoes', 'outerwear', 'accessory']
  const present = categories.filter(c => items.some(i => i.category === c)).length
  const balanceScore = (present / categories.length) * 25

  const colors = new Set(items.map(i => i.color?.toLowerCase())).size
  const colorScore = Math.min(colors / 5, 1) * 15

  const totalWears = items.reduce((s, i) => s + (i.wear_count || 0), 0)
  const avgWear = items.length > 0 ? totalWears / items.length : 0
  const usageScore = Math.min(avgWear / 5, 1) * 25

  const countScore = Math.min(items.length / 15, 1) * 15

  // ─── Neglect Penalty ─────────────────────────────────────────
  const neglected = items.filter(i => {
    const d = getDaysSince(i.last_worn_at)
    return d !== null && d >= 14
  }).length
  const neglectPenalty = Math.min((neglected / Math.max(items.length, 1)) * 20, 20)

  // ─── Wear Diversity Bonus ─────────────────────────────────────
  const neverWorn = items.filter(i => i.wear_count === 0).length
  const diversityBonus = Math.max(0, 20 - (neverWorn / Math.max(items.length, 1)) * 20)

  const raw = balanceScore + colorScore + usageScore + countScore + diversityBonus - neglectPenalty
  return Math.round(Math.min(Math.max(raw, 0), 100)) / 10
}

function getDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ─── Confetti (simple CSS-based) ─────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  const pieces = Array.from({ length: 18 })
  const colors = ['#D4AF37', '#E74C3C', '#27AE60', '#3498DB', '#9B59B6', '#F39C12']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {pieces.map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${Math.random() * 40}%`,
          left: `${(i / pieces.length) * 100}%`,
          width: 10, height: 10,
          background: colors[i % colors.length],
          borderRadius: Math.random() > 0.5 ? '50%' : 2,
          animation: `confettiFall 1.2s ease-out forwards`,
          animationDelay: `${Math.random() * 0.4}s`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function WardrobeSection({ username, city, lang = 'ar' }: WardrobeSectionProps) {
  const router = useRouter()
  const t = T[lang]
  const isRTL = lang === 'ar'

  const [items, setItems] = useState<WardrobeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [dragOver, setDragOver] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [wearingId, setWearingId] = useState<string | null>(null)
  const [buildingId, setBuildingId] = useState<string | null>(null)
  const [fixingId, setFixingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Gamification State ───────────────────────────────────────
  const [xp, setXp] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [mission, setMission] = useState<Mission | null>(null)
  const [missionDone, setMissionDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [notifGranted, setNotifGranted] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [outfitHistory, setOutfitHistory] = useState<{ date: string; ids: string[] }[]>([])

  // ─── Init: load from localStorage ───────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedXp = parseInt(localStorage.getItem(`leo_xp_${username}`) || '0')
    const savedStreak = parseInt(localStorage.getItem(`leo_streak_${username}`) || '0')
    const savedMissionType = localStorage.getItem(`leo_mission_type_${username}`) as MissionType | null
    const savedMissionDate = localStorage.getItem(`leo_mission_date_${username}`)
    const savedMissionDone = localStorage.getItem(`leo_mission_done_${username}`)
    const savedHistory = localStorage.getItem(`leo_history_${username}`)
    const lastLoginDate = localStorage.getItem(`leo_last_login_${username}`)

    setXp(savedXp)

    // ─── Streak Logic ────────────────────────────────────────
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (lastLoginDate === yesterday) {
      setStreak(savedStreak + 1)
      localStorage.setItem(`leo_streak_${username}`, String(savedStreak + 1))
    } else if (lastLoginDate !== today) {
      setStreak(lastLoginDate ? 0 : savedStreak)
      if (lastLoginDate && lastLoginDate !== today) {
        localStorage.setItem(`leo_streak_${username}`, '0')
      }
    } else {
      setStreak(savedStreak)
    }
    localStorage.setItem(`leo_last_login_${username}`, today)

    // ─── Daily Mission ───────────────────────────────────────
    if (savedMissionDate === today && savedMissionType) {
      const m = MISSIONS.find(m => m.type === savedMissionType) || MISSIONS[0]
      setMission(m)
      setMissionDone(savedMissionDone === 'true')
    } else {
      const types: MissionType[] = ['neglected', 'color_mix', 'improve_score', 'no_repeat']
      const picked = MISSIONS.find(m => m.type === types[Math.floor(Math.random() * types.length)]) || MISSIONS[0]
      setMission(picked)
      setMissionDone(false)
      localStorage.setItem(`leo_mission_type_${username}`, picked.type)
      localStorage.setItem(`leo_mission_date_${username}`, today)
      localStorage.setItem(`leo_mission_done_${username}`, 'false')
    }

    if (savedHistory) {
      try { setOutfitHistory(JSON.parse(savedHistory)) } catch {}
    }

    // ─── Browser Push Notification ───────────────────────────
    if (Notification.permission === 'granted') {
      setNotifGranted(true)
      scheduleDailyNotification(username, lang)
    }
  }, [username])

  useEffect(() => { if (username) fetchItems() }, [username])
  useEffect(() => { setLimitReached(items.length >= FREE_LIMIT) }, [items])

  // ─── Smart Notification Scheduler ────────────────────────────
  function scheduleDailyNotification(uid: string, lang: 'ar' | 'en') {
    const now = new Date()
    const missionDoneToday = localStorage.getItem(`leo_mission_done_${uid}`) === 'true'
    const lastLogin = localStorage.getItem(`leo_last_login_${uid}`)
    const today = new Date().toDateString()

    if (lastLogin !== today && Notification.permission === 'granted') {
      const messages = lang === 'ar'
        ? [
            'تجاهلت أسلوبك لفترة. خزانتك تنتظرك 👔',
            'مهمتك اليومية لسا ما اكتملت 🔥',
            'نقاط خزانتك نزلت — ارجع وحسّنها 📈',
            'في 3 قطع ما لبستها هذا الأسبوع 😴',
          ]
        : [
            "You've ignored your style. Your wardrobe misses you 👔",
            "Today's mission is still waiting for you 🔥",
            'Your closet score dropped — fix it now 📈',
            "3 pieces went unworn this week 😴",
          ]
      const body = messages[Math.floor(Math.random() * messages.length)]
      new Notification('LEO 👔', { body, icon: '/favicon.ico' })
    }
  }

  async function requestNotifications() {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotifGranted(true)
      localStorage.setItem(`leo_notif_${username}`, 'granted')
      scheduleDailyNotification(username, lang)
    }
  }

  // ─── Add XP ───────────────────────────────────────────────────
  function addXp(amount: number) {
    setXp(prev => {
      const next = prev + amount
      localStorage.setItem(`leo_xp_${username}`, String(next))
      return next
    })
  }

  // ─── Complete Mission ─────────────────────────────────────────
  function completeMission() {
    if (missionDone || !mission) return
    setMissionDone(true)
    localStorage.setItem(`leo_mission_done_${username}`, 'true')
    addXp(mission.xp)
    // Streak +1 if not already incremented today
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/wardrobe?user_id=${username}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleUpload = async (file: File) => {
    if (!file || !username) return
    if (items.length >= FREE_LIMIT) { setLimitReached(true); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('user_id', username)
      const res = await fetch('/api/wardrobe', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) setItems(prev => [data.item, ...prev])
    } catch (err) { console.error(err) }
    finally { setUploading(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/wardrobe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, user_id: username }),
      })
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) { console.error(err) }
  }

  // ─── Wear This ───────────────────────────────────────────────
  const handleWearItem = async (id: string) => {
    setWearingId(id)
    try {
      await fetch('/api/wardrobe/wear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, user_id: username }),
      })
      setItems(prev => prev.map(item =>
        item.id === id
          ? { ...item, wear_count: item.wear_count + 1, last_worn_at: new Date().toISOString() }
          : item
      ))
      addXp(5)
      // Log to outfit history
      const today = new Date().toISOString().split('T')[0]
      setOutfitHistory(prev => {
        const existing = prev.find(h => h.date === today)
        let next: { date: string; ids: string[] }[]
        if (existing) {
          next = prev.map(h => h.date === today ? { ...h, ids: [...new Set([...h.ids, id])] } : h)
        } else {
          next = [{ date: today, ids: [id] }, ...prev].slice(0, 30)
        }
        localStorage.setItem(`leo_history_${username}`, JSON.stringify(next))
        return next
      })
    } catch (err) { console.error(err) }
    finally { setWearingId(null) }
  }

  // ─── Build Outfit With This ──────────────────────────────────
  const handleBuildWithItem = async (id: string) => {
    setBuildingId(id)
    try {
      await fetch('/api/wardrobe/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: username, forced_item_id: id, city }),
      })
    } catch (err) { console.error(err) }
    finally { setBuildingId(null) }
  }

  // ─── Fix My Closet (AI Decision) ─────────────────────────────
  const handleFixCloset = async (id: string) => {
    setFixingId(id)
    try {
      const res = await fetch('/api/wardrobe/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: username, forced_item_id: id, city, fix_mode: true }),
      })
      const data = await res.json()
      if (data.success) {
        alert(
          lang === 'ar'
            ? `✨ إطلالة مقترحة: ${data.suggestion.outfit_name}\n\n${data.suggestion.reason}`
            : `✨ Suggested: ${data.suggestion.outfit_name}\n\n${data.suggestion.reason}`
        )
      }
    } catch (err) { console.error(err) }
    finally { setFixingId(null) }
  }

  const categoryLabels: Record<string, string> = {
    top: t.top, bottom: t.bottom, shoes: t.shoes, outerwear: t.outerwear, accessory: t.accessory,
  }

  const filteredItems = filter === 'all' ? items : items.filter(item => item.category === filter)

  const stats = {
    total: items.length,
    tops: items.filter(i => i.category === 'top').length,
    bottoms: items.filter(i => i.category === 'bottom').length,
    shoes: items.filter(i => i.category === 'shoes').length,
  }

  const progressPct = Math.min(100, (items.length / FREE_LIMIT) * 100)
  const closetScore = calcClosetScore(items)
  const scoreColor = closetScore >= 7 ? '#27AE60' : closetScore >= 5 ? '#E5A020' : '#C0392B'
  const level = getLevel(xp, lang)

  // ─── Neglected Items ─────────────────────────────────────────
  const neglectedItems = items.filter(item => {
    const days = getDaysSince(item.last_worn_at)
    return days !== null && days >= 10
  }).sort((a, b) => {
    const da = getDaysSince(a.last_worn_at) ?? 0
    const db = getDaysSince(b.last_worn_at) ?? 0
    return db - da
  }).slice(0, 5)

  const nextLevelXp = LEVELS.find(l => l.min > xp)?.min ?? xp + 100
  const prevLevelXp = [...LEVELS].reverse().find(l => l.min <= xp)?.min ?? 0
  const xpPct = Math.min(100, ((xp - prevLevelXp) / Math.max(nextLevelXp - prevLevelXp, 1)) * 100)

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <Confetti active={showConfetti} />

      <DailyOutfit username={username} city={city ?? null} lang={lang} />

      {/* ─── Gamification Bar (XP + Streak + Level) ─── */}
      <div style={{
        background: 'linear-gradient(135deg,#0a0a0a,#111)',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 18, padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        {/* Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{level.icon}</span>
          <div>
            <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 14, margin: 0 }}>{level.label}</p>
            <p style={{ color: '#555', fontSize: 10, margin: 0 }}>{t.levelLabel}</p>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#888', fontSize: 11 }}>{xp} {t.xpLabel}</span>
            <span style={{ color: '#555', fontSize: 10 }}>{nextLevelXp} XP</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(212,175,55,0.1)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${xpPct}%`,
              background: 'linear-gradient(90deg,#B8941F,#D4AF37)',
              borderRadius: 999, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Streak */}
        <div style={{
          background: streak > 0 ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${streak > 0 ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12, padding: '8px 14px', textAlign: 'center',
        }}>
          <p style={{ color: streak > 0 ? '#D4AF37' : '#444', fontWeight: 800, fontSize: 20, margin: 0 }}>{streak}</p>
          <p style={{ color: '#555', fontSize: 10, margin: 0 }}>{t.streakLabel}</p>
        </div>

        {/* Notification Button */}
        {!notifGranted && (
          <button onClick={requestNotifications} style={{
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37', fontSize: 11, fontWeight: 600,
            padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
          }}>
            {t.enableNotif}
          </button>
        )}
        {notifGranted && (
          <span style={{ color: '#27AE60', fontSize: 11 }}>{t.notifGranted}</span>
        )}
      </div>

      {/* ─── Daily Mission Card ─── */}
      {mission && (
        <div style={{
          background: missionDone
            ? 'rgba(39,174,96,0.06)'
            : 'linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.03))',
          border: `1px solid ${missionDone ? 'rgba(39,174,96,0.3)' : 'rgba(212,175,55,0.4)'}`,
          borderRadius: 18, padding: '18px 22px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: missionDone ? '#27AE60' : '#D4AF37', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>
                {missionDone ? t.missionComplete : t.missionTitle}
              </p>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 15, margin: '0 0 4px' }}>
                {lang === 'ar' ? mission.title_ar : mission.title_en}
              </p>
              <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                {lang === 'ar' ? mission.desc_ar : mission.desc_en}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 10, padding: '6px 10px', textAlign: 'center',
              }}>
                <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: 16, margin: 0 }}>+{mission.xp}</p>
                <p style={{ color: '#666', fontSize: 9, margin: 0 }}>XP</p>
              </div>
              {!missionDone && (
                <button onClick={completeMission} style={{
                  background: 'linear-gradient(135deg,#B8941F,#D4AF37)',
                  color: 'black', fontWeight: 700, fontSize: 11,
                  padding: '8px 12px', borderRadius: 10, border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {t.missionCompleteBtn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Closet Health Score ─── */}
      {items.length >= 3 && (
        <div style={{
          background: 'linear-gradient(135deg,#0a0a0a,#111)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 20, padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              {t.closetScoreSubtitle}
            </p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '4px 0 0' }}>
              {t.closetScore}
            </p>
            {closetScore < 5 && (
              <p style={{ color: '#E74C3C', fontSize: 11, margin: '4px 0 0' }}>
                {lang === 'ar' ? '⚠️ خزانتك تحتاج تحسين' : '⚠️ Your wardrobe needs work'}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: scoreColor, fontWeight: 800, fontSize: 32, margin: 0, lineHeight: 1 }}>
                {closetScore.toFixed(1)}
              </p>
              <p style={{ color: '#555', fontSize: 10, margin: 0 }}>/10</p>
            </div>
            <div style={{ width: 80 }}>
              <div style={{ width: '100%', height: 6, background: 'rgba(212,175,55,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(closetScore / 10) * 100}%`,
                  background: `linear-gradient(90deg,${scoreColor},${scoreColor}cc)`,
                  borderRadius: 999, transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Neglected Items ─── */}
      {neglectedItems.length > 0 && (
        <div style={{
          background: 'rgba(231,76,60,0.04)', border: '1px solid rgba(231,76,60,0.2)',
          borderRadius: 16, padding: '16px 20px', marginBottom: 24,
        }}>
          <p style={{ color: '#E74C3C', fontWeight: 700, fontSize: 13, margin: '0 0 12px' }}>
            {t.neglectedTitle}
          </p>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {neglectedItems.map(item => {
              const days = getDaysSince(item.last_worn_at) ?? 0
              return (
                <div key={item.id} style={{
                  flexShrink: 0, width: 130, background: '#0a0a0a',
                  border: '1px solid rgba(231,76,60,0.25)', borderRadius: 14, overflow: 'hidden',
                }}>
                  <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
                    <img src={item.image_url} alt={item.category}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ color: '#E74C3C', fontSize: 10, margin: '0 0 6px', fontWeight: 600 }}>
                      {t.neglectedSubtitle(days)}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <button
                        onClick={() => handleBuildWithItem(item.id)}
                        disabled={buildingId === item.id}
                        style={{
                          width: '100%', padding: '6px 4px', borderRadius: 8,
                          border: '1px solid rgba(212,175,55,0.3)',
                          background: 'transparent', color: '#D4AF37',
                          fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          opacity: buildingId === item.id ? 0.5 : 1,
                        }}>
                        {buildingId === item.id ? '...' : t.buildOutfit}
                      </button>
                      <button
                        onClick={() => handleFixCloset(item.id)}
                        disabled={fixingId === item.id}
                        style={{
                          width: '100%', padding: '6px 4px', borderRadius: 8,
                          border: '1px solid rgba(231,76,60,0.3)',
                          background: 'transparent', color: '#E74C3C',
                          fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          opacity: fixingId === item.id ? 0.5 : 1,
                        }}>
                        {fixingId === item.id ? '...' : t.fixCloset}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Outfit History Toggle ─── */}
      {outfitHistory.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '14px 20px', marginBottom: 24,
        }}>
          <button
            onClick={() => setShowHistory(h => !h)}
            style={{
              background: 'none', border: 'none', color: '#D4AF37',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            {t.outfitHistory}
            <span style={{ color: '#555', fontSize: 11 }}>{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {outfitHistory.slice(0, 7).map(entry => {
                const dayItems = items.filter(i => entry.ids.includes(i.id))
                return (
                  <div key={entry.date} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px',
                  }}>
                    <span style={{ color: '#555', fontSize: 11, minWidth: 80 }}>{entry.date}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {dayItems.map(item => (
                        <img key={item.id} src={item.image_url} alt=""
                          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(212,175,55,0.2)' }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{t.smartWardrobe}</h2>
        <p className="text-gray-400">{t.wardrobeSubtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: t.totalItems, value: stats.total, icon: '🗄️' },
          { label: t.top,        value: stats.tops,    icon: '👕' },
          { label: t.bottom,     value: stats.bottoms, icon: '👖' },
          { label: t.shoes,      value: stats.shoes,   icon: '👟' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Free Limit Banner */}
      <div style={{
        background: limitReached ? 'rgba(212,175,55,0.06)' : 'rgba(212,175,55,0.03)',
        border: `1px solid ${limitReached ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.2)'}`,
        borderRadius: 14, padding: '14px 18px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{limitReached ? '🔒' : '👔'}</span>
          <div>
            <p style={{ color: limitReached ? '#D4AF37' : '#aaa', fontSize: 13, fontWeight: 600, margin: 0 }}>
              {limitReached ? t.limitReachedTitle : t.limitProgress(items.length, FREE_LIMIT)}
            </p>
            <p style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
              {limitReached ? t.limitUpgrade : t.limitRemaining(FREE_LIMIT - items.length)}
            </p>
          </div>
        </div>
        <div style={{ flex: 1, maxWidth: 140 }}>
          <div style={{ width: '100%', height: 6, background: 'rgba(212,175,55,0.1)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: limitReached ? 'linear-gradient(90deg,#E74C3C,#C0392B)' : 'linear-gradient(90deg,#B8941F,#D4AF37)',
              borderRadius: 999, transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ color: '#444', fontSize: 10, marginTop: 4, textAlign: 'center' }}>
            {items.length} / {FREE_LIMIT}
          </p>
        </div>
        {limitReached && (
          <button onClick={() => router.push('/pricing')} style={{
            background: '#D4AF37', color: 'black', fontWeight: 700,
            padding: '8px 18px', borderRadius: 999, border: 'none',
            cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
            boxShadow: '0 0 16px rgba(212,175,55,0.3)',
          }}>
            {t.upgradePro}
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center mb-8 transition-all ${
          limitReached ? 'border-[#D4AF37]/20 opacity-50 cursor-not-allowed'
          : dragOver ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5 cursor-pointer'
          : 'border-white/20 hover:border-white/40 bg-white/5 cursor-pointer'
        }`}
        onDragOver={e => { if (limitReached) return; e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (limitReached) return; const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
        onClick={() => { if (limitReached) return; fileInputRef.current?.click() }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#D4AF37] font-medium">{t.analyzing}</p>
          </div>
        ) : limitReached ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">🔒</div>
            <p className="text-[#D4AF37] font-medium">{t.limitReachedUpload}</p>
            <p className="text-gray-500 text-sm">{t.limitReachedSub}</p>
            <button onClick={e => { e.stopPropagation(); router.push('/pricing') }} style={{
              background: '#D4AF37', color: 'black', fontWeight: 700,
              padding: '8px 20px', borderRadius: 999, border: 'none',
              cursor: 'pointer', fontSize: 13, marginTop: 4,
              boxShadow: '0 0 20px rgba(212,175,55,0.3)',
            }}>{t.seePro}</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">📸</div>
            <p className="text-white font-medium">{t.dragOrClick}</p>
            <p className="text-gray-400 text-sm">{t.aiClassify}</p>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'top', 'bottom', 'shoes', 'outerwear', 'accessory'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === cat ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}>
            {cat === 'all' ? t.all : `${categoryIcons[cat]} ${categoryLabels[cat]}`}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">👔</div>
          <p>{t.noItems}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const daysSince = getDaysSince(item.last_worn_at)
            const isNeglected = daysSince !== null && daysSince >= 10

            return (
              <div key={item.id}
                className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#D4AF37]/40 transition-all"
                style={{ borderColor: isNeglected ? 'rgba(231,76,60,0.3)' : undefined }}
              >
                <div className="aspect-square overflow-hidden">
                  <img src={item.image_url} alt={item.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>

                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {categoryIcons[item.category]} {categoryLabels[item.category]}
                    </span>
                    <span className="text-xs text-gray-400">{item.color}</span>
                  </div>

                  <div className="flex gap-1 flex-wrap mb-2">
                    <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{item.style}</span>
                    <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{item.occasion}</span>
                  </div>

                  {/* Outfit History per item */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: item.wear_count > 0 ? '#D4AF37' : '#444' }}>
                      {item.wear_count > 0 ? t.wornCount(item.wear_count) : t.neverWorn}
                    </span>
                    {daysSince !== null && (
                      <span style={{ fontSize: 10, color: isNeglected ? '#E74C3C' : '#555' }}>
                        {t.lastWorn(daysSince)}
                      </span>
                    )}
                  </div>

                  {/* Wear This Button */}
                  <button
                    onClick={() => handleWearItem(item.id)}
                    disabled={wearingId === item.id}
                    style={{
                      width: '100%', padding: '7px 0', borderRadius: 10,
                      border: '1px solid rgba(212,175,55,0.3)',
                      background: wearingId === item.id ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: '#D4AF37', fontSize: 11, fontWeight: 600,
                      cursor: wearingId === item.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s', marginBottom: isNeglected ? 5 : 0,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = wearingId === item.id ? 'rgba(212,175,55,0.15)' : 'transparent'}
                  >
                    {wearingId === item.id ? '✓ +5XP' : '👕 Wear This'}
                  </button>

                  {/* Fix My Closet button for neglected items */}
                  {isNeglected && (
                    <button
                      onClick={() => handleFixCloset(item.id)}
                      disabled={fixingId === item.id}
                      style={{
                        width: '100%', padding: '6px 0', borderRadius: 10,
                        border: '1px solid rgba(231,76,60,0.3)',
                        background: 'transparent', color: '#E74C3C',
                        fontSize: 10, fontWeight: 600,
                        cursor: fixingId === item.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}>
                      {fixingId === item.id ? '...' : t.fixCloset}
                    </button>
                  )}
                </div>

                {/* Delete Button */}
                <button onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {t.deleteItem}
                </button>

                {/* Neglected Badge */}
                {isNeglected && (
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'rgba(231,76,60,0.85)', borderRadius: 999,
                    padding: '2px 8px', fontSize: 9, color: 'white', fontWeight: 700,
                  }}>
                    😴 {daysSince}d
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
