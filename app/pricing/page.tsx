"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const TEXT = {
  ar: {
    title: "اختر خطتك",
    subtitle: "ابدأ مجاناً، وطوّر تجربتك متى تريد",
    monthly: "شهري",
    yearly: "سنوي",
    save: "وفّر 20%",
    current: "خطتك الحالية",
    getStarted: "ابدأ الآن",
    perMonth: "/ شهر",
    mostPopular: "الأكثر شعبية",
    comingSoon: "قريباً! 🚀",
    allPricesNote: "جميع الأسعار بالدينار الأردني • يمكن الإلغاء في أي وقت",
    backToApp: "← العودة للتطبيق",
    plans: [
      {
        id: "free",
        name: "مجاني",
        price: { monthly: 0, yearly: 0 },
        description: "ابدأ رحلتك مع LEO",
        color: "#888",
        features: [
          "اقتراح إطلالة يومي واحد",
          "3 تحليلات إطلالة شهرياً",
          "10 قطع في الخزانة",
          "أول مستويين في الأكاديمية",
          "LEO Chat مجاناً",
        ],
        limits: ["لا توليد صور", "لا حفظ إطلالات"],
      },
      {
        id: "pro",
        name: "Pro",
        price: { monthly: 15, yearly: 12 },
        description: "للجادين في الأسلوب",
        color: "#D4AF37",
        popular: true,
        features: [
          "اقتراحات إطلالات غير محدودة",
          "تحليلات غير محدودة",
          "خزانة غير محدودة",
          "الأكاديمية كاملة",
          "توليد 10 صور يومياً",
          "حفظ الإطلالات والـ Wishlist",
          "تحليل تفصيلي متقدم",
          "أولوية في الدعم",
        ],
      },
      {
        id: "elite",
        name: "Elite",
        price: { monthly: 29, yearly: 23 },
        description: "تجربة LEO الكاملة",
        color: "#E5C158",
        features: [
          "كل مميزات Pro",
          "توليد صور غير محدود",
          "تقرير أسلوب شخصي شهري",
          "وصول مبكر للمميزات الجديدة",
          "مستشار أسلوب خاص",
          "شارة Elite حصرية 👑",
        ],
      },
    ],
    faqTitle: "أسئلة شائعة",
    faqs: [
      { q: "هل يمكنني الإلغاء في أي وقت؟", a: "نعم، يمكنك الإلغاء في أي وقت بدون رسوم إضافية." },
      { q: "هل هناك تجربة مجانية؟", a: "نعم، الخطة المجانية متاحة للأبد مع ميزات أساسية تشمل 10 قطع في الخزانة." },
      { q: "ما طرق الدفع المتاحة؟", a: "نقبل Visa وMastercard والدفع عبر Apple Pay وGoogle Pay." },
    ],
  },
  en: {
    title: "Choose Your Plan",
    subtitle: "Start free, upgrade anytime",
    monthly: "Monthly",
    yearly: "Yearly",
    save: "Save 20%",
    current: "Current Plan",
    getStarted: "Get Started",
    perMonth: "/ mo",
    mostPopular: "Most Popular",
    comingSoon: "Coming soon! 🚀",
    allPricesNote: "All prices in Jordanian Dinar • Cancel anytime",
    backToApp: "← Back to App",
    plans: [
      {
        id: "free",
        name: "Free",
        price: { monthly: 0, yearly: 0 },
        description: "Start your LEO journey",
        color: "#888",
        features: [
          "1 outfit suggestion per day",
          "3 outfit analyses per month",
          "10 wardrobe items",
          "First 2 Academy levels",
          "LEO Chat free",
        ],
        limits: ["No image generation", "No outfit saving"],
      },
      {
        id: "pro",
        name: "Pro",
        price: { monthly: 15, yearly: 12 },
        description: "For the style-serious",
        color: "#D4AF37",
        popular: true,
        features: [
          "Unlimited outfit suggestions",
          "Unlimited analyses",
          "Unlimited wardrobe",
          "Full Academy access",
          "10 image generations/day",
          "Save outfits & Wishlist",
          "Advanced detailed analysis",
          "Priority support",
        ],
      },
      {
        id: "elite",
        name: "Elite",
        price: { monthly: 29, yearly: 23 },
        description: "The full LEO experience",
        color: "#E5C158",
        features: [
          "Everything in Pro",
          "Unlimited image generation",
          "Monthly personal style report",
          "Early access to new features",
          "Personal style consultant",
          "Exclusive Elite badge 👑",
        ],
      },
    ],
    faqTitle: "FAQ",
    faqs: [
      { q: "Can I cancel anytime?", a: "Yes, cancel anytime with no extra charges." },
      { q: "Is there a free trial?", a: "Yes, the Free plan is available forever with core features including 10 wardrobe items." },
      { q: "What payment methods are accepted?", a: "We accept Visa, Mastercard, Apple Pay and Google Pay." },
    ],
  },
};

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = TEXT[lang];
  const isRTL = lang === "ar";

  return (
    <main
      className="min-h-screen bg-black text-white"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ fontFamily: isRTL ? "'Tajawal','Cairo',sans-serif" : "inherit" }}
    >
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/10 bg-black/80 backdrop-blur-xl">
        <button
          onClick={() => router.push("/")}
          className="text-[#D4AF37] font-bold text-xl tracking-widest hover:opacity-80 transition-opacity"
        >
          LEO
        </button>
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => router.push("/ai-stylist")}
              className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors"
            >
              {t.backToApp}
            </button>
          )}
          <button
            onClick={() => setLang(l => l === "ar" ? "en" : "ar")}
            className="text-xs border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-1.5 rounded-lg hover:border-[#D4AF37] transition-colors"
          >
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-24">

        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#D4AF37] mb-3">{t.title}</h1>
          <p className="text-gray-400">{t.subtitle}</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 mt-8 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === "monthly"
                  ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.monthly}
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.yearly}
              <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                {t.save}
              </span>
            </button>
          </div>
        </div>

        {/* ─── Plans Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {t.plans.map((plan) => {
            const price = plan.price[billing];
            const isPopular = "popular" in plan && plan.popular;
            const isFree = plan.id === "free";

            return (
              <div
                key={plan.id}
                style={{
                  background: isPopular
                    ? "linear-gradient(135deg,#0f0f0f,#111)"
                    : "#0a0a0a",
                  border: `1px solid ${isPopular ? plan.color + "80" : "rgba(212,175,55,0.15)"}`,
                  borderRadius: "20px",
                  padding: "28px 24px",
                  position: "relative",
                  boxShadow: isPopular ? `0 0 50px rgba(212,175,55,0.1)` : "none",
                  transform: isPopular ? "scale(1.03)" : "scale(1)",
                  transition: "transform 0.2s ease",
                }}
              >
                {isPopular && (
                  <div style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(90deg,#B8941F,#D4AF37)",
                    color: "black",
                    fontWeight: "700",
                    fontSize: "12px",
                    padding: "5px 18px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 12px rgba(212,175,55,0.4)",
                  }}>
                    ⭐ {t.mostPopular}
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-5">
                  <p style={{ color: plan.color, fontWeight: "700", fontSize: "20px", marginBottom: "4px" }}>
                    {plan.name}
                  </p>
                  <p style={{ color: "#666", fontSize: "13px" }}>{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {isFree ? (
                    <p style={{ color: "white", fontSize: "38px", fontWeight: "800" }}>
                      {isRTL ? "مجاناً" : "Free"}
                    </p>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
                      <span style={{ color: plan.color, fontSize: "38px", fontWeight: "800", lineHeight: 1 }}>
                        {price}
                      </span>
                      <span style={{ color: "#555", fontSize: "14px", marginBottom: "6px" }}>
                        {isRTL ? "د.أ" : "JD"} {t.perMonth}
                      </span>
                    </div>
                  )}
                  {billing === "yearly" && !isFree && (
                    <p style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                      {isRTL ? `${price * 12} د.أ / سنة` : `${price * 12} JD / year`}
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (isFree) router.push("/");
                    else alert(t.comingSoon);
                  }}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "12px",
                    border: isPopular ? "none" : `1px solid ${plan.color}50`,
                    background: isPopular
                      ? "linear-gradient(90deg,#B8941F,#D4AF37)"
                      : "transparent",
                    color: isPopular ? "black" : plan.color,
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    marginBottom: "20px",
                    transition: "all 0.2s ease",
                    boxShadow: isPopular ? "0 4px 20px rgba(212,175,55,0.3)" : "none",
                  } as React.CSSProperties}
                  onMouseEnter={e => {
                    if (!isPopular) {
                      (e.currentTarget as HTMLButtonElement).style.background = `${plan.color}12`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isPopular) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }
                  }}
                >
                  {t.getStarted}
                </button>

                <div style={{ height: "1px", background: "rgba(212,175,55,0.1)", marginBottom: "20px" }} />

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map((feat, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#ccc" }}>
                      <span style={{ color: plan.color, marginTop: "1px", flexShrink: 0, fontWeight: "bold" }}>✓</span>
                      {feat}
                    </li>
                  ))}
                  {"limits" in plan && plan.limits?.map((lim, i) => (
                    <li key={`lim-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#444" }}>
                      <span style={{ color: "#444", marginTop: "1px", flexShrink: 0 }}>✗</span>
                      {lim}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ─── FAQ ─── */}
        <div className="max-w-2xl mx-auto">
          <h2 style={{
            color: "#D4AF37", fontWeight: "700", fontSize: "22px",
            marginBottom: "20px", textAlign: "center",
          }}>
            {t.faqTitle}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {t.faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(212,175,55,0.15)",
                  borderRadius: "14px",
                  padding: "18px 20px",
                }}
              >
                <p style={{ color: "#D4AF37", fontWeight: "600", fontSize: "14px", marginBottom: "8px" }}>
                  {faq.q}
                </p>
                <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ color: "#444", fontSize: "12px", textAlign: "center", marginTop: "40px" }}>
          {t.allPricesNote}
        </p>
      </div>
    </main>
  );
}