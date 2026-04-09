"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";

// ─── Types ────────────────────────────────────────────────────
type HistoryEntry = {
  id: string;
  date: string;
  score: number;
  styleType: string;
  fitType: string;
};

type WishlistEntry = {
  id: string;
  date: string;
  occasion: string;
  text: string;
  note: string;
  priority: "high" | "normal" | "later";
};

type ChatMessage = {
  role: "user" | "bot";
  text: string;
  timestamp: number;
};

type Message = {
  role: "user" | "bot";
  text: string;
  timestamp: number;
};

type QuizQuestion = {
  id: string;
  question: { ar: string; en: string };
  type: "mcq" | "truefalse";
  options?: { ar: string[]; en: string[] };
  correct: number;
  explanation: { ar: string; en: string };
  xp: number;
};

// ─── Types T ──────────────────────────────────────────────────
type StreakT = {
  streakTitle: string;
  streakDays: string;
  streakMsg0: string;
  streakMsg1: string;
  streakMsg3: string;
  streakMsg7: string;
  streakMsg14: string;
  checkinBtn: string;
  checkinDone: string;
  checkinQuestion: string;
  badge7: string;
  badge14: string;
  badge30: string;
  streakBestLabel: string;
  streakWarning: string;
};

type HistoryT = {
  historyEmpty: string;
  historyTitle: string;
  historyClear: string;
  historyTotal: string;
  historyBest: string;
  historyAvg: string;
  historyProgress: string;
  historyFilterAll: string;
  historyFilterLabel: string;
  historyWeekCompare: string;
  historyWeekUp: string;
  historyWeekDown: string;
  historyWeekSame: string;
};

type WishlistT = {
  wishlistEmpty: string;
  wishlistTitle: string;
  wishlistDelete: string;
  wishlistOccasion: string;
  wishlistDate: string;
  wishlistNote: string;
  wishlistAddNote: string;
  wishlistSortBy: string;
  wishlistSortDate: string;
  wishlistSortOccasion: string;
  wishlistPriorityHigh: string;
  wishlistPriorityNormal: string;
  wishlistPriorityLater: string;
};

type T = StreakT & HistoryT & WishlistT;

// ─── Safe localStorage ────────────────────────────────────────
function safeLocalStorage() {
  const get = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const set = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch {}
  };
  return { get, set };
}

// ─── Daily Questions (Checkin) ────────────────────────────────
const DAILY_QUESTIONS = {
  ar: [
    "شو لابس اليوم؟ صوّر وحلّل إطلالتك! 📸",
    "هل جربت ستايل جديد هالأسبوع؟ شاركنا! 🎨",
    "ما هو اللون المفضل في خزانتك؟ جرّب تحليل إطلالة فيه 🌈",
    "عندك مناسبة قريباً؟ خلّي LEO يساعدك 👔",
    "هل تعتقد إن الـ fit أهم من اللون؟ حلّل وشوف! 🔍",
    "جرّب اليوم ستايل مختلف عن عادتك وصوّره 🚀",
    "ما أفضل إطلالة لبستها هالأسبوع؟ حلّلها مع LEO ⭐",
  ],
  en: [
    "What are you wearing today? Capture and analyze! 📸",
    "Tried a new style this week? Share it! 🎨",
    "What's your go-to color? Try analyzing an outfit with it 🌈",
    "Got an upcoming event? Let LEO help you prepare 👔",
    "Do you think fit matters more than color? Analyze and find out! 🔍",
    "Try something different today and capture it 🚀",
    "What's your best outfit this week? Analyze it with LEO ⭐",
  ],
};

// ─── Quiz Questions Bank ──────────────────────────────────────
const QUIZ_BANK: QuizQuestion[] = [
  {
    id: "q1",
    question: {
      ar: "أي من هذه القواعد أساس الـ Old Money style؟",
      en: "Which rule is the foundation of Old Money style?",
    },
    type: "mcq",
    options: {
      ar: ["ألوان صاخبة وبراقة", "قطع هادئة وخامات فاخرة", "شعارات ماركات واضحة", "ملابس رياضية أنيقة"],
      en: ["Bold bright colors", "Quiet pieces and luxury fabrics", "Visible brand logos", "Elegant sportswear"],
    },
    correct: 1,
    explanation: {
      ar: "الـ Old Money يعتمد على التواضع الفاخر — خامات عالية الجودة بدون ضجيج بصري.",
      en: "Old Money relies on quiet luxury — high quality fabrics without visual noise.",
    },
    xp: 20,
  },
  {
    id: "q2",
    question: {
      ar: "الـ Monochrome outfit يعني لبس ألوان متضادة تماماً.",
      en: "A Monochrome outfit means wearing completely contrasting colors.",
    },
    type: "truefalse",
    correct: 1,
    explanation: {
      ar: "خطأ! Monochrome يعني استخدام درجات مختلفة من نفس اللون، مش ألوان متضادة.",
      en: "False! Monochrome means using different shades of the same color, not contrasting colors.",
    },
    xp: 15,
  },
  {
    id: "q3",
    question: {
      ar: "ما أفضل طريقة لتضخيم حجم الجسم بصرياً؟",
      en: "What's the best way to visually add height and frame?",
    },
    type: "mcq",
    options: {
      ar: ["ملابس فضفاضة كثيرة", "تنسيق ألوان عمودي داكن-فاتح", "Monochrome من الأعلى للأسفل", "تجنب الأحزمة تماماً"],
      en: ["Lots of loose layers", "Dark-light vertical color pairing", "Full monochrome head-to-toe", "Avoid belts completely"],
    },
    correct: 2,
    explanation: {
      ar: "الـ Monochrome head-to-toe يخلق خط بصري متواصل يضخم الطول والحضور.",
      en: "Full monochrome creates a continuous visual line that adds height and presence.",
    },
    xp: 20,
  },
  {
    id: "q4",
    question: {
      ar: "الـ Oversized fit دايماً يقلل من الـ style score.",
      en: "Oversized fit always reduces the style score.",
    },
    type: "truefalse",
    correct: 1,
    explanation: {
      ar: "خطأ! الـ Oversized يرفع الـ score لو كان intentional ومنسجم مع باقي الإطلالة.",
      en: "False! Oversized raises the score when it's intentional and consistent with the rest of the outfit.",
    },
    xp: 15,
  },
  {
    id: "q5",
    question: {
      ar: "أي من هذه الألوان هو neutral ويتناسب مع كل شيء؟",
      en: "Which of these colors is neutral and works with everything?",
    },
    type: "mcq",
    options: {
      ar: ["أحمر", "كحلي داكن", "برتقالي", "أخضر فاتح"],
      en: ["Red", "Dark navy", "Orange", "Light green"],
    },
    correct: 1,
    explanation: {
      ar: "الكحلي الداكن neutral بامتياز — يمشي مع الأبيض، الرمادي، البيج، والأسود.",
      en: "Dark navy is the ultimate neutral — it pairs with white, grey, beige, and black.",
    },
    xp: 20,
  },
  {
    id: "q6",
    question: {
      ar: "الـ Presence في الإطلالة يعتمد بشكل رئيسي على السعر.",
      en: "Presence in an outfit mainly depends on price.",
    },
    type: "truefalse",
    correct: 1,
    explanation: {
      ar: "خطأ! الـ Presence يعتمد على الـ fit والـ confidence والتنسيق، مش السعر.",
      en: "False! Presence depends on fit, confidence and coordination, not price.",
    },
    xp: 15,
  },
  {
    id: "q7",
    question: {
      ar: "ما الفرق الأساسي بين Streetwear وCasual؟",
      en: "What's the key difference between Streetwear and Casual?",
    },
    type: "mcq",
    options: {
      ar: ["السعر فقط", "Streetwear له هوية بصرية واضحة", "Casual أكثر تعقيداً", "لا فرق بينهم"],
      en: ["Price only", "Streetwear has a clear visual identity", "Casual is more complex", "No difference"],
    },
    correct: 1,
    explanation: {
      ar: "Streetwear له culture وهوية — graphics، sneakers، proportions محددة. Casual مجرد راحة بلا هوية.",
      en: "Streetwear has culture and identity — graphics, sneakers, specific proportions. Casual is just comfort without identity.",
    },
    xp: 20,
  },
];

// ─── DailyStyleQuiz ───────────────────────────────────────────
function DailyStyleQuiz({ lang }: { lang: string }) {
  const [mounted, setMounted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const storage = useMemo(() => safeLocalStorage(), []);

  const todayQuestion = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return QUIZ_BANK[dayOfYear % QUIZ_BANK.length];
  }, []);

  const l = lang as "ar" | "en";
  const today = new Date().toDateString();

  useEffect(() => {
    setMounted(true);
    const savedDate = storage.get("leo_quiz_date");
    const savedAnswer = storage.get("leo_quiz_answer");
    if (savedDate === today && savedAnswer !== null) {
      setAnswered(true);
      setSelected(parseInt(savedAnswer, 10));
      setShowResult(true);
    }
  }, [storage, today]);

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    setShowResult(true);
    setAnswered(true);
    storage.set("leo_quiz_date", today);
    storage.set("leo_quiz_answer", String(idx));

    const isCorrect = idx === todayQuestion.correct;
    const earned = isCorrect ? todayQuestion.xp : Math.floor(todayQuestion.xp / 2);
    setXpAwarded(earned);

    const currentXP = parseInt(storage.get("leo_quiz_xp") || "0", 10);
    storage.set("leo_quiz_xp", String(currentXP + earned));
  }, [answered, todayQuestion, storage, today]);

  if (!mounted) return null;

  const isCorrect = selected === todayQuestion.correct;
  const isTF = todayQuestion.type === "truefalse";
  const options = isTF
    ? (l === "ar" ? ["صحيح", "خطأ"] : ["True", "False"])
    : (todayQuestion.options?.[l] ?? []);

  return (
    <div className="rounded-2xl border border-[#D4AF37]/25 bg-black p-5 mb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
            {l === "ar" ? "اختبار اليوم" : "Daily Quiz"}
          </p>
          <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
            +{todayQuestion.xp} XP
          </span>
        </div>
        <span className="text-2xl">{answered ? (isCorrect ? "🏆" : "📚") : "🧠"}</span>
      </div>

      <p className="text-white text-sm font-medium leading-relaxed mb-4">
        {todayQuestion.question[l]}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => {
          let style = "border-gray-800 text-gray-400 hover:border-[#D4AF37]/40 hover:text-gray-200";
          if (showResult) {
            if (idx === todayQuestion.correct) {
              style = "border-green-500/60 bg-green-500/10 text-green-400";
            } else if (idx === selected && idx !== todayQuestion.correct) {
              style = "border-red-500/60 bg-red-500/10 text-red-400";
            } else {
              style = "border-gray-800/50 text-gray-600";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              className={`w-full text-right px-4 py-3 rounded-xl border text-sm transition-all duration-200 disabled:cursor-default ${style}`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center flex-shrink-0 ${
                  showResult && idx === todayQuestion.correct
                    ? "border-green-500 text-green-400"
                    : showResult && idx === selected
                      ? "border-red-500 text-red-400"
                      : "border-gray-700 text-gray-600"
                }`}>
                  {showResult && idx === todayQuestion.correct ? "✓" : showResult && idx === selected ? "✗" : String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className={`mt-4 rounded-xl p-4 border ${isCorrect ? "bg-green-500/8 border-green-500/25" : "bg-amber-500/8 border-amber-500/25"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-semibold ${isCorrect ? "text-green-400" : "text-amber-400"}`}>
              {isCorrect
                ? (l === "ar" ? "✅ إجابة صحيحة!" : "✅ Correct!")
                : (l === "ar" ? "❌ إجابة خاطئة" : "❌ Wrong answer")}
            </p>
            <span className="text-xs text-[#D4AF37] font-bold">+{xpAwarded} XP</span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">{todayQuestion.explanation[l]}</p>
          {answered && (
            <p className="text-gray-600 text-xs mt-2">
              {l === "ar" ? "🕐 سؤال جديد غداً" : "🕐 New question tomorrow"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LionAssistant (moved from homepage) ─────────────────────
const LionAssistant = memo(function LionAssistant({ lang }: { lang: string }) {
  const l = lang as "ar" | "en";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: l === "ar"
        ? "أهلاً! أنا LEO مستشارك الشخصي للموضة. كيف أقدر أساعدك اليوم؟ 👑"
        : "Welcome. I am LEO, your elite fashion consultant. Tell me what you want to wear.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || typing) return;

    const userMsg: Message = { role: "user", text, timestamp: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      setMessages(m => [...m, {
        role: "bot",
        text: data.reply || (l === "ar" ? "حصل خطأ، حاول مجدداً." : "I apologize, I couldn't generate a response."),
        timestamp: Date.now(),
      }]);
    } catch {
      setMessages(m => [...m, {
        role: "bot",
        text: l === "ar" ? "مشكلة في الاتصال، حاول مجدداً." : "I'm experiencing technical difficulties. Please try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, l]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }, [send]);

  const toggleChat = useCallback(() => setOpen(o => !o), []);

  const quickSuggestions = l === "ar"
    ? ["مناسبة رسمية", "إطلالة كاجوال", "موعد رومانسي"]
    : ["Formal event", "Casual look", "Date night"];

  return (
    <div className="w-full">
      {/* Toggle Header */}
      <div
        className="rounded-2xl border border-[#D4AF37]/25 bg-black overflow-hidden"
      >
        <button
          onClick={toggleChat}
          className="w-full flex items-center justify-between p-4 hover:bg-[#D4AF37]/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <img
                src="/lion.png"
                alt="LEO"
                className="w-full h-full object-contain"
                style={{ animation: "float 3.5s ease-in-out infinite" }}
              />
              <div className="absolute inset-0 rounded-full bg-[#D4AF37] blur-xl opacity-20" />
            </div>
            <div className={`text-${l === "ar" ? "right" : "left"}`}>
              <p className="text-[#D4AF37] text-sm font-semibold">
                {l === "ar" ? "اسأل LEO" : "Ask LEO"}
              </p>
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                {l === "ar" ? "متاح الآن" : "Online now"}
              </p>
            </div>
          </div>
          <span className={`text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {/* Chat Body */}
        {open && (
          <div className="border-t border-[#D4AF37]/15">
            {/* Messages */}
            <div
              className="p-4 h-72 overflow-y-auto space-y-3 text-sm"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(212,175,55,0.3) transparent" }}
            >
              {messages.map((m, i) => (
                <div key={`${m.timestamp}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-lg ${
                    m.role === "bot"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                      : "bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-black font-medium"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/15 rounded-2xl px-4 py-2.5">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {quickSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  disabled={typing}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#D4AF37]/8 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/15 transition-colors disabled:opacity-30"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex border-t border-[#D4AF37]/15 bg-[#D4AF37]/3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={typing}
                placeholder={typing
                  ? (l === "ar" ? "LEO يفكر..." : "LEO is thinking...")
                  : (l === "ar" ? "اسأل LEO أي شي عن الموضة..." : "Ask LEO anything about fashion...")}
                maxLength={300}
                className="flex-1 bg-transparent px-4 py-3 outline-none text-white text-sm placeholder:text-gray-600 disabled:opacity-50"
                dir={l === "ar" ? "rtl" : "ltr"}
                aria-label="Chat message"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || typing}
                className="px-4 text-[#D4AF37] hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
});

// ─── DailyCheckin ─────────────────────────────────────────────
function DailyCheckin({ t, lang }: { t: StreakT; lang: string }) {
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  const storage = useMemo(() => safeLocalStorage(), []);

  const todayQ = DAILY_QUESTIONS[lang as "ar" | "en"][new Date().getDay() % 7];

  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    setHoursLeft(Math.floor((midnight.getTime() - now.getTime()) / 3600000));
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedStreak = parseInt(storage.get("leo_streak") || "0", 10);
    const savedBest = parseInt(storage.get("leo_best_streak") || "0", 10);
    const lastCheckin = storage.get("leo_last_checkin");
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    setBestStreak(savedBest);

    if (lastCheckin === today) {
      setCheckedInToday(true);
      setStreak(savedStreak);
    } else if (lastCheckin === yesterday) {
      setStreak(savedStreak);
    } else if (lastCheckin && lastCheckin !== yesterday) {
      setStreak(0);
      storage.set("leo_streak", "0");
    }
  }, [storage]);

  const handleCheckin = useCallback(() => {
    if (checkedInToday) return;
    const today = new Date().toDateString();
    const lastCheckin = storage.get("leo_last_checkin");
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = lastCheckin === yesterday ? streak + 1 : 1;

    const currentBest = parseInt(storage.get("leo_best_streak") || "0", 10);
    if (newStreak > currentBest) {
      storage.set("leo_best_streak", String(newStreak));
      setBestStreak(newStreak);
    }

    setStreak(newStreak);
    setCheckedInToday(true);
    storage.set("leo_streak", String(newStreak));
    storage.set("leo_last_checkin", today);
  }, [checkedInToday, streak, storage]);

  const getStreakMsg = useCallback(() => {
    if (streak === 0) return t.streakMsg0;
    if (streak >= 14) return t.streakMsg14;
    if (streak >= 7) return t.streakMsg7;
    if (streak >= 3) return t.streakMsg3;
    return t.streakMsg1;
  }, [streak, t]);

  const getFireEmoji = useCallback(() => {
    if (streak >= 14) return "🏆";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "⚡";
    if (streak >= 1) return "✨";
    return "👋";
  }, [streak]);

  const badge = streak >= 30 ? t.badge30 : streak >= 14 ? t.badge14 : streak >= 7 ? t.badge7 : null;
  const showWarning = !checkedInToday && hoursLeft !== null && hoursLeft <= 3;

  if (!mounted) return null;

  return (
    <div className="streak-card mb-2">
      {showWarning && (
        <div className="mb-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-amber-400 text-xs text-center">
          ⚠️ {t.streakWarning.replace("{hours}", String(hoursLeft))}
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t.streakTitle}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#D4AF37]">{streak}</span>
            <span className="text-gray-400 text-sm">{t.streakDays}</span>
          </div>
          {bestStreak > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              🏅 {t.streakBestLabel}: <span className="text-[#D4AF37]">{bestStreak}</span>
            </p>
          )}
          {badge && <span className="badge-pill mt-2 inline-block">{badge}</span>}
        </div>
        <span className="streak-fire">{getFireEmoji()}</span>
      </div>

      <p className="text-gray-400 text-sm mb-4">{getStreakMsg()}</p>

      <div className="question-card mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{t.checkinQuestion}</p>
        <p className="text-gray-200 text-sm leading-relaxed">{todayQ}</p>
      </div>

      {checkedInToday
        ? <div className="checkin-btn-done">{t.checkinDone}</div>
        : (
          <button onClick={handleCheckin} className="w-full bg-[#D4AF37] py-3 rounded-xl text-black font-semibold text-sm main-cta">
            {t.checkinBtn}
          </button>
        )}

      {streak > 0 && (
        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full"
              style={{ background: i < Math.min(streak, 7) ? "#D4AF37" : "rgba(212,175,55,0.15)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StyleHistorySection ──────────────────────────────────────
function StyleHistorySection({ history, t, onClear }: {
  history: HistoryEntry[];
  t: HistoryT;
  onClear: () => void;
}) {
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [filterMinScore, setFilterMinScore] = useState<number>(0);

  const allStyles = useMemo(
    () => ["all", ...Array.from(new Set(history.map(h => h.styleType)))],
    [history]
  );

  const filtered = useMemo(() => {
    return history.filter(h => {
      const matchStyle = filterStyle === "all" || h.styleType === filterStyle;
      const matchScore = h.score >= filterMinScore;
      return matchStyle && matchScore;
    });
  }, [history, filterStyle, filterMinScore]);

  const weekComparison = useMemo(() => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 3600 * 1000;
    const thisWeek = history.filter(h => now - new Date(h.date).getTime() < oneWeek);
    const lastWeek = history.filter(h => {
      const diff = now - new Date(h.date).getTime();
      return diff >= oneWeek && diff < 2 * oneWeek;
    });
    if (!thisWeek.length || !lastWeek.length) return null;
    const avgThis = Math.round(thisWeek.reduce((s, h) => s + h.score, 0) / thisWeek.length);
    const avgLast = Math.round(lastWeek.reduce((s, h) => s + h.score, 0) / lastWeek.length);
    return { avgThis, avgLast, diff: avgThis - avgLast };
  }, [history]);

  if (history.length === 0)
    return <p className="text-gray-600 text-sm text-center mt-8">{t.historyEmpty}</p>;

  const best = Math.max(...filtered.map(h => h.score));
  const avg = filtered.length
    ? Math.round(filtered.reduce((s, h) => s + h.score, 0) / filtered.length)
    : 0;
  const maxScore = best || 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#D4AF37]">{t.historyTitle}</h3>
        <button
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors border border-gray-800 hover:border-red-400/40 px-3 py-1 rounded-full"
        >
          {t.historyClear}
        </button>
      </div>

      {weekComparison && (
        <div className="bg-black border border-[#D4AF37]/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">{t.historyWeekCompare}</p>
          <div className="flex items-center gap-2">
            <span className="text-[#D4AF37] font-bold">{weekComparison.avgThis}</span>
            <span className={`text-xs font-semibold ${weekComparison.diff > 0 ? "text-green-400" : weekComparison.diff < 0 ? "text-red-400" : "text-gray-500"}`}>
              {weekComparison.diff > 0
                ? `▲ +${weekComparison.diff} ${t.historyWeekUp}`
                : weekComparison.diff < 0
                  ? `▼ ${weekComparison.diff} ${t.historyWeekDown}`
                  : t.historyWeekSame}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <p className="text-xs text-gray-500">{t.historyFilterLabel}:</p>
        {allStyles.map(style => (
          <button
            key={style}
            onClick={() => setFilterStyle(style)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterStyle === style
                ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                : "border-gray-800 text-gray-500 hover:border-gray-600"
            }`}
          >
            {style === "all" ? t.historyFilterAll : style}
          </button>
        ))}
        <select
          value={filterMinScore}
          onChange={e => setFilterMinScore(Number(e.target.value))}
          className="text-xs bg-black border border-gray-800 text-gray-400 px-2 py-1 rounded-full ml-auto"
        >
          <option value={0}>Score: All</option>
          <option value={70}>70+</option>
          <option value={80}>80+</option>
          <option value={90}>90+</option>
        </select>
      </div>

      <div className="flex gap-3">
        <div className="stat-card">
          <p className="text-2xl font-bold text-[#D4AF37]">{filtered.length}</p>
          <p className="text-xs text-gray-500 mt-1">{t.historyTotal}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-[#D4AF37]">{best}</p>
          <p className="text-xs text-gray-500 mt-1">{t.historyBest}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-[#D4AF37]">{avg}</p>
          <p className="text-xs text-gray-500 mt-1">{t.historyAvg}</p>
        </div>
      </div>

      <div className="bg-black border border-[#D4AF37]/20 rounded-2xl p-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">{t.historyProgress}</p>
        <div className="flex items-end gap-2 h-16">
          {filtered.slice(-10).map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[9px] text-gray-600">{h.score}</span>
              <div className="history-bar" style={{ height: `${Math.round((h.score / maxScore) * 48)}px` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[...filtered].reverse().map((h, i) => (
          <div key={i} className="history-card flex items-center justify-between">
            <div>
              <p className="text-[#D4AF37] font-semibold">{h.styleType}</p>
              <p className="text-xs text-gray-500 mt-0.5">{h.fitType} · {h.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="score-bar-track w-20">
                <div className="score-bar-fill" style={{ width: h.score + "%" }} />
              </div>
              <span className="text-[#D4AF37] font-bold text-lg w-10 text-right">{h.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WishlistSection ──────────────────────────────────────────
const PRIORITY_ORDER: Record<WishlistEntry["priority"], number> = {
  high: 0,
  normal: 1,
  later: 2,
};

function WishlistSection({ wishlist, t, onDelete, onUpdateNote, onUpdatePriority }: {
  wishlist: WishlistEntry[];
  t: WishlistT;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onUpdatePriority: (id: string, priority: WishlistEntry["priority"]) => void;
}) {
  const [sortBy, setSortBy] = useState<"date" | "occasion" | "priority">("priority");

  const sorted = useMemo(() => {
    return [...wishlist].sort((a, b) => {
      if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "occasion") return a.occasion.localeCompare(b.occasion);
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
  }, [wishlist, sortBy]);

  const priorityConfig: Record<WishlistEntry["priority"], { label: string; color: string }> = {
    high:   { label: t.wishlistPriorityHigh,   color: "text-red-400 border-red-400/40 bg-red-400/10" },
    normal: { label: t.wishlistPriorityNormal, color: "text-blue-400 border-blue-400/40 bg-blue-400/10" },
    later:  { label: t.wishlistPriorityLater,  color: "text-gray-500 border-gray-700 bg-gray-800/40" },
  };

  if (wishlist.length === 0) return (
    <div className="text-center mt-8">
      <p className="text-4xl mb-3">🗂️</p>
      <p className="text-gray-600 text-sm">{t.wishlistEmpty}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#D4AF37]">{t.wishlistTitle}</h3>
        <div className="flex gap-1">
          {(["priority", "date", "occasion"] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                sortBy === opt
                  ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-gray-800 text-gray-600 hover:border-gray-600"
              }`}
            >
              {opt === "date" ? t.wishlistSortDate : opt === "occasion" ? t.wishlistSortOccasion : "⭐"}
            </button>
          ))}
        </div>
      </div>

      {sorted.map((item) => (
        <div key={item.id} className="wishlist-card">
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              <span className="wishlist-tag">{item.occasion}</span>
              <span className="wishlist-tag">{item.date}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityConfig[item.priority].color}`}>
                {priorityConfig[item.priority].label}
              </span>
            </div>
            <button onClick={() => onDelete(item.id)} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
              {t.wishlistDelete}
            </button>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-4">{item.text}</p>

          <div className="flex gap-2 mb-3">
            {(["high", "normal", "later"] as const).map(p => (
              <button
                key={p}
                onClick={() => onUpdatePriority(item.id, p)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  item.priority === p
                    ? priorityConfig[p].color
                    : "border-gray-800 text-gray-600 hover:border-gray-600"
                }`}
              >
                {priorityConfig[p].label}
              </button>
            ))}
          </div>

          <div className="border-t border-[#D4AF37]/10 pt-3">
            <p className="text-xs text-gray-600 mb-1">{t.wishlistNote}</p>
            <textarea
              className="note-input"
              rows={2}
              placeholder={t.wishlistAddNote}
              value={item.note}
              onChange={e => onUpdateNote(item.id, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MyLeoSection (default export) ───────────────────────────
export default function MyLeoSection({
  styleHistory,
  wishlist,
  isRTL,
  deleteWishlist,
  updateWishlistNote,
  updateWishlistPriority,
  clearHistory,
  t,
  lang,
}: {
  styleHistory: HistoryEntry[];
  wishlist: WishlistEntry[];
  isRTL: boolean;
  deleteWishlist: (id: string) => void;
  updateWishlistNote: (id: string, note: string) => void;
  updateWishlistPriority: (id: string, priority: WishlistEntry["priority"]) => void;
  clearHistory: () => void;
  t: T;
  lang: string;
}) {
  return (
    <div className="flex flex-col gap-6" dir={isRTL ? "rtl" : "ltr"}>

      {/* ① Streak */}
      <DailyCheckin t={t} lang={lang} />

      {/* ② Quiz اليومي */}
      <DailyStyleQuiz lang={lang} />

      {/* ③ LionAssistant */}
      <LionAssistant lang={lang} />

      {/* ④ Wishlist */}
      <WishlistSection
        wishlist={wishlist}
        t={t}
        onDelete={deleteWishlist}
        onUpdateNote={updateWishlistNote}
        onUpdatePriority={updateWishlistPriority}
      />

      {/* ⑤ History */}
      <StyleHistorySection
        history={styleHistory}
        t={t}
        onClear={clearHistory}
      />
    </div>
  );
}