"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnalysisResult {
  styleType: string; fitType: string; colorProfile: string;
  presenceRating: string; confidenceSignal: string; finalScore: number;
  scores: { color: number; fit: number; proportion: number; style: number; details: number; presence: number; };
  analysis: string; priorityFixes: string[]; styleImprovements: string[];
  weakestPiece?: string;
  styleIdentity?: string;
  instantUpgrades?: string[];
  detectedItems?: string[];
}

interface ItemAnalysisResult {
  item: string;
  score: number;
  comment: string;
  problem: string;
  decision: "KEEP" | "IMPROVE" | "REPLACE";
  solution: string;
}

export type StyleGoal = "professional" | "eyecatching" | "budget" | "identity" | null;
export type Gender = "male" | "female" | null;

const GOALS: {
  id: NonNullable<StyleGoal>;
  icon: string; ar: string; en: string; tagAr: string; tagEn: string;
}[] = [
  { id: "professional", icon: "💼", ar: "أبدو محترفاً في العمل",  en: "Look professional at work",  tagAr: "مهني",    tagEn: "Professional" },
  { id: "eyecatching",  icon: "✨", ar: "أكون لافتاً للنظر",      en: "Stand out & get noticed",    tagAr: "لافت",    tagEn: "Eye-Catching"  },
  { id: "budget",       icon: "💡", ar: "أناقة بميزانية محدودة",  en: "Look great on a budget",     tagAr: "اقتصادي", tagEn: "Budget"        },
  { id: "identity",     icon: "🎯", ar: "أبني أسلوب شخصي ثابت",  en: "Build my personal style",    tagAr: "هوية",    tagEn: "Identity"      },
];

const DAILY_CHALLENGES = [
  { icon: "👟", ar: "طوّر حذاءك اليوم",         en: "Upgrade your shoes today"       },
  { icon: "🎨", ar: "جرّب لوناً جديداً اليوم",  en: "Try a new color today"          },
  { icon: "✂️", ar: "تحقق من فتك اليوم",         en: "Check your fit today"           },
  { icon: "⌚", ar: "أضف إكسسواراً واحداً",      en: "Add one accessory today"        },
  { icon: "🧥", ar: "جرّب layering اليوم",       en: "Try layering today"             },
  { icon: "💈", ar: "اهتم بتفاصيلك اليوم",       en: "Focus on grooming details today"},
  { icon: "👔", ar: "ارتدِ قطعة classic اليوم",  en: "Wear a classic piece today"     },
];

function getDailyChallenge() {
  const dayIndex = new Date().getDay();
  return DAILY_CHALLENGES[dayIndex];
}

function getGoalSuggestions(goal: NonNullable<StyleGoal>, result: AnalysisResult, lang: string): string[] {
  const isAr = lang === "ar";
  const score = result.finalScore;
  const maps: Record<NonNullable<StyleGoal>, { ar: string[]; en: string[] }> = {
    professional: {
      ar: score >= 7.5
        ? ["إطلالتك تعكس ثقة عالية — أضف ربطة عنق أو حزاماً كلاسيكياً","ألوانك المحايدة مثالية — جرّب layering لعمق أكثر","الفت ممتاز — الخطوة التالية: استثمر في حذاء جلدي"]
        : ["ركّز على الفت أولاً — خياطة بسيطة تغيّر كل شيء","استبدل الكاجوال بمقابله الرسمي: جينز → بنطلون قماش","الألوان المحايدة (كحلي، رمادي، أبيض) أساس أي إطلالة مهنية"],
      en: score >= 7.5
        ? ["Your look radiates confidence — add a belt or tie to complete it","Neutral tones on point — try layering for depth","Great fit — next: invest in brown leather shoes"]
        : ["Fix fit first — simple tailoring changes everything","Swap casual: jeans → trousers, sneakers → loafers","Stick to neutrals: navy, charcoal, white for professionalism"],
    },
    eyecatching: {
      ar: score >= 7.5
        ? ["إطلالتك قوية — أضف إكسسواراً واحداً مميزاً كنقطة تركيز","جرّب color blocking: لونان قويان","الحضور عالي — حدد هويتك البصرية وثبّت عليها"]
        : ["اختر قطعة محورية واحدة وابنِ الإطلالة حولها","الألوان الجريئة تحتاج ألوان محايدة تحيط بها","الإكسسوار سلاحك السري: قبعة، ساعة، حذاء مميز"],
      en: score >= 7.5
        ? ["Strong look — add one statement accessory as focal point","Try color blocking: two bold colors","High presence — define your visual identity and own it"]
        : ["Pick ONE statement piece and build around it","Bold colors need neutral anchors","Accessories are your weapon: hat, watch, bold shoes"],
    },
    budget: {
      ar: score >= 7.5
        ? ["إطلالتك محكمة — الفت هو سلاحك الأقوى وهو مجاني","اهتم بالعناية: كوي ملابسك، نظّفها — الفرق ضخم","قاعدة 80/20: أنفق على الأساسيات اليومية"]
        : ["الفت أهم من السعر — خياطة بـ 5$ تحوّل ملابس رخيصة لفاخرة","متاجر الملابس المستعملة = أفضل قيمة","ابنِ قائمة 10 قطع أساسية قبل أي شراء جديد"],
      en: score >= 7.5
        ? ["Solid look — fit is your strongest free weapon","Maintenance matters: iron, clean — huge difference","80/20 rule: spend on daily basics"]
        : ["Fit beats price — $5 alteration transforms cheap clothes","Thrift stores = best value always","Build a 10-piece essentials list before buying"],
    },
    identity: {
      ar: score >= 7.5
        ? ["أسلوبك واضح — ثبّته: كرّر نفس المنطق في 70% من إطلالاتك","حدد 3 ألوان أساسية والتزم بها","ابدأ تصوير إطلالاتك لبناء مرجع بصري شخصي"]
        : ["ابحث عن 3 أشخاص يعجبك أسلوبهم وحلّله","قاعدة كل شراء: هل تتناسب مع 3 قطع عندي؟","حدد كلمتين تصفان أسلوبك المثالي واسأل: هل هذا يمثّله؟"],
      en: score >= 7.5
        ? ["Your style is clear — lock it: repeat 70% of this logic","Pick 3 signature colors and commit","Start photographing outfits for your visual archive"]
        : ["Find 3 people whose style you love and analyze them","Purchase rule: does this match 3 items I own?","Define 2 words for your ideal style — does this outfit match?"],
    },
  };
  return isAr ? maps[goal].ar : maps[goal].en;
}

const LOADING_STEPS = [
  { icon: "🔍", ar: "مسح تفاصيل الإطلالة...",  en: "Scanning outfit details..."    },
  { icon: "🎨", ar: "تحليل تناسق الألوان...",   en: "Analyzing color harmony..."    },
  { icon: "👔", ar: "تقييم الفت والتناسب...",   en: "Evaluating fit & proportion..." },
  { icon: "✨", ar: "قياس تناسق الستايل...",    en: "Measuring style consistency..."  },
  { icon: "💎", ar: "حساب نقاط الحضور...",      en: "Calculating presence score..."   },
  { icon: "📊", ar: "توليد نتائجك...",          en: "Generating your results..."      },
];

function AnalysisLoader({ lang }: { lang: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const isAr = lang === "ar";
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => (i < LOADING_STEPS.length - 1 ? i + 1 : i));
    }, 2200);
    return () => clearInterval(interval);
  }, []);
  const step = LOADING_STEPS[stepIndex];
  return (
    <div className="w-full flex flex-col items-center gap-4 py-4">
      <div className="text-4xl" style={{ animation: "pulse 1s ease-in-out infinite" }}>{step.icon}</div>
      <p className="text-[#D4AF37] text-sm font-medium tracking-wide">{isAr ? step.ar : step.en}</p>
      <div className="flex gap-2 mt-1">
        {LOADING_STEPS.map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-500"
            style={{ width: i === stepIndex ? "20px" : "6px", height: "6px", background: i <= stepIndex ? "#D4AF37" : "rgba(212,175,55,0.2)" }} />
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const pct = (score / 10) * 100;
  const offset = circumference - (pct / 100) * circumference;
  const color = score >= 7.5 ? "#D4AF37" : score >= 5 ? "#E5A020" : "#C0392B";
  return (
    <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="10" />
        <circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: "#D4AF37", lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: 11, color: "#888", marginTop: 2 }}>/10</span>
        <span style={{ fontSize: 12, color, fontWeight: 600, marginTop: 4 }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function ConfidenceMeter({ score, lang }: { score: number; lang: string }) {
  const isAr = lang === "ar";
  const level = score >= 8.5 ? { label: isAr ? "مسيطر" : "Dominant",  color: "#D4AF37", icon: "👑" }
              : score >= 7   ? { label: isAr ? "واثق"  : "Confident",  color: "#27AE60", icon: "💪" }
              : score >= 5.5 ? { label: isAr ? "متوسط" : "Average",    color: "#E5A020", icon: "😐" }
              :                { label: isAr ? "ضعيف"  : "Needs Work", color: "#C0392B", icon: "⚠️" };
  return (
    <div style={{
      background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.2)",
      borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <p style={{ color: "#555", fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {isAr ? "مستوى الثقة" : "Confidence Level"}
        </p>
        <p style={{ color: level.color, fontWeight: 700, fontSize: 18, margin: 0 }}>
          {isAr ? `تبدو بثقة ${score.toFixed(1)}/10` : `You look ${score.toFixed(1)}/10 confident`}
        </p>
      </div>
      <div style={{ fontSize: 32 }}>{level.icon}</div>
    </div>
  );
}

function PresenceBreakdown({ scores, lang, t }: { scores: AnalysisResult["scores"]; lang: string; t: any }) {
  const isAr = lang === "ar";
  const bars = [
    { label: isAr ? "فت" : "Fit",       val: scores.fit,        icon: "✂️" },
    { label: isAr ? "ألوان" : "Color",   val: scores.color,      icon: "🎨" },
    { label: isAr ? "ستايل" : "Style",   val: scores.style,      icon: "✨" },
    { label: isAr ? "حضور" : "Presence", val: scores.presence,   icon: "👑" },
  ];
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "20px" }}>
      <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 13, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {isAr ? "تفصيل الحضور" : "Presence Breakdown"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {bars.map((b, i) => {
          const color = b.val >= 75 ? "#D4AF37" : b.val >= 55 ? "#E5A020" : "#C0392B";
          return (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <span style={{ color, fontWeight: 800, fontSize: 22 }}>{Math.round(b.val / 10)}</span>
              </div>
              <p style={{ color: "#888", fontSize: 12, margin: "0 0 6px" }}>{b.label}</p>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                <div style={{ height: "100%", width: b.val + "%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeakestPiece({ weakestPiece, lang, onFix }: { weakestPiece: string; lang: string; onFix: () => void }) {
  const isAr = lang === "ar";
  const itemLabels: Record<string, { ar: string; en: string; icon: string }> = {
    top:         { ar: "القطعة العلوية", en: "Top",         icon: "👕" },
    pants:       { ar: "البنطلون",       en: "Pants",       icon: "👖" },
    shoes:       { ar: "الأحذية",        en: "Shoes",       icon: "👟" },
    accessories: { ar: "الإكسسوارات",    en: "Accessories", icon: "⌚" },
    fit:         { ar: "الفت",           en: "Fit",         icon: "✂️" },
    color:       { ar: "الألوان",        en: "Colors",      icon: "🎨" },
  };
  const meta = itemLabels[weakestPiece] ?? { ar: weakestPiece, en: weakestPiece, icon: "⚠️" };
  return (
    <div style={{
      background: "rgba(231,76,60,0.07)", border: "1px solid rgba(231,76,60,0.35)",
      borderRadius: 16, padding: "18px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>{meta.icon}</span>
        <div>
          <p style={{ color: "#E74C3C", fontWeight: 700, fontSize: 12, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {isAr ? "❗ أضعف نقطة عندك" : "❗ Your Weakest Point"}
          </p>
          <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}>
            {isAr ? meta.ar : meta.en}
          </p>
        </div>
      </div>
      <button onClick={onFix} style={{
        background: "#E74C3C", color: "white", fontWeight: 700, fontSize: 12,
        padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer",
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {isAr ? "صلحها أولاً" : "Fix This First"}
      </button>
    </div>
  );
}

function BeforeAfter({ solution, imageFile, lang }: { solution: string; imageFile: File | null; lang: string }) {
  const isAr = lang === "ar";
  const [imgSrc, setImgSrc] = useState("");
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  return (
    <div style={{ border: "1px solid rgba(212,175,55,0.25)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: "16px", borderRight: "1px solid rgba(212,175,55,0.15)" }}>
          <p style={{ color: "#C0392B", fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {isAr ? "قبل" : "BEFORE"}
          </p>
          {imgSrc
            ? <img src={imgSrc} alt="before" style={{ width: "100%", borderRadius: 10, maxHeight: 140, objectFit: "cover" }} />
            : <div style={{ width: "100%", height: 100, background: "rgba(255,255,255,0.04)", borderRadius: 10 }} />
          }
          <p style={{ color: "#666", fontSize: 12, margin: "8px 0 0" }}>
            {isAr ? "الإطلالة الحالية" : "Current look"}
          </p>
        </div>
        <div style={{ padding: "16px", background: "rgba(212,175,55,0.03)" }}>
          <p style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {isAr ? "بعد" : "AFTER"}
          </p>
          <div style={{
            width: "100%", minHeight: 100, background: "rgba(212,175,55,0.06)",
            border: "1px dashed rgba(212,175,55,0.3)", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "12px",
          }}>
            <p style={{ color: "#D4AF37", fontSize: 13, fontWeight: 500, textAlign: "center", lineHeight: 1.5, margin: 0 }}>
              ✨ {solution}
            </p>
          </div>
          <p style={{ color: "#555", fontSize: 12, margin: "8px 0 0" }}>
            {isAr ? "الإطلالة المثالية" : "Upgraded look"}
          </p>
        </div>
      </div>
    </div>
  );
}

function StyleIdentityBadge({ styleIdentity, lang }: { styleIdentity: string; lang: string }) {
  const isAr = lang === "ar";
  const isUndefined = styleIdentity?.toLowerCase().includes("undefined") || styleIdentity?.toLowerCase().includes("غير محدد");
  return (
    <div style={{
      background: isUndefined ? "rgba(231,76,60,0.06)" : "rgba(212,175,55,0.06)",
      border: `1px solid ${isUndefined ? "rgba(231,76,60,0.3)" : "rgba(212,175,55,0.3)"}`,
      borderRadius: 14, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 28 }}>{isUndefined ? "🌀" : "🎯"}</span>
      <div>
        <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {isAr ? "هويتك البصرية" : "Style Identity"}
        </p>
        <p style={{ color: isUndefined ? "#E74C3C" : "#D4AF37", fontWeight: 700, fontSize: 16, margin: 0 }}>
          {styleIdentity}
        </p>
      </div>
    </div>
  );
}

function DailyChallenge({ lang }: { lang: string }) {
  const isAr = lang === "ar";
  const challenge = getDailyChallenge();
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))",
      border: "1px solid rgba(212,175,55,0.3)", borderRadius: 14, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>{challenge.icon}</span>
      <div>
        <p style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {isAr ? "🔥 تحديك اليوم" : "🔥 Today's Challenge"}
        </p>
        <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: 0 }}>
          {isAr ? challenge.ar : challenge.en}
        </p>
      </div>
    </div>
  );
}

function InstantUpgrade({ upgrades, lang }: { upgrades: string[]; lang: string }) {
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  return (
    <div>
      {!open && (
        <button onClick={() => setOpen(true)} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: "linear-gradient(135deg, #D4AF37, #E5C158)",
          color: "black", fontWeight: 800, fontSize: 15,
          border: "none", cursor: "pointer", letterSpacing: "0.3px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
        }}>
          ⚡ {isAr ? "طوّر إطلالتك الآن" : "Upgrade My Look"}
        </button>
      )}
      {open && (
        <div style={{
          background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.35)",
          borderRadius: 16, padding: "20px", animation: "reveal 0.35s ease",
        }}>
          <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 14, margin: "0 0 14px", textAlign: "center" }}>
            ⚡ {isAr ? "تغييرات فورية لإطلالتك" : "Instant Look Upgrades"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upgrades.map((u, i) => (
              <div key={i} style={{
                background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <span style={{ color: "#D4AF37", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{i + 1}.</span>
                <p style={{ color: "white", fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{u}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setOpen(false)} style={{
            width: "100%", marginTop: 12, background: "transparent",
            border: "none", color: "#555", fontSize: 12, cursor: "pointer",
          }}>
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      )}
    </div>
  );
}

function ImagePreview({ file }: { file: File }) {
  const [src, setSrc] = React.useState<string>("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!src) return null;
  return (
    <img src={src} alt="Outfit preview"
      style={{ borderRadius: 12, border: "1px solid rgba(212,175,55,0.3)", maxHeight: 260, objectFit: "contain" }}
      className="image-fade-in" />
  );
}

function GoalSelector({ currentGoal, onChange, lang }: { currentGoal: StyleGoal; onChange: (g: StyleGoal) => void; lang: string }) {
  const isAr = lang === "ar";
  return (
    <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "16px 20px" }}>
      <p style={{ color: "#888", fontSize: 11, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
        {isAr ? "هدفك من الأسلوب" : "Your style goal"}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {GOALS.map(g => (
          <button key={g.id} type="button" onClick={() => onChange(g.id === currentGoal ? null : g.id)}
            style={{
              border: `1px solid ${currentGoal === g.id ? "#D4AF37" : "rgba(212,175,55,0.25)"}`,
              background: currentGoal === g.id ? "rgba(212,175,55,0.15)" : "transparent",
              color: currentGoal === g.id ? "#D4AF37" : "#888",
              padding: "6px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              fontWeight: currentGoal === g.id ? 600 : 400, transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 5,
            }}>
            <span>{g.icon}</span><span>{isAr ? g.tagAr : g.tagEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AdaptiveItemSelector({
  detectedItems, lang, onSelect, onClose,
}: {
  detectedItems: string[];
  lang: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const isAr = lang === "ar";
  const ALL_ITEMS = [
    { id: "top",         icon: "👕", ar: "القطعة العلوية", en: "Top"         },
    { id: "pants",       icon: "👖", ar: "البنطلون",       en: "Pants"       },
    { id: "shoes",       icon: "👟", ar: "الأحذية",        en: "Shoes"       },
    { id: "accessories", icon: "⌚", ar: "الإكسسوارات",    en: "Accessories" },
    { id: "hijab",       icon: "🧕", ar: "الحجاب",         en: "Hijab"       },
    { id: "blazer",      icon: "🧥", ar: "البليزر",        en: "Blazer"      },
  ];
  const visibleItems = detectedItems?.length
    ? ALL_ITEMS.filter(i => detectedItems.includes(i.id))
    : ALL_ITEMS.slice(0, 4);

  return (
    <div style={{
      background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.25)",
      borderRadius: 16, padding: "20px", animation: "reveal 0.3s ease",
    }}>
      <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 14, marginBottom: 6, textAlign: "center" }}>
        {isAr ? "اختر القطعة اللي تبي تحللها" : "Which piece do you want to analyze?"}
      </p>
      <p style={{ color: "#555", fontSize: 12, textAlign: "center", marginBottom: 14 }}>
        {isAr ? "تم اكتشاف هذه القطع في صورتك" : "These pieces were detected in your photo"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {visibleItems.map(item => (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)}
            style={{
              padding: "16px 12px", borderRadius: 14, cursor: "pointer",
              border: "1px solid rgba(212,175,55,0.25)",
              background: "transparent", transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4AF37"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.25)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <span style={{ color: "#ccc", fontSize: 13, fontWeight: 500 }}>{isAr ? item.ar : item.en}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onClose}
        style={{ width: "100%", marginTop: 12, background: "transparent", border: "none", color: "#555", fontSize: 12, cursor: "pointer" }}>
        {isAr ? "إلغاء" : "Cancel"}
      </button>
    </div>
  );
}

function ItemAnalysisCard({ result, lang, imageFile }: { result: ItemAnalysisResult; lang: string; imageFile: File | null }) {
  const isAr = lang === "ar";
  const decisionConfig = {
    KEEP:    { color: "#27AE60", bg: "rgba(39,174,96,0.1)",   border: "rgba(39,174,96,0.3)",  icon: "✅", ar: "احتفظ بها", en: "KEEP"    },
    IMPROVE: { color: "#E5A020", bg: "rgba(229,160,32,0.1)",  border: "rgba(229,160,32,0.3)", icon: "⚠️", ar: "حسّنها",   en: "IMPROVE" },
    REPLACE: { color: "#E74C3C", bg: "rgba(231,76,60,0.1)",   border: "rgba(231,76,60,0.3)",  icon: "🔄", ar: "استبدلها", en: "REPLACE" },
  };
  const dc = decisionConfig[result.decision];
  const scoreColor = result.score >= 7.5 ? "#D4AF37" : result.score >= 5 ? "#E5A020" : "#C0392B";
  const itemLabels: Record<string, { ar: string; en: string; icon: string }> = {
    top:         { ar: "القطعة العلوية", en: "Top",         icon: "👕" },
    pants:       { ar: "البنطلون",       en: "Pants",       icon: "👖" },
    shoes:       { ar: "الأحذية",        en: "Shoes",       icon: "👟" },
    accessories: { ar: "الإكسسوارات",    en: "Accessories", icon: "⌚" },
    hijab:       { ar: "الحجاب",         en: "Hijab",       icon: "🧕" },
    blazer:      { ar: "البليزر",        en: "Blazer",      icon: "🧥" },
  };
  const itemMeta = itemLabels[result.item] ?? { ar: result.item, en: result.item, icon: "👔" };

  return (
    <div style={{
      background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.25)",
      borderRadius: 20, padding: "24px", animation: "reveal 0.5s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>{itemMeta.icon}</span>
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>{isAr ? itemMeta.ar : itemMeta.en}</p>
            <p style={{ color: "#555", fontSize: 11, margin: 0 }}>{isAr ? "تحليل عميق" : "Deep Analysis"}</p>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: scoreColor, fontWeight: 800, fontSize: 28, margin: 0, lineHeight: 1 }}>{result.score.toFixed(1)}</p>
          <p style={{ color: "#555", fontSize: 10, margin: 0 }}>/10</p>
        </div>
      </div>
      <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{result.comment}</p>
      <div style={{ background: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
        <p style={{ color: "#E74C3C", fontSize: 11, fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {isAr ? "المشكلة الأساسية" : "Core Problem"}
        </p>
        <p style={{ color: "#ccc", fontSize: 13, margin: 0 }}>{result.problem}</p>
      </div>
      <div style={{ background: dc.bg, border: `1px solid ${dc.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 28 }}>{dc.icon}</span>
        <div>
          <p style={{ color: dc.color, fontWeight: 800, fontSize: 18, margin: 0 }}>{isAr ? dc.ar : dc.en}</p>
          <p style={{ color: "#666", fontSize: 11, margin: 0 }}>{isAr ? "قرار LEO" : "LEO's Decision"}</p>
        </div>
      </div>
      <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
        <p style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {isAr ? "الحل المباشر" : "Direct Solution"}
        </p>
        <p style={{ color: "white", fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>"{result.solution}"</p>
      </div>
      <BeforeAfter solution={result.solution} imageFile={imageFile} lang={lang} />
    </div>
  );
}

function FullOnboarding({ onComplete, lang }: {
  onComplete: (data: { gender: "male" | "female"; hijab: boolean; goal: NonNullable<StyleGoal> }) => void;
  lang: string;
}) {
  const isAr = lang === "ar";
  const [step, setStep] = useState<"gender" | "goal">("gender");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [hijab, setHijab] = useState<boolean | null>(null);

  function handleGenderNext() {
    if (!gender) return;
    if (gender === "female" && hijab === null) return;
    setStep("goal");
  }

  return (
    <div className="w-full bg-black border border-[#D4AF37]/30 p-8 rounded-2xl flex flex-col gap-6">
      {step === "gender" && (
        <>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 13, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>
              {isAr ? "خطوة 1 من 2" : "Step 1 of 2"}
            </p>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: 0 }}>{isAr ? "أنت ذكر أو أنثى؟" : "Are you male or female?"}</h2>
            <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>{isAr ? "يساعدنا هذا في تخصيص التحليل لك" : "This helps us personalize your analysis"}</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ val: "male" as const, icon: "👔", ar: "ذكر", en: "Male" }, { val: "female" as const, icon: "👗", ar: "أنثى", en: "Female" }].map(opt => (
              <button key={opt.val} type="button"
                onClick={() => { setGender(opt.val); if (opt.val === "male") setHijab(false); }}
                style={{
                  flex: 1, padding: "20px 16px", borderRadius: 16, cursor: "pointer",
                  border: `2px solid ${gender === opt.val ? "#D4AF37" : "rgba(212,175,55,0.2)"}`,
                  background: gender === opt.val ? "rgba(212,175,55,0.1)" : "transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all 0.2s",
                }}>
                <span style={{ fontSize: 32 }}>{opt.icon}</span>
                <span style={{ color: gender === opt.val ? "#D4AF37" : "#888", fontWeight: 600, fontSize: 15 }}>{isAr ? opt.ar : opt.en}</span>
              </button>
            ))}
          </div>
          {gender === "female" && (
            <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "16px 20px" }}>
              <p style={{ color: "#D4AF37", fontWeight: 600, fontSize: 14, marginBottom: 12, textAlign: "center" }}>{isAr ? "هل أنتِ محجبة؟" : "Do you wear hijab?"}</p>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ val: true, ar: "نعم، محجبة", en: "Yes, I wear hijab" }, { val: false, ar: "لا", en: "No" }].map(opt => (
                  <button key={String(opt.val)} type="button" onClick={() => setHijab(opt.val)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
                      border: `1px solid ${hijab === opt.val ? "#D4AF37" : "rgba(212,175,55,0.2)"}`,
                      background: hijab === opt.val ? "rgba(212,175,55,0.15)" : "transparent",
                      color: hijab === opt.val ? "#D4AF37" : "#888",
                      fontWeight: hijab === opt.val ? 600 : 400, fontSize: 13, transition: "all 0.2s",
                    }}>{isAr ? opt.ar : opt.en}</button>
                ))}
              </div>
            </div>
          )}
          <button type="button"
            disabled={!gender || (gender === "female" && hijab === null)}
            onClick={handleGenderNext}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: (!gender || (gender === "female" && hijab === null)) ? "rgba(212,175,55,0.2)" : "#D4AF37",
              color: "black", fontWeight: 700, fontSize: 15,
              cursor: (!gender || (gender === "female" && hijab === null)) ? "not-allowed" : "pointer",
            }}>
            {isAr ? "التالي →" : "Next →"}
          </button>
        </>
      )}
      {step === "goal" && (
        <>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 13, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>{isAr ? "خطوة 2 من 2" : "Step 2 of 2"}</p>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: 0 }}>{isAr ? "ما هو هدفك من الأسلوب؟" : "What's your style goal?"}</h2>
            <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>{isAr ? "يخصّص LEO التحليل بناءً على هدفك" : "LEO personalizes analysis based on your goal"}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GOALS.map(g => (
              <button key={g.id} type="button"
                onClick={() => onComplete({ gender: gender!, hijab: hijab ?? false, goal: g.id })}
                style={{
                  background: "transparent", border: "1px solid rgba(212,175,55,0.25)",
                  borderRadius: 16, padding: "16px 20px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14, textAlign: isAr ? "right" : "left", transition: "all 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4AF37"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.25)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: 0 }}>{isAr ? g.ar : g.en}</p>
                </div>
                <span style={{ color: "#D4AF37", fontSize: 16, flexShrink: 0 }}>{isAr ? "←" : "→"}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep("gender")}
            style={{ background: "transparent", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>
            {isAr ? "← رجوع" : "← Back"}
          </button>
        </>
      )}
    </div>
  );
}

function GoalSuggestions({ goal, result, lang }: { goal: NonNullable<StyleGoal>; result: AnalysisResult; lang: string }) {
  const isAr = lang === "ar";
  const suggestions = getGoalSuggestions(goal, result, lang);
  const goalMeta = GOALS.find(g => g.id === goal)!;
  return (
    <div style={{ border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "20px 24px", background: "rgba(212,175,55,0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{goalMeta.icon}</span>
        <div>
          <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 13, margin: 0 }}>{isAr ? "اقتراحات مخصصة لك" : "Personalized for your goal"}</p>
          <p style={{ color: "#555", fontSize: 11, margin: 0 }}>{isAr ? goalMeta.tagAr : goalMeta.tagEn}</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#D4AF37", fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
            <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Limit Banner Component ───────────────────────────────────
function LimitBanner({ isGuest, lang, onSignup, onUpgrade }: {
  isGuest: boolean;
  lang: string;
  onSignup?: () => void;
  onUpgrade?: () => void;
}) {
  const isAr = lang === "ar";
  if (isGuest) {
    return (
      <div style={{
        background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.35)",
        borderRadius: 16, padding: "20px 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>🔒</p>
        <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>
          {isAr ? "جرّبت تحليلك المجاني!" : "You used your free analysis!"}
        </p>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px", lineHeight: 1.6 }}>
          {isAr
            ? "سجّل مجاناً وحصّل 3 تحليلات يومية مجانية"
            : "Sign up free and get 3 daily analyses"}
        </p>
        <button onClick={onSignup} style={{
          background: "#D4AF37", color: "black", fontWeight: 700,
          padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14,
        }}>
          ✨ {isAr ? "إنشاء حساب مجاني" : "Create Free Account"}
        </button>
      </div>
    );
  }
  return (
    <div style={{
      background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.35)",
      borderRadius: 16, padding: "20px 24px", textAlign: "center",
    }}>
      <p style={{ fontSize: 28, marginBottom: 8 }}>⏰</p>
      <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>
        {isAr ? "استنفدت تحليلاتك اليومية المجانية" : "Daily free analyses used up"}
      </p>
      <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px", lineHeight: 1.6 }}>
        {isAr
          ? "ترجع غداً بـ 3 تحليلات جديدة، أو طوّر خطتك للحصول على تحليلات غير محدودة"
          : "Come back tomorrow for 3 new analyses, or upgrade for unlimited"}
      </p>
      <button onClick={onUpgrade} style={{
        background: "#D4AF37", color: "black", fontWeight: 700,
        padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14,
      }}>
        👑 {isAr ? "طوّر خطتك" : "Upgrade Plan"}
      </button>
    </div>
  );
}

interface AnalyzeSectionProps {
  analysisImage: File | null;
  setAnalysisImage: (f: File | null) => void;
  analysisLoading: boolean;
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  setAnalysisResult: (r: AnalysisResult | null) => void;
  setAnalysisError: (e: string | null) => void;
  analysisCount: number;
  cameraOpen: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  limitReached: boolean;
  handleAnalyzeOutfit: () => void;
  handleOpenCamera: () => void;
  handleCapturePhoto: () => void;
  handleCloseCamera: () => void;
  onUpgrade?: () => void;
  onSignUp?: () => void;
  lang: string;
  styleGoal: StyleGoal;
  setStyleGoal: (g: StyleGoal) => void;
  accessToken?: string | null;
  isGuest?: boolean;
  t: {
    analyzeTitle: string; analyzeSubtitle: string; uploadBtn: string; cameraBtn: string;
    captureBtn: string; cancelBtn: string; limitMsg: string; analyzeBtn: string;
    analyzingBtn: string; remainingMsg: string; errorMsg: string; finalScore: string;
    styleType: string; fitQuality: string; colorHarmony: string; presenceRating: string;
    confidenceSignal: string; scoreBreakdown: string; fitScore: string; colorScore: string;
    proportionScore: string; styleScore: string; detailsScore: string; presenceScore: string;
    analysisLabel: string; priorityFixes: string; styleImprovements: string;
  };
}

export default function AnalyzeSection({
  analysisImage, setAnalysisImage, analysisLoading, analysisResult,
  analysisError, setAnalysisResult, setAnalysisError, analysisCount,
  cameraOpen, videoRef, canvasRef,
  handleAnalyzeOutfit, handleOpenCamera, handleCapturePhoto, handleCloseCamera,
  onUpgrade, onSignUp, lang, styleGoal, setStyleGoal, accessToken, isGuest = false, t,
}: AnalyzeSectionProps) {
  const isAr = lang === "ar";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userGender, setUserGender] = useState<"male" | "female" | null>(null);
  const [userHijab, setUserHijab] = useState<boolean>(false);

  const [showItemSelector, setShowItemSelector] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemResult, setItemResult] = useState<ItemAnalysisResult | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);

  // ─── Limit thresholds ────────────────────────────────────────
  // Guest: 1 free analysis. Logged-in: 3 free analyses/day.
  const freeLimit = isGuest ? 1 : 3;
  const limitReached = analysisCount >= freeLimit;

  useEffect(() => {
    const savedGoal   = localStorage.getItem("leo_style_goal");
    const savedGender = localStorage.getItem("leo_gender");
    if (!savedGoal || !savedGender) {
      setShowOnboarding(true);
    } else {
      setUserGender(savedGender as "male" | "female");
      setUserHijab(localStorage.getItem("leo_hijab") === "true");
    }
  }, []);

  function handleOnboardingComplete(data: { gender: "male" | "female"; hijab: boolean; goal: NonNullable<StyleGoal> }) {
    localStorage.setItem("leo_gender",     data.gender);
    localStorage.setItem("leo_hijab",      String(data.hijab));
    localStorage.setItem("leo_style_goal", data.goal);
    setUserGender(data.gender);
    setUserHijab(data.hijab);
    setStyleGoal(data.goal);
    setShowOnboarding(false);
  }

  async function handleItemAnalysis(itemId: string) {
    if (!analysisImage) return;
    setShowItemSelector(false);
    setItemLoading(true);
    setItemResult(null);
    setItemError(null);
    try {
      const canvas = document.createElement("canvas");
      const img = new window.Image();
      const url = URL.createObjectURL(analysisImage);
      await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = url; });
      const MAX = 1024;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX; } else { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const base64 = canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
      const { data: sessionData } = await (await import("../lib/supabase")).supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? null;
      const res = await fetch("/api/analyze-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64, language: lang, accessToken: token,
          gender: localStorage.getItem("leo_gender") ?? "male",
          hijab: localStorage.getItem("leo_hijab") === "true",
          mode: "item", item: itemId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.itemResult) throw new Error(data?.error || "No result");
      setItemResult(data.itemResult);
    } catch {
      setItemError(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again");
    } finally {
      setItemLoading(false);
    }
  }

  if (showOnboarding) return <FullOnboarding onComplete={handleOnboardingComplete} lang={lang} />;

  return (
    <div className="flex flex-col gap-5">

      <div style={{ textAlign: "center" }}>
        <h2 className="text-2xl font-semibold text-[#D4AF37]">{t.analyzeTitle}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.analyzeSubtitle}</p>
      </div>

      <DailyChallenge lang={lang} />

      <GoalSelector currentGoal={styleGoal} onChange={g => {
        setStyleGoal(g);
        if (g) localStorage.setItem("leo_style_goal", g);
        else localStorage.removeItem("leo_style_goal");
      }} lang={lang} />

      {/* ─── Upload/Camera box — only show if limit not reached ── */}
      {!limitReached && (
        <div className="w-full bg-black border border-[#D4AF37]/30 p-8 rounded-2xl flex flex-col items-center gap-5">
          <div className="flex gap-3 flex-wrap justify-center">
            <input id="analysis-file-input" type="file" accept="image/*" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0] ?? null;
                setAnalysisImage(file);
                setAnalysisResult(null);
                setAnalysisError(null);
                setItemResult(null);
                e.target.value = "";
              }}
            />
            <label htmlFor="analysis-file-input" className="btn-outline cursor-pointer">
              {analysisImage && !cameraOpen
                ? analysisImage.name.slice(0, 20) + (analysisImage.name.length > 20 ? "..." : "")
                : t.uploadBtn}
            </label>
            <button type="button" onClick={handleOpenCamera} className="btn-outline">{t.cameraBtn}</button>
          </div>

          {cameraOpen && (
            <div className="w-full flex flex-col items-center gap-3">
              <video ref={videoRef} className="rounded-xl border border-[#D4AF37]/30 w-full max-h-64 object-cover" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3">
                <button type="button" onClick={handleCapturePhoto} className="btn-outline">{t.captureBtn}</button>
                <button type="button" onClick={handleCloseCamera} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{t.cancelBtn}</button>
              </div>
            </div>
          )}

          {analysisImage && !cameraOpen && <ImagePreview file={analysisImage} />}
          {analysisLoading && <AnalysisLoader lang={lang} />}

          <button type="button" onClick={handleAnalyzeOutfit}
            disabled={!analysisImage || analysisLoading}
            className="w-full bg-[#D4AF37] py-4 rounded-xl text-black font-medium flex items-center justify-center gap-2 main-cta">
            {analysisLoading ? <><span className="loader" /> {t.analyzingBtn}</> : t.analyzeBtn}
          </button>

          {analysisError && <p className="text-sm text-red-400 text-center">{analysisError}</p>}
        </div>
      )}

      {/* ─── Limit Banner ─────────────────────────────────────── */}
      {limitReached && !analysisResult && (
        <LimitBanner
          isGuest={isGuest}
          lang={lang}
          onSignup={onSignUp}
          onUpgrade={onUpgrade}
        />
      )}

      {/* ─── Results ─────────────────────────────────────────── */}
      {analysisResult && (
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-black/40 backdrop-blur-xl p-8 w-full result-enter space-y-7">

          <div className="text-center pb-4 border-b border-[#D4AF37]/10">
            <ScoreRing score={analysisResult.finalScore} />
            <p className="text-base font-bold text-white mt-4">Presence Score</p>
            <p className="text-xs text-gray-500 mt-1">How powerful your look feels</p>
          </div>

          <ConfidenceMeter score={analysisResult.finalScore} lang={lang} />

          {analysisResult.styleIdentity && (
            <StyleIdentityBadge styleIdentity={analysisResult.styleIdentity} lang={lang} />
          )}

          <PresenceBreakdown scores={analysisResult.scores} lang={lang} t={t} />

          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: t.styleType,        val: analysisResult.styleType        },
              { label: t.fitQuality,       val: analysisResult.fitType          },
              { label: t.colorHarmony,     val: analysisResult.colorProfile     },
              { label: t.presenceRating,   val: analysisResult.presenceRating   },
              { label: t.confidenceSignal, val: analysisResult.confidenceSignal },
            ].map((item, i) => item.val ? (
              <div key={i} className="flex flex-col items-center border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-2 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{item.label}</span>
                <span className="text-[#D4AF37] font-semibold text-sm mt-0.5">{item.val}</span>
              </div>
            ) : null)}
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-widest">{t.scoreBreakdown}</p>
            {[
              { label: t.fitScore,        val: analysisResult.scores.fit        },
              { label: t.colorScore,      val: analysisResult.scores.color      },
              { label: t.proportionScore, val: analysisResult.scores.proportion },
              { label: t.styleScore,      val: analysisResult.scores.style      },
              { label: t.detailsScore,    val: analysisResult.scores.details    },
              { label: t.presenceScore,   val: analysisResult.scores.presence   },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-24 shrink-0">{item.label}</span>
                <div className="score-bar-track flex-1">
                  <div className="score-bar-fill" style={{ width: (item.val ?? 0) + "%" }} />
                </div>
                <span className="text-[#D4AF37] font-semibold text-sm w-8 text-right">{item.val}</span>
              </div>
            ))}
          </div>

          {analysisResult.weakestPiece && (
            <WeakestPiece
              weakestPiece={analysisResult.weakestPiece}
              lang={lang}
              onFix={() => { setShowItemSelector(true); }}
            />
          )}

          {analysisResult.analysis && (
            <div className="border-t border-[#D4AF37]/10 pt-5 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-widest">{t.analysisLabel}</p>
              <p className="text-gray-300 text-sm leading-relaxed">{analysisResult.analysis}</p>
            </div>
          )}

          {analysisResult.priorityFixes?.length > 0 && (
            <div className="border-t border-[#D4AF37]/10 pt-5 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-widest">{t.priorityFixes}</p>
              <ol className="space-y-2">
                {analysisResult.priorityFixes.map((fix, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-[#D4AF37] font-bold shrink-0">{i + 1}.</span>
                    <span>{fix}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {analysisResult.styleImprovements?.length > 0 && (
            <div className="border-t border-[#D4AF37]/10 pt-5 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-widest">{t.styleImprovements}</p>
              <ul className="space-y-2">
                {analysisResult.styleImprovements.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-[#D4AF37] mt-0.5 shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {styleGoal && (
            <div className="border-t border-[#D4AF37]/10 pt-5">
              <GoalSuggestions goal={styleGoal} result={analysisResult} lang={lang} />
            </div>
          )}

          {analysisResult.instantUpgrades?.length ? (
            <div className="border-t border-[#D4AF37]/10 pt-5">
              <InstantUpgrade upgrades={analysisResult.instantUpgrades} lang={lang} />
            </div>
          ) : null}

          {/* ─── After result: show limit banner if reached ─── */}
          {limitReached && (
            <div className="border-t border-[#D4AF37]/10 pt-5">
              <LimitBanner
                isGuest={isGuest}
                lang={lang}
                onSignup={onSignUp}
                onUpgrade={onUpgrade}
              />
            </div>
          )}

          <div className="border-t border-[#D4AF37]/10 pt-6 space-y-4">
            {!showItemSelector && !itemResult && !itemLoading && (
              <button
                type="button"
                onClick={() => setShowItemSelector(true)}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  border: "1px solid rgba(212,175,55,0.4)",
                  background: "rgba(212,175,55,0.05)",
                  color: "#D4AF37", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.05)"}
              >
                🔬 {isAr ? "تحليل قطعة محددة" : "Analyze Specific Piece"}
              </button>
            )}

            {showItemSelector && (
              <AdaptiveItemSelector
                detectedItems={analysisResult.detectedItems ?? []}
                lang={lang}
                onSelect={handleItemAnalysis}
                onClose={() => setShowItemSelector(false)}
              />
            )}

            {itemLoading && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: 32, height: 32, border: "3px solid rgba(212,175,55,0.2)",
                  borderTopColor: "#D4AF37", borderRadius: "50%",
                  animation: "spin 0.6s linear infinite", margin: "0 auto 12px",
                }} />
                <p style={{ color: "#D4AF37", fontSize: 13 }}>{isAr ? "LEO يحلل القطعة..." : "LEO is analyzing the piece..."}</p>
              </div>
            )}

            {itemResult && <ItemAnalysisCard result={itemResult} lang={lang} imageFile={analysisImage} />}

            {itemResult && (
              <button type="button"
                onClick={() => { setItemResult(null); setShowItemSelector(true); }}
                style={{
                  width: "100%", padding: "11px", borderRadius: 12,
                  border: "1px solid rgba(212,175,55,0.2)",
                  background: "transparent", color: "#666", fontSize: 13,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                {isAr ? "🔬 حلل قطعة ثانية" : "🔬 Analyze another piece"}
              </button>
            )}

            {itemError && <p style={{ color: "#E74C3C", fontSize: 13, textAlign: "center" }}>{itemError}</p>}
          </div>

        </div>
      )}
    </div>
  );
}
