"use client";

import React, { useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────
const IMAGE_LIMIT = 3;

// ─── Safe localStorage ────────────────────────────────────────
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* silent fail */ }
}

// ─── Goal Types ───────────────────────────────────────────────
export type StyleGoal = "professional" | "eyecatching" | "budget" | "identity" | null;

// ─── Goal Roadmaps ────────────────────────────────────────────
const GOAL_ROADMAPS: Record<NonNullable<StyleGoal>, { ar: string[]; en: string[] }> = {
  professional: {
    ar: [
      "ابدأ بخزانة أساسية: ثلاث بدلات وخمسة قمصان بألوان محايدة",
      "استثمر في حذاء جلدي أسود عالي الجودة",
      "أضف ساعة كلاسيكية — ترفع أي إطلالة عشر درجات",
      "أتقن قاعدة الألوان المحايدة: الكحلي والرمادي والأبيض والبيج",
    ],
    en: [
      "Start with a Capsule Wardrobe: 3 suits + 5 neutral shirts",
      "Invest in one high-quality black leather shoe",
      "Add a classic watch — elevates any look instantly",
      "Master neutral colors: Navy, Charcoal, White, Beige",
    ],
  },
  eyecatching: {
    ar: [
      "اختر قطعة محورية واحدة لكل إطلالة",
      "جرّب تنسيق الألوان الجريئة: لونان قويان معاً",
      "الإكسسوار هو سلاحك: قبعة أو ساعة كبيرة أو حزام بارز",
      "حدد هويتك البصرية: ملابس الشارع؟ الأناقة الكلاسيكية؟ الأكاديمي الداكن؟",
    ],
    en: [
      "Choose one Statement Piece per look",
      "Experiment with Color Blocking: two bold colors together",
      "Accessories are your weapon: hat, oversized watch, bold belt",
      "Define your Aesthetic: Streetwear? Preppy? Dark Academia?",
    ],
  },
  budget: {
    ar: [
      "قاعدة 80/20: أنفق 80% على الأساسيات و20% على الصيحات",
      "متاجر الملابس المستعملة والعتيقة = أفضل قيمة مقابل السعر",
      "اهتم بالمقاس أكثر من العلامة التجارية — الخياطة تصنع الفارق",
      "أنشئ قائمة من عشر قطع أساسية تكفيك لأي مناسبة",
    ],
    en: [
      "80/20 rule: spend 80% on basics, 20% on trends",
      "Thrift & Vintage = best value for money",
      "Focus on Fit over Brand — tailoring makes the difference",
      "Build a 10-piece essentials list that covers any occasion",
    ],
  },
  identity: {
    ar: [
      "ابحث عن ثلاثة أشخاص يعجبك أسلوبهم وحلّله",
      "حدد ثلاثة ألوان رئيسية تعبّر عنك والتزم بها",
      "قاعدة كل شراء جديد: هل يتناسب مع ثلاث قطع عندك؟ وإلا فلا يستحق",
      "أنشئ لوحة إلهام شهرية توضح الاتجاه الذي تريد السير فيه",
    ],
    en: [
      "Find 3 people whose style you admire and analyze them",
      "Pick 3 signature colors that represent you — stick to them",
      "New purchase rule: does it match 3 items you own? If not, skip",
      "Build a monthly Mood Board to track your style direction",
    ],
  },
};

// ─── Types ────────────────────────────────────────────────────
interface StyleOption {
  value: string;
  label: string;
}

interface FormProps {
  form: { gender: string; hijab: string; occasion: string; age: string; height: string; weight: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  selectedStyle: string | null;
  setSelectedStyle: (v: string | null) => void;
  STYLE_OPTIONS: StyleOption[];
}

interface ResultProps {
  reply: string | null;
  displayText: string;
  accuracy: number | null;
  tone: string;
  smartNote: string | null;
}

interface LoadingProps {
  loadingMain: boolean;
  loadingImprove: boolean;
  loadingImage: boolean;
}

interface ImageProps {
  imageUrl: string | null;
  imageCount: number;
  countdown: number | null;
  bodyDataSubmitted: boolean;
}

interface FeedbackProps {
  feedbackState: string | null;
  setFeedbackState: (v: string | null) => void;
  copied: boolean;
  savedFlash: boolean;
}

interface HandlersProps {
  submitRequest: (extra: boolean, variation?: number) => void;
  handleRefineLook: () => void;
  handleShare: () => void;
  saveToWishlist: () => void;
  handleActionGenerateImage: () => void;
  setActionModalOpen: (v: boolean) => void;
  setStep: (s: "form" | "summary") => void;
}

interface TranslationProps {
  t: {
    male: string; female: string; hijab: string; hijabHint: string; yes: string; no: string;
    business: string; formal: string; event: string; date: string; gym: string;
    styleLabel: string; leoThinking: string; button: string; back: string;
    resultTitle: string; analyzingData: string; smart: string; refineLook: string;
    moreAccurate: string; imageLimitMsg?: string; generatingIn: string; generateImage: string;
    share: string; wishlistSaved: string; wishlistSave: string; copied: string;
    generatingImage: string;
  };
  lang: string;
}

interface StylistSectionProps extends
  FormProps, ResultProps, LoadingProps,
  ImageProps, FeedbackProps, HandlersProps, TranslationProps {
  step: "form" | "summary";
  mainText: string;
  styleGoal: StyleGoal;
  setStyleGoal: (g: StyleGoal) => void;
}

// ─── Sub-components ───────────────────────────────────────────

function ImageActionButton({
  bodyDataSubmitted,
  imageCount,
  countdown,
  loadingImage,
  loadingImprove,
  handleActionGenerateImage,
  t,
}: Pick<ImageProps, "bodyDataSubmitted" | "imageCount" | "countdown"> & { loadingImage: boolean } &
  Pick<LoadingProps, "loadingImprove"> & {
  handleActionGenerateImage: () => void;
  t: TranslationProps["t"];
}) {
  if (!bodyDataSubmitted) return null;

  if (imageCount >= IMAGE_LIMIT) {
    return (
      <div className="image-limit-banner w-full">
        {t.imageLimitMsg}
      </div>
    );
  }

  if (countdown !== null) {
    return (
      <div className="generating-banner">
        <span className="loader-small" />
        <span className="text-[#D4AF37] text-sm">
          {t.generatingIn} {countdown}s...
        </span>
      </div>
    );
  }

  if (loadingImage) {
    return (
      <div className="generating-banner">
        <span className="loader-small" />
        <span className="text-[#D4AF37] text-sm">{t.generatingImage}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleActionGenerateImage}
      className="btn-outline"
      disabled={loadingImprove}
    >
      {t.generateImage}
      {` (${imageCount}/${IMAGE_LIMIT})`}
    </button>
  );
}

function FeedbackButtons({
  feedbackState,
  setFeedbackState,
  copied,
  savedFlash,
  handleShare,
  saveToWishlist,
  t,
}: Pick<FeedbackProps, "feedbackState" | "setFeedbackState" | "copied" | "savedFlash"> & {
  handleShare: () => void;
  saveToWishlist: () => void;
  t: TranslationProps["t"];
}) {
  const handleLike = useCallback(() => {
    safeSet("leo_feedback", "liked");
    setFeedbackState("liked");
  }, [setFeedbackState]);

  const handleDislike = useCallback(() => {
    safeSet("leo_feedback", "disliked");
    setFeedbackState("disliked");
  }, [setFeedbackState]);

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <button type="button" onClick={handleShare} className="btn-outline">
        {t.share}
      </button>

      <button
        type="button"
        onClick={saveToWishlist}
        className={"btn-outline" + (savedFlash ? " save-flash" : "")}
      >
        {savedFlash ? t.wishlistSaved : `🔖 ${t.wishlistSave}`}
      </button>

      <button
        type="button"
        onClick={handleLike}
        className={"btn-outline " + (feedbackState === "liked" ? "active-btn" : "")}
      >
        👍
      </button>

      <button
        type="button"
        onClick={handleDislike}
        className={"btn-outline " + (feedbackState === "disliked" ? "active-btn" : "")}
      >
        👎
      </button>

      {copied && (
        <span className="text-green-400 copied-toast">{t.copied}</span>
      )}
    </div>
  );
}

function ResultDisplay({
  displayText,
  loadingImprove,
  smartNote,
  t,
}: Pick<ResultProps, "displayText" | "smartNote"> &
  Pick<LoadingProps, "loadingImprove"> & {
  t: TranslationProps["t"];
}) {
  if (loadingImprove) {
    return (
      <div className="flex items-center gap-3 text-[#D4AF37]">
        <span className="loader-small" />
        <span className="text-sm">{t.analyzingData}</span>
      </div>
    );
  }

  return (
    <>
      {displayText.split("\n").map((line, i) => (
        <p key={`line-${i}-${line.slice(0, 10)}`} className="text-gray-200">
          {line}
        </p>
      ))}

      {smartNote && (
        <div className="smart-note border border-[#D4AF37] p-5 rounded-xl">
          <p className="text-[#D4AF37] font-semibold">{t.smart}</p>
          <p>{smartNote}</p>
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function StylistSection({
  form, handleChange, selectedStyle, setSelectedStyle, STYLE_OPTIONS,
  step, setStep,
  reply, displayText, accuracy, tone, smartNote,
  loadingMain, loadingImprove, loadingImage,
  imageUrl, imageCount, countdown, bodyDataSubmitted,
  feedbackState, setFeedbackState, copied, savedFlash,
  submitRequest, handleRefineLook, handleShare,
  saveToWishlist, handleActionGenerateImage, setActionModalOpen,
  t, lang,
  styleGoal, setStyleGoal,
}: StylistSectionProps) {

  const handleSubmit = useCallback(() => {
    submitRequest(false);
  }, [submitRequest]);

  const handleBack = useCallback(() => {
    sessionStorage.setItem("leo_ignore_memory", "1");
    setStep("form");
  }, [setStep]);

  const isAr = lang === "ar";

  return (
    <div>

      {/* ─── GOAL STEP ─── */}
      {!styleGoal && (
        <div className="space-y-4 bg-black border border-[#D4AF37]/30 p-8 rounded-2xl">
          <div>
            <p className="text-[#D4AF37] font-semibold text-lg mb-1">
              {isAr ? "قبل أن نبدأ..." : "Before we start..."}
            </p>
            <p className="text-white text-2xl font-bold">
              {isAr ? "ما هو هدفك من الأسلوب؟" : "What's your style goal?"}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {isAr
                ? "يبني LEO خارطة طريق كاملة بناءً على هدفك"
                : "LEO builds a full roadmap based on your goal"}
            </p>
          </div>

          {[
            {
              id: "professional" as NonNullable<StyleGoal>,
              icon: "💼",
              ar: "أريد أن أبدو محترفاً في العمل",
              en: "Look professional at work",
            },
            {
              id: "eyecatching" as NonNullable<StyleGoal>,
              icon: "✨",
              ar: "أريد أن أكون لافتاً للنظر على وسائل التواصل",
              en: "Stand out on social media",
            },
            {
              id: "budget" as NonNullable<StyleGoal>,
              icon: "💡",
              ar: "أريد أن أكون أنيقاً بميزانية محدودة",
              en: "Look great on a budget",
            },
            {
              id: "identity" as NonNullable<StyleGoal>,
              icon: "🎯",
              ar: "أريد تطوير أسلوب شخصي ثابت",
              en: "Build a consistent personal style",
            },
          ].map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => setStyleGoal(goal.id)}
              className="w-full border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 p-4 rounded-xl transition-all duration-200 flex items-center gap-4"
              style={{ textAlign: isAr ? "right" : "left" }}
            >
              <span className="text-2xl">{goal.icon}</span>
              <span className="text-white font-medium">
                {isAr ? goal.ar : goal.en}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ─── ROADMAP BANNER ─── */}
      {styleGoal && step === "form" && (
        <div className="mb-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#D4AF37] text-sm font-semibold">
              {isAr ? "خارطة طريقك مع LEO" : "Your LEO Roadmap"}
            </p>
            <button
              type="button"
              onClick={() => setStyleGoal(null)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {isAr ? "تغيير الهدف" : "Change goal"}
            </button>
          </div>
          {GOAL_ROADMAPS[styleGoal][isAr ? "ar" : "en"].map((item, i) => (
            <p key={i} className="text-gray-400 text-xs mb-1">
              {i + 1}. {item}
            </p>
          ))}
        </div>
      )}

      {/* ─── Form Step ─── */}
      {styleGoal && step === "form" && (
        <div className="space-y-4 bg-black border border-[#D4AF37]/30 p-8 rounded-2xl">
          <select name="gender" value={form.gender} onChange={handleChange} className="input">
            <option value="male">{t.male}</option>
            <option value="female">{t.female}</option>
          </select>

          {form.gender === "female" && (
            <div className="space-y-1">
              <label className="text-sm text-gray-300">{t.hijab}</label>
              <p className="text-xs text-gray-500">{t.hijabHint}</p>
              <select name="hijab" value={form.hijab} onChange={handleChange} className="input">
                <option value="yes">{t.yes}</option>
                <option value="no">{t.no}</option>
              </select>
            </div>
          )}

          <select name="occasion" value={form.occasion} onChange={handleChange} className="input">
            <option value="business">{t.business}</option>
            <option value="formal">{t.formal}</option>
            <option value="event">{t.event}</option>
            <option value="date">{t.date}</option>
            <option value="gym">{t.gym}</option>
          </select>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">{t.styleLabel}</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStyle(selectedStyle === opt.value ? null : opt.value)}
                  className={"style-chip" + (selectedStyle === opt.value ? " style-chip-active" : "")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loadingMain}
            className="w-full bg-[#D4AF37] py-4 rounded-xl text-black font-medium flex items-center justify-center gap-2 main-cta"
          >
            {loadingMain ? (
              <><span className="loader" /> {t.leoThinking}</>
            ) : (
              t.button
            )}
          </button>
        </div>
      )}

      {/* ─── Summary Step ─── */}
      {styleGoal && step === "summary" && reply && (
        <div className="result-enter bg-black border border-[#D4AF37]/30 p-8 rounded-2xl space-y-8">

          <button type="button" onClick={handleBack} className="btn-outline">
            {t.back}
          </button>

          <h3 className="text-lg font-semibold text-[#D4AF37]">{t.resultTitle}</h3>

          {accuracy !== null && (
            <div className="accuracy-badge">Accuracy {accuracy}%</div>
          )}

          <div className="analysis-tone">Tone: {tone}</div>

          <ResultDisplay
            displayText={displayText}
            loadingImprove={loadingImprove}
            smartNote={smartNote}
            t={t}
          />

          <div className="flex gap-3 flex-wrap action-buttons-row">
            <button
              type="button"
              onClick={handleRefineLook}
              className="btn-outline"
              disabled={loadingMain || loadingImprove}
            >
              {t.refineLook}
            </button>

            <button
              type="button"
              onClick={() => setActionModalOpen(true)}
              className="btn-outline"
              disabled={loadingImprove}
            >
              {loadingImprove ? <span className="loader-small" /> : t.moreAccurate}
            </button>

            <ImageActionButton
              bodyDataSubmitted={bodyDataSubmitted}
              imageCount={imageCount}
              countdown={countdown}
              loadingImage={loadingImage}
              loadingImprove={loadingImprove}
              handleActionGenerateImage={handleActionGenerateImage}
              t={t}
            />
          </div>

          <FeedbackButtons
            feedbackState={feedbackState}
            setFeedbackState={setFeedbackState}
            copied={copied}
            savedFlash={savedFlash}
            handleShare={handleShare}
            saveToWishlist={saveToWishlist}
            t={t}
          />

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Generated outfit"
              className="rounded-xl border border-[#D4AF37]/40 mt-4 image-fade-in"
            />
          )}
        </div>
      )}
    </div>
  );
}
