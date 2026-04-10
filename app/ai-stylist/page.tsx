"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

// ─── Section imports ──────────────────────────────────────────
import StylistSection, { StyleGoal } from "./StylistSection";
import AnalyzeSection from "./AnalyzeSection";
import MyLeoSection from "./MyLeoSection";
import WardrobeSection from "./WardrobeSection";

const TEXT = {
  ar: {
    title: "LEO - ذكاء الأناقة ",
    subtitle: "أتقن أناقتك مع الذكاء الاصطناعي",
    hijab: "هل أنتِ محجبة؟",
    hijabHint: "يساعدنا هذا في اختيار القصّات المناسبة.",
    yes: "نعم", no: "لا", male: "ذكر", female: "أنثى",
    business: "عمل", formal: "رسمي", event: "مناسبة", date: "موعد", gym: "جيم",
    button: "اقترح LEO", age: "العمر", height: "الطول (سم)", weight: "الوزن (كغ)",
    resultTitle: "اقتراح LEO", share: "مشاركة", copied: "تم نسخ الاقتراح",
    smart: "ملاحظة ذكية", refineLook: "تعديل اللوك", moreAccurate: "دقة أعلى",
    generateImage: "توليد صورة", modalTitle: "أدخل بياناتك", modalSubmit: "تأكيد", modalCancel: "إلغاء",
    styleLabel: "اختر الستايل", generatingIn: "جاري التوليد في", generatingImage: "جاري توليد الصورة...",
    styleClassic: "كلاسيك", styleStreetwear: "ستريت وير", styleElegant: "أنيق",
    styleSporty: "رياضي", styleLuxury: "فاخر", styleCasual: "كاجوال",
    styleFormal: "رسمي", styleOldMoney: "أولد موني",
    analyzeTitle: "حلل إطلالتك", analyzeSubtitle: "تحليل احترافي دقيق بالذكاء الاصطناعي",
    uploadBtn: "رفع صورة", cameraBtn: "فتح الكاميرا", captureBtn: "التقاط", cancelBtn: "إلغاء",
    analyzeBtn: "تحليل الإطلالة", analyzingBtn: "جاري التحليل...",
    limitMsg: "انتهت تحليلاتك المجانية الثلاث", remainingMsg: "تحليلات مجانية متبقية",
    finalScore: "النتيجة النهائية", styleType: "نوع الستايل", fitQuality: "جودة الفت",
    colorHarmony: "تناسق الألوان", presenceRating: "مستوى الحضور", confidenceSignal: "إشارة الثقة",
    scoreBreakdown: "تفاصيل النتيجة", fitScore: "الفت", colorScore: "الألوان",
    proportionScore: "التناسب", styleScore: "الستايل", detailsScore: "التفاصيل", presenceScore: "الحضور",
    analysisLabel: "التحليل", priorityFixes: "أولويات التحسين", styleImprovements: "اقتراحات الستايل",
    errorMsg: "حدث خطأ أثناء التحليل. حاول مرة أخرى.", langToggle: "English", back: "→ رجوع",
    analyzingData: "جاري تحليل بياناتك...", toneDetailed: "تفصيلي", toneQuick: "سريع",
    leoThinking: "LEO يفكر...", historyTitle: "تاريخ إطلالاتك", historyEmpty: "لا يوجد تحليلات سابقة بعد",
    historyBest: "أفضل نتيجة", historyAvg: "المتوسط", historyTotal: "إجمالي التحليلات",
    historyProgress: "تطور الـ Score", historyClear: "مسح التاريخ",
    streakTitle: "يومك مع LEO", streakDays: "يوم متتالي",
    streakMsg0: "ابدأ رحلتك اليوم مع LEO 👋", streakMsg1: "أحسنت! يوم أول ✨",
    streakMsg3: "3 أيام متتالية! أنت جاد 🔥", streakMsg7: "أسبوع كامل! LEO فخور فيك 🏆",
    streakMsg14: "14 يوم! أنت من النخبة 👑", streakBestLabel: "أفضل يوم",
    streakWarning: "لا تقطع السلسلة!", checkinBtn: "سجّل حضورك اليوم", checkinDone: "تم التسجيل اليوم ✓",
    checkinQuestion: "سؤال LEO اليوم", badge7: "🏅 نخبة الأسبوع", badge14: "👑 ماستر الستايل", badge30: "💎 أسطورة LEO",
    wishlistTitle: "إطلالاتي المحفوظة", wishlistEmpty: "لا يوجد إطلالات محفوظة بعد",
    wishlistSave: "حفظ الإطلالة", wishlistSaved: "تم الحفظ ✓", wishlistDelete: "حذف",
    wishlistOccasion: "المناسبة", wishlistDate: "التاريخ", wishlistNote: "ملاحظة", wishlistAddNote: "أضف ملاحظة...",
    wishlistSortBy: "ترتيب", wishlistSortDate: "التاريخ", wishlistSortOccasion: "المناسبة",
    wishlistPriorityHigh: "⭐ مهم", wishlistPriorityNormal: "عادي", wishlistPriorityLater: "لاحقاً",
    tabStyleist: "المصمم", tabAnalyze: "تحليل", tabMyLeo: "LEO",
    tabAcademy: "أكاديمية", tabWardrobe: "خزانتي",
    academyTitle: "أكاديمية LEO", academySubtitle: "تعلّم الستايل خطوة بخطوة",
    academyLevel: "المستوى", academyXP: "نقاط XP", academyXPRemaining: "XP للمستوى التالي",
    academyContinue: "متابعة", academyStart: "ابدأ", academyLocked: "🔒 مقفل", academyCompleted: "✓ مكتمل",
    academyBranch: "الألوان", academyFitBranch: "الفت", academyStyleIdentityBranch: "هوية الستايل",
    academyCorrect: "إجابة صحيحة! +10 XP", academyWrong: "إجابة خاطئة +3 XP",
    academyLevelUp: "🎉 أنهيت المستوى! +50 XP", academyQuestion: "أي الإطلالتين أفضل من ناحية",
    academyNext: "السؤال التالي", academyFinish: "إنهاء المستوى", academyProgress: "التقدم",
    academyChoose: "اختر الأفضل", academyDifficulty: "الصعوبة",
    academyEasy: "سهل", academyMedium: "متوسط", academyHard: "صعب",
    journeyTitle: "رحلتك الشخصية في الأناقة", journeySubtitle: "Style Master",
    journeyLevel: "المستوى", journeyNextLevel: "للمستوى التالي",
    resetAnalysis: "إعادة تعيين التحليلات", imageLimitMsg: "وصلت للحد الأقصى لتوليد الصور",
    historyFilterAll: "الكل", historyFilterLabel: "الفلتر", historyWeekCompare: "مقارنة الأسبوع",
    historyWeekUp: "أسبوع أعلى", historyWeekDown: "أسبوع أدنى", historyWeekSame: "نفس المستوى",
    historyPeriodLabel: "الفترة",
    guestBannerTitle: "أنت تتصفح كـ ضيف", guestBannerSub: "سجّل مجاناً للوصول الكامل",
    guestSignup: "إنشاء حساب مجاني", guestFeatureLocked: "سجّل عشان تستخدم هاي الميزة",
  },
  en: {
    title: "LEO Style Intelligence", subtitle: "Master your style with AI.",
    hijab: "Do you wear hijab?", hijabHint: "This helps us suggest suitable necklines.",
    yes: "Yes", no: "No", male: "Male", female: "Female",
    business: "Business", formal: "Formal", event: "Event", date: "Date", gym: "Gym",
    button: "Ask LEO", age: "Age", height: "Height (cm)", weight: "Weight (kg)",
    resultTitle: "LEO Suggestion", share: "Share", copied: "Copied!",
    smart: "Smart Note", refineLook: "Refine Look", moreAccurate: "More Accurate",
    generateImage: "Generate Image", modalTitle: "Enter your details", modalSubmit: "Confirm", modalCancel: "Cancel",
    styleLabel: "Choose Style", generatingIn: "Generating in", generatingImage: "Generating image...",
    styleClassic: "Classic", styleStreetwear: "Streetwear", styleElegant: "Elegant",
    styleSporty: "Sporty", styleLuxury: "Luxury", styleCasual: "Casual",
    styleFormal: "Formal", styleOldMoney: "Old Money",
    analyzeTitle: "Analyze Your Outfit", analyzeSubtitle: "Professional AI-powered precision analysis",
    uploadBtn: "Upload Image", cameraBtn: "Open Camera", captureBtn: "Capture", cancelBtn: "Cancel",
    analyzeBtn: "Analyze Outfit", analyzingBtn: "Analyzing...",
    limitMsg: "Free analysis limit reached", remainingMsg: "free analyses remaining",
    finalScore: "Final Score", styleType: "Style Type", fitQuality: "Fit Quality",
    colorHarmony: "Color Harmony", presenceRating: "Presence Rating", confidenceSignal: "Confidence Signal",
    scoreBreakdown: "Score Breakdown", fitScore: "Fit", colorScore: "Colors",
    proportionScore: "Proportion", styleScore: "Style", detailsScore: "Details", presenceScore: "Presence",
    analysisLabel: "Analysis", priorityFixes: "Priority Fixes", styleImprovements: "Style Improvements",
    errorMsg: "Analysis failed. Please try again.", langToggle: "العربية", back: "← Back",
    analyzingData: "Analyzing your data...", toneDetailed: "Detailed", toneQuick: "Quick",
    leoThinking: "LEO thinking...", historyTitle: "Your Style History", historyEmpty: "No analyses yet",
    historyBest: "Best Score", historyAvg: "Average", historyTotal: "Total Analyses",
    historyProgress: "Score Progress", historyClear: "Clear History",
    streakTitle: "Your Day with LEO", streakDays: "day streak",
    streakMsg0: "Start your journey with LEO today 👋", streakMsg1: "Great start! Day one ✨",
    streakMsg3: "3 days straight! You're serious 🔥", streakMsg7: "One full week! LEO is proud 🏆",
    streakMsg14: "14 days! You're elite 👑", streakBestLabel: "Best Day",
    streakWarning: "Don't break the streak!", checkinBtn: "Check in today", checkinDone: "Checked in today ✓",
    checkinQuestion: "LEO's Question of the Day", badge7: "🏅 Week Elite", badge14: "👑 Style Master", badge30: "💎 LEO Legend",
    wishlistTitle: "My Saved Outfits", wishlistEmpty: "No saved outfits yet",
    wishlistSave: "Save Outfit", wishlistSaved: "Saved ✓", wishlistDelete: "Delete",
    wishlistOccasion: "Occasion", wishlistDate: "Date", wishlistNote: "Note", wishlistAddNote: "Add a note...",
    wishlistSortBy: "Sort", wishlistSortDate: "Date", wishlistSortOccasion: "Occasion",
    wishlistPriorityHigh: "⭐ High", wishlistPriorityNormal: "Normal", wishlistPriorityLater: "Later",
    tabStyleist: "Stylist", tabAnalyze: "Analyze", tabMyLeo: "LEO",
    tabAcademy: "Academy", tabWardrobe: "Wardrobe",
    academyTitle: "LEO Academy", academySubtitle: "Learn style step by step",
    academyLevel: "Level", academyXP: "XP Points", academyXPRemaining: "XP to next level",
    academyContinue: "Continue", academyStart: "Start", academyLocked: "🔒 Locked", academyCompleted: "✓ Completed",
    academyBranch: "Colors", academyFitBranch: "Fit", academyStyleIdentityBranch: "Style Identity",
    academyCorrect: "Correct! +10 XP", academyWrong: "Wrong answer +3 XP",
    academyLevelUp: "🎉 Level Complete! +50 XP", academyQuestion: "Which outfit is better in terms of",
    academyNext: "Next Question", academyFinish: "Finish Level", academyProgress: "Progress",
    academyChoose: "Choose the best", academyDifficulty: "Difficulty",
    academyEasy: "Easy", academyMedium: "Medium", academyHard: "Hard",
    journeyTitle: "Your Personal Style Journey", journeySubtitle: "Style Master",
    journeyLevel: "Level", journeyNextLevel: "to next level",
    resetAnalysis: "Reset Analyses", imageLimitMsg: "Image generation limit reached",
    historyFilterAll: "All", historyFilterLabel: "Filter", historyWeekCompare: "Week Compare",
    historyWeekUp: "Up", historyWeekDown: "Down", historyWeekSame: "Same",
    historyPeriodLabel: "Period",
    guestBannerTitle: "You're browsing as a Guest", guestBannerSub: "Sign up for free to unlock everything",
    guestSignup: "Create Free Account", guestFeatureLocked: "Sign up to use this feature",
  },
};

const pageStyles = `
  *[dir="rtl"] { font-family: 'Tajawal', 'Cairo', sans-serif; }
  .input{width:100%;padding:14px;background:#0b0b0b;border:1px solid rgba(212,175,55,0.4);border-radius:14px;color:white;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);outline:none;}
  .input:hover{border-color:rgba(212,175,55,0.6);background:#111;}
  .input:focus{border-color:#D4AF37;background:#0f0f0f;box-shadow:0 0 0 3px rgba(212,175,55,0.12);}
  .btn-outline{border:1px solid #D4AF37;padding:8px 18px;border-radius:999px;color:#D4AF37;background:transparent;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);cursor:pointer;position:relative;overflow:hidden;}
  .btn-outline::before{content:'';position:absolute;inset:0;background:rgba(212,175,55,0.1);transform:scale(0);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);border-radius:999px;}
  .btn-outline:hover::before{transform:scale(1);}
  .btn-outline:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(212,175,55,0.25);}
  .btn-outline:active{transform:translateY(0);transition:all 0.1s;}
  .btn-outline:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
  .btn-outline:disabled:hover{transform:none;box-shadow:none;}
  .active-btn{background:#D4AF37;color:black;transform:scale(1.05);}
  .main-cta{transition:all 0.3s cubic-bezier(0.4,0,0.2,1);box-shadow:0 4px 20px rgba(212,175,55,0.3);}
  .main-cta:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 8px 30px rgba(212,175,55,0.45);background:#E5C158;}
  .main-cta:active:not(:disabled){transform:translateY(-1px);transition:all 0.1s;}
  .main-cta:disabled{opacity:0.7;cursor:not-allowed;}
  .loader{width:16px;height:16px;border:2px solid black;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;}
  .loader-small{display:inline-block;width:14px;height:14px;border:2px solid #D4AF37;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;}
  .accuracy-badge{border:1px solid #D4AF37;color:#D4AF37;padding:4px 10px;border-radius:999px;width:fit-content;animation:badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1);}
  .analysis-tone{font-size:12px;color:#aaa;}
  .result-enter{animation:reveal 0.6s cubic-bezier(0.34,1.56,0.64,1);}
  .copied-toast{animation:toast-pop 2s ease;}
  .image-fade-in{animation:img-reveal 0.6s ease;}
  .action-buttons-row{padding-bottom:8px;border-bottom:1px solid rgba(212,175,55,0.15);}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:999;animation:fade-in 0.2s ease;}
  .modal-box{background:#0b0b0b;border:1px solid rgba(212,175,55,0.4);border-radius:20px;padding:32px;width:100%;max-width:380px;animation:reveal 0.3s cubic-bezier(0.34,1.56,0.64,1);}
  .style-chip{border:1px solid rgba(212,175,55,0.4);padding:7px 16px;border-radius:999px;color:#aaa;background:transparent;transition:all 0.2s cubic-bezier(0.4,0,0.2,1);cursor:pointer;font-size:13px;}
  .style-chip:hover{border-color:#D4AF37;color:#D4AF37;transform:translateY(-1px);}
  .style-chip-active{border-color:#D4AF37;background:rgba(212,175,55,0.15);color:#D4AF37;font-weight:600;}
  .smart-note{animation:fade-slide 0.5s ease;transition:all 0.3s ease;}
  .smart-note:hover{transform:translateX(4px);border-color:#E5C158;}
  .lang-toggle-btn{border:1px solid #D4AF37;color:#D4AF37;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:500;background:transparent;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);cursor:pointer;}
  .lang-toggle-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(212,175,55,0.2);}
  .score-bar-track{width:100%;height:6px;background:rgba(212,175,55,0.1);border-radius:999px;overflow:hidden;}
  .score-bar-fill{height:100%;background:linear-gradient(90deg,#B8941F,#D4AF37,#E5C158);border-radius:999px;transition:width 1s cubic-bezier(0.4,0,0.2,1);}
  .history-card{background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:16px;padding:16px;transition:all 0.2s ease;}
  .history-card:hover{border-color:rgba(212,175,55,0.5);transform:translateY(-2px);}
  .history-bar{border-radius:6px 6px 0 0;background:linear-gradient(180deg,#D4AF37,#B8941F);transition:height 0.8s cubic-bezier(0.4,0,0.2,1);min-height:4px;width:100%;}
  .stat-card{background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:14px;padding:16px;text-align:center;flex:1;}
  .streak-card{background:linear-gradient(135deg,#0a0a0a,#111);border:1px solid rgba(212,175,55,0.35);border-radius:20px;padding:24px;position:relative;overflow:hidden;}
  .streak-card::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(212,175,55,0.08),transparent 70%);border-radius:50%;}
  .streak-fire{font-size:48px;line-height:1;animation:fire-pulse 2s ease-in-out infinite;}
  .checkin-btn-done{background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:rgba(212,175,55,0.6);padding:10px 24px;border-radius:999px;cursor:default;font-size:14px;text-align:center;}
  .badge-pill{background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:#D4AF37;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;}
  .question-card{background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:14px;padding:16px 20px;}
  .tab-bar{display:flex;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:16px;padding:4px;gap:2px;margin-bottom:24px;overflow-x:auto;}
  .tab-btn{flex:1;padding:10px 4px;border-radius:12px;border:none;background:transparent;color:#666;font-size:11px;font-weight:500;cursor:pointer;transition:all 0.2s ease;white-space:nowrap;min-width:fit-content;}
  .tab-btn:hover{color:#D4AF37;}
  .tab-btn-active{background:rgba(212,175,55,0.15);color:#D4AF37;font-weight:600;}
  .wishlist-card{background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:16px;padding:18px;transition:all 0.2s ease;position:relative;}
  .wishlist-card:hover{border-color:rgba(212,175,55,0.45);transform:translateY(-2px);}
  .wishlist-tag{background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);color:#D4AF37;padding:2px 10px;border-radius:999px;font-size:11px;}
  .note-input{width:100%;background:transparent;border:none;outline:none;color:#aaa;font-size:12px;resize:none;font-family:inherit;}
  .save-flash{animation:badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1);}
  .xp-bar-track{width:100%;height:8px;background:rgba(212,175,55,0.1);border-radius:999px;overflow:hidden;}
  .xp-bar-fill{height:100%;background:linear-gradient(90deg,#B8941F,#D4AF37,#E5C158);border-radius:999px;transition:width 0.8s ease-out;}
  .journey-card{background:linear-gradient(135deg,#0a0a0a,#0f0f0f);border:1px solid rgba(212,175,55,0.25);border-radius:20px;padding:20px 24px;margin-bottom:20px;position:relative;overflow:hidden;}
  .journey-card::before{content:'';position:absolute;top:-30px;left:-30px;width:100px;height:100px;background:radial-gradient(circle,rgba(212,175,55,0.06),transparent 70%);border-radius:50%;}
  .academy-level-card{background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);border-radius:18px;padding:20px;transition:all 0.25s ease;cursor:pointer;}
  .academy-level-card:hover:not(.locked){border-color:rgba(212,175,55,0.5);transform:translateY(-2px);}
  .academy-level-card.locked{opacity:0.4;cursor:not-allowed;}
  .academy-level-card.completed{border-color:rgba(212,175,55,0.5);background:rgba(212,175,55,0.04);}
  .option-card{border:2px solid rgba(212,175,55,0.2);border-radius:18px;padding:20px;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);background:#0a0a0a;}
  .option-card:hover{border-color:#D4AF37;transform:translateY(-3px);box-shadow:0 8px 24px rgba(212,175,55,0.15);}
  .option-card.selected-correct{border-color:#27AE60;background:rgba(39,174,96,0.08);}
  .option-card.selected-wrong{border-color:#E74C3C;background:rgba(231,76,60,0.08);}
  .option-card.show-correct{border-color:#27AE60;background:rgba(39,174,96,0.05);}
  .levelup-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fade-in 0.3s ease;}
  .levelup-box{background:#0b0b0b;border:2px solid #D4AF37;border-radius:24px;padding:48px 32px;text-align:center;animation:levelup-pop 0.5s cubic-bezier(0.34,1.56,0.64,1);}
  .color-swatch{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,0.1);}
  .generating-banner{background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;}
  .image-limit-banner{background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.3);border-radius:12px;padding:12px 16px;color:#E74C3C;font-size:13px;text-align:center;}
  .guest-banner{background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.04));border:1px solid rgba(212,175,55,0.3);border-radius:16px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .guest-lock-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.75);border-radius:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:10;backdrop-filter:blur(4px);}
  @keyframes reveal{from{opacity:0;transform:translateY(20px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fade-slide{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fade-in{from{opacity:0}to{opacity:1}}
  @keyframes badge-pop{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
  @keyframes toast-pop{0%{opacity:0;transform:translateY(10px) scale(0.9)}10%{opacity:1;transform:translateY(0) scale(1)}90%{opacity:1}100%{opacity:0;transform:translateY(-10px) scale(0.9)}}
  @keyframes img-reveal{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
  @keyframes fire-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
  @keyframes levelup-pop{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
  @keyframes xp-float{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-40px)}}
  .xp-float{animation:xp-float 1.2s ease forwards;position:absolute;font-weight:700;font-size:18px;color:#D4AF37;pointer-events:none;}
`;

interface AnalysisResult {
  styleType: string; fitType: string; colorProfile: string;
  presenceRating: string; confidenceSignal: string; finalScore: number;
  scores: { color: number; fit: number; proportion: number; style: number; details: number; presence: number; };
  analysis: string; priorityFixes: string[]; styleImprovements: string[];
}
interface HistoryEntry { id: string; date: string; score: number; styleType: string; fitType: string; }
interface WishlistEntry { id: string; date: string; occasion: string; text: string; note: string; priority: "normal" | "high" | "later"; }
interface AcademyProgress { userLevel: number; totalXP: number; }

function useSafeLanguage() {
  try {
    const context = useLanguage();
    return { language: context.language, setLanguage: context.setLanguage };
  } catch {
    return { language: "ar", setLanguage: null as ((lang: string) => void) | null };
  }
}

const IMAGE_LIMIT = 3;

// ─── Guest Lock Overlay (for non-analyze tabs only) ───────────
function GuestLockOverlay({ message, onSignup }: { message: string; onSignup: () => void }) {
  return (
    <div className="guest-lock-overlay">
      <span style={{ fontSize: "32px" }}>🔒</span>
      <p style={{ color: "#D4AF37", fontWeight: "600", fontSize: "14px", textAlign: "center" }}>{message}</p>
      <button onClick={onSignup} style={{ background: "#D4AF37", color: "black", fontWeight: "700", padding: "10px 24px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "13px" }}>
        ✨ Sign Up Free
      </button>
    </div>
  );
}

// ─── XP Journey Banner ────────────────────────────────────────
function XPJourneyBanner({ progress, t, lang }: { progress: AcademyProgress; t: typeof TEXT["ar"]; lang: string }) {
  const XP_PER_LEVEL = [100, 200, 350, 500, 700];
  const LEVEL_TITLES_AR = ["مبتدئ","متعلم","مهتم بالموضة","محب الستايل","خبير ألوان","مستشار ستايل","محترف الموضة","أستاذ الستايل"];
  const LEVEL_TITLES_EN = ["Beginner","Learner","Fashion Curious","Style Lover","Color Expert","Style Consultant","Fashion Pro","Style Master"];
  const LEVEL_ICONS = ["👤","📚","👀","✨","🎨","👔","🏆","👑"];
  const lvl = Math.min(progress.userLevel - 1, XP_PER_LEVEL.length - 1);
  const xpNeeded = XP_PER_LEVEL[lvl] ?? 700;
  const xpInLevel = progress.totalXP - [0,100,300,650,1150,1850,2500][Math.min(progress.userLevel-1,6)];
  const pct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  const titleIndex = Math.min(progress.userLevel - 1, LEVEL_TITLES_AR.length - 1);
  const titleText = lang === "ar" ? LEVEL_TITLES_AR[titleIndex] : LEVEL_TITLES_EN[titleIndex];
  const icon = LEVEL_ICONS[titleIndex] ?? "👑";
  return (
    <div className="journey-card">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
        <div>
          <p style={{ fontSize:"11px", color:"#888", marginBottom:"2px", letterSpacing:"0.5px", textTransform:"uppercase" }}>{t.journeyTitle}</p>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"22px" }}>{icon}</span>
            <div>
              <p style={{ color:"#D4AF37", fontWeight:"700", fontSize:"15px", lineHeight:1.2 }}>{titleText}</p>
              <p style={{ color:"#666", fontSize:"12px" }}>{t.journeyLevel} {progress.userLevel}</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: lang === "ar" ? "left" : "right" }}>
          <p style={{ color:"#D4AF37", fontWeight:"700", fontSize:"18px" }}>{progress.totalXP} <span style={{ fontSize:"12px", color:"#888" }}>XP</span></p>
          <p style={{ color:"#555", fontSize:"11px" }}>{xpNeeded - xpInLevel} {t.journeyNextLevel}</p>
        </div>
      </div>
      <div className="xp-bar-track"><div className="xp-bar-fill" style={{ width:`${pct}%` }} /></div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px" }}>
        <span style={{ fontSize:"11px", color:"#555" }}>{xpInLevel} XP</span>
        <span style={{ fontSize:"11px", color:"#555" }}>{xpNeeded} XP</span>
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────
function AuthModal({ onClose, onSuccess, onGuest }: {
  onClose: () => void;
  onSuccess: () => void;
  onGuest: () => void;
}) {
  const { signin, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [username, setUsername] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(""); setSuccessMsg(""); setAuthLoading(true);
    try {
      if (mode === "login") {
        await signin(email, password, keepLoggedIn);
        onSuccess();
      } else {
        await signup(email, password, username);
        setSuccessMsg("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتفعيل الحساب.");
        setMode("login");
        setPassword("");
        setUsername("");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError("يرجى تأكيد بريدك الإلكتروني أولاً.");
      } else if (msg.toLowerCase().includes("invalid login credentials")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        setError(msg || "حدث خطأ، حاول مرة أخرى.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border border-[#D4AF37]/40 bg-black p-8"
        style={{ boxShadow: "0 0 60px rgba(212,175,55,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-[#D4AF37] transition-colors text-xl leading-none">✕</button>
        <div className="flex flex-col items-center mb-6">
          <span className="text-3xl font-bold text-[#D4AF37] tracking-widest">LEO</span>
          <p className="text-gray-500 text-xs mt-1 tracking-widest">{mode === "login" ? "Welcome back" : "Create your account"}</p>
        </div>
        <div className="flex bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-xl p-1 mb-6">
          <button type="button" onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
            className={"flex-1 py-2 rounded-lg text-sm font-medium transition-all " + (mode === "login" ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-gray-500 hover:text-gray-300")}>
            Sign In
          </button>
          <button type="button" onClick={() => { setMode("signup"); setError(""); setSuccessMsg(""); setUsername(""); }}
            className={"flex-1 py-2 rounded-lg text-sm font-medium transition-all " + (mode === "signup" ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-gray-500 hover:text-gray-300")}>
            Sign Up
          </button>
        </div>
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs text-center leading-relaxed">{successMsg}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
            className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
          {mode === "signup" && (
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required
              className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
          )}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
            className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
          {mode === "login" && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setKeepLoggedIn(v => !v)}
                className={"w-4 h-4 rounded border flex items-center justify-center transition-all " + (keepLoggedIn ? "bg-[#D4AF37] border-[#D4AF37]" : "border-[#D4AF37]/40 bg-transparent")}>
                {keepLoggedIn && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className="text-gray-400 text-xs">Keep me logged in</span>
            </label>
          )}
          {error && <p className="text-red-400 text-xs text-center leading-relaxed">{error}</p>}
          <button type="submit" disabled={authLoading}
            className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-xl hover:bg-[#E5C158] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {authLoading && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
            {mode === "login" ? "Sign In" : "✨ Create Free Account"}
          </button>
        </form>
        <div className="mt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#D4AF37]/10" />
            <span className="text-gray-600 text-xs">or</span>
            <div className="flex-1 h-px bg-[#D4AF37]/10" />
          </div>
          <button type="button" onClick={onGuest}
            className="w-full border border-[#D4AF37]/20 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 py-3 rounded-xl text-sm transition-all">
            👁️ Continue as Guest
          </button>
          <p className="text-gray-600 text-xs text-center mt-2">Limited features • No account required</p>
        </div>
      </div>
    </div>
  );
}

export default function AIStylistPage() {
  const { user, loading, signout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage } = useSafeLanguage();

  const lang = language === "en" ? "en" : "ar";
  const t = TEXT[lang];
  const isRTL = lang === "ar";
  const requestLock = useRef(false);

  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"analyze"|"stylist"|"wardrobe"|"myleo">("analyze");
  const [styleGoal, setStyleGoal] = useState<StyleGoal>(null);
  const [step, setStep] = useState<"form"|"summary">("form");
  const [reply, setReply] = useState<string|null>(null);
  const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
  const [displayText, setDisplayText] = useState("");
  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingImprove, setLoadingImprove] = useState(false);
  const [variation, setVariation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [accuracy, setAccuracy] = useState<number|null>(null);
  const [feedbackState, setFeedbackState] = useState<string|null>(null);
  const [imageUrl, setImageUrl] = useState<string|null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalAge, setModalAge] = useState("");
  const [modalHeight, setModalHeight] = useState("");
  const [modalWeight, setModalWeight] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string|null>(null);
  const [countdown, setCountdown] = useState<number|null>(null);
  const countdownRef = useRef<NodeJS.Timeout|null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [form, setForm] = useState({ gender:"male", hijab:"no", occasion:"business", age:"", height:"", weight:"" });
  const [analysisImage, setAnalysisImage] = useState<File|null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult|null>(null);
  const [analysisError, setAnalysisError] = useState<string|null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream|null>(null);
  const analysisLock = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const [styleHistory, setStyleHistory] = useState<HistoryEntry[]>([]);
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);

  function goToSignup() { setShowAuthModal(true); }

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const guestFlag = typeof window !== "undefined" ? localStorage.getItem("leo_guest") : null;
      if (guestFlag === "true") { setIsGuest(true); } else { router.replace("/"); }
    } else {
      setIsGuest(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("leo_guest");
        // ─── FIX: Do NOT reset analysis count for logged-in users on mount.
        // Count is managed daily via leo_analysis_date below.
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!mounted) return;
    const savedForm = localStorage.getItem("leo_form");
    if (savedForm) setForm(JSON.parse(savedForm));

    const today = new Date().toDateString();
    const savedDate = localStorage.getItem("leo_analysis_date");
    if (savedDate !== today) {
      setAnalysisCount(0);
      localStorage.setItem("leo_analysis_count", "0");
      localStorage.setItem("leo_analysis_date", today);
    } else {
      setAnalysisCount(parseInt(localStorage.getItem("leo_analysis_count") || "0", 10));
    }

    setImageCount(parseInt(localStorage.getItem("leo_image_count") || "0", 10));
    const savedHistory = localStorage.getItem("leo_style_history");
    if (savedHistory) setStyleHistory(JSON.parse(savedHistory));
    const savedWishlist = localStorage.getItem("leo_wishlist");
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    const savedGoal = localStorage.getItem("leo_style_goal") as StyleGoal;
    if (savedGoal) setStyleGoal(savedGoal);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const ignore = sessionStorage.getItem("leo_ignore_memory");
    if (ignore) return;
    const saved = localStorage.getItem("leo_last_outfit");
    if (saved) { setReply(saved); setStep("summary"); }
  }, [mounted]);

  useEffect(() => {
    if (!reply) return;
    let i = 0; setDisplayText("");
    const interval = setInterval(() => { setDisplayText(reply.slice(0, i)); i++; if (i > reply.length) clearInterval(interval); }, 15);
    return () => clearInterval(interval);
  }, [reply]);

  function handleSetStyleGoal(goal: StyleGoal) {
    setStyleGoal(goal);
    if (goal) localStorage.setItem("leo_style_goal", goal);
    else localStorage.removeItem("leo_style_goal");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (mounted) localStorage.setItem("leo_form", JSON.stringify(updated));
  }

  function saveToHistory(result: AnalysisResult) {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month:"short", day:"numeric" }),
      score: result.finalScore, styleType: result.styleType, fitType: result.fitType,
    };
    const updated = [...styleHistory, entry];
    setStyleHistory(updated);
    localStorage.setItem("leo_style_history", JSON.stringify(updated));
  }

  function clearHistory() { setStyleHistory([]); localStorage.removeItem("leo_style_history"); }

  function saveToWishlist() {
    if (!reply) return;
    const entry: WishlistEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month:"short", day:"numeric" }),
      occasion: form.occasion, text: reply, note: "", priority: "normal",
    };
    const updated = [...wishlist, entry];
    setWishlist(updated);
    localStorage.setItem("leo_wishlist", JSON.stringify(updated));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function deleteWishlist(id: string) {
    const updated = wishlist.filter(w => w.id !== id);
    setWishlist(updated);
    localStorage.setItem("leo_wishlist", JSON.stringify(updated));
  }

  function updateWishlistNote(id: string, note: string) {
    const updated = wishlist.map(w => w.id === id ? { ...w, note } : w);
    setWishlist(updated);
    localStorage.setItem("leo_wishlist", JSON.stringify(updated));
  }

  function updateWishlistPriority(id: string, priority: WishlistEntry["priority"]) {
    const updated = wishlist.map(w => w.id === id ? { ...w, priority } : w);
    setWishlist(updated);
    localStorage.setItem("leo_wishlist", JSON.stringify(updated));
  }

  async function submitRequest(extra = false, v = variation) {
    if (isGuest) { goToSignup(); return; }
    if (requestLock.current) return;
    requestLock.current = true;
    if (extra) setLoadingImprove(true); else setLoadingMain(true);
    const payload = {
      userId: localStorage.getItem("leo_user_id") || (() => { const id = "user_" + Math.random().toString(36).slice(2,9); localStorage.setItem("leo_user_id", id); return id; })(),
      gender: form.gender, hijab: form.gender === "female" ? form.hijab === "yes" : false,
      occasion: form.occasion, age: extra ? Number(form.age) : undefined,
      height: extra ? Number(form.height) : undefined, weight: extra ? Number(form.weight) : undefined,
      language, variation: v, mode: extra ? "accurate" : "normal",
      feedback: localStorage.getItem("leo_feedback") || null, style: selectedStyle || undefined,
      goal: styleGoal || undefined,
    };
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch("/api/ai-stylist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload), signal:controller.signal });
      const data = await res.json();
      setGeneratedOutfit(data.outfit); clearTimeout(timeout);
      if (!data?.text) { setReply("⚠️ No response from stylist."); return; }
      setReply(data.text); setAccuracy(data.accuracy ?? null);
      localStorage.setItem("leo_last_outfit", data.text);
      setStep("summary");
    } catch { setReply("⚠️ Network or server error."); }
    finally { requestLock.current = false; setLoadingMain(false); setLoadingImprove(false); }
  }

  async function submitRequestWithData(updatedForm: typeof form) {
    if (isGuest) { goToSignup(); return; }
    if (requestLock.current) return;
    requestLock.current = true;
    setLoadingImprove(true);
    const payload = {
      userId: localStorage.getItem("leo_user_id") || (() => { const id = "user_" + Math.random().toString(36).slice(2,9); localStorage.setItem("leo_user_id", id); return id; })(),
      gender: updatedForm.gender, hijab: updatedForm.gender === "female" ? updatedForm.hijab === "yes" : false,
      occasion: updatedForm.occasion, age: Number(updatedForm.age), height: Number(updatedForm.height), weight: Number(updatedForm.weight),
      language, variation, mode: "accurate", feedback: localStorage.getItem("leo_feedback") || null,
      style: selectedStyle || undefined, goal: styleGoal || undefined,
    };
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch("/api/ai-stylist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload), signal:controller.signal });
      const data = await res.json();
      setGeneratedOutfit(data.outfit); clearTimeout(timeout);
      if (!data?.text) { setReply("⚠️ No response from stylist."); return; }
      setReply(data.text); setAccuracy(data.accuracy ?? null);
      localStorage.setItem("leo_last_outfit", data.text);
      setStep("summary");
    } catch { setReply("⚠️ Network or server error."); }
    finally { requestLock.current = false; setLoadingImprove(false); }
  }

  function handleShare() {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerateImage() {
    if (isGuest) { goToSignup(); return; }
    if (!reply) return;
    setLoadingImage(true);
    try {
      const res = await fetch("/api/generate-look-image", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ gender:form.gender, outfit:generatedOutfit, description:reply, ...(selectedStyle ? {style:selectedStyle} : {}) }) });
      const data = await res.json();
      if (data?.url) { const newCount = imageCount+1; setImageUrl(data.url); setImageCount(newCount); localStorage.setItem("leo_image_count", String(newCount)); }
    } catch(err) { console.error(err); }
    setLoadingImage(false);
  }

  function handleRefineLook() {
    if (isGuest) { goToSignup(); return; }
    if (!reply) return;
    localStorage.setItem("leo_feedback", lang === "ar" ? "تعديل اللوك" : "Refine this look");
    submitRequest(false, variation);
  }

  function handleModalSubmit() {
    if (!modalAge || !modalHeight || !modalWeight) return;
    const updatedForm = { ...form, age:modalAge, height:modalHeight, weight:modalWeight };
    setForm(updatedForm); setActionModalOpen(false);
    submitRequestWithData(updatedForm);
  }

  function handleActionGenerateImage() {
    if (isGuest) { goToSignup(); return; }
    if (imageCount >= IMAGE_LIMIT || countdown !== null) return;
    setCountdown(2);
    let remaining = 2;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) { clearInterval(countdownRef.current!); countdownRef.current = null; setCountdown(null); handleGenerateImage(); }
      else setCountdown(remaining);
    }, 1000);
  }

  function toggleLanguage() { if (setLanguage) setLanguage(lang === "en" ? "ar" : "en"); }

  async function compressImage(file: File): Promise<string> {
    return new Promise(resolve => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1024;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h*MAX/w); w = MAX; } else { w = Math.round(w*MAX/h); h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82).split(",")[1]);
      };
      img.src = url;
    });
  }

  async function handleAnalyzeOutfit() {
    // ─── FIX: Correct limit logic ─────────────────────────────
    // Guest: 1 free analysis, then prompt to sign up
    // Logged-in user: 3 free analyses/day, then prompt to upgrade
    const freeLimit = isGuest ? 1 : 3;

    // If guest AND already hit limit → open signup modal
    if (isGuest && analysisCount >= freeLimit) {
      goToSignup();
      return;
    }

    // Block if no image, already loading, lock active, or logged-in user hit daily limit
    if (!analysisImage || analysisLoading || analysisLock.current) return;
    if (!isGuest && analysisCount >= freeLimit) return; // logged-in: silently blocked (banner handles UI)

    analysisLock.current = true;
    setAnalysisLoading(true); setAnalysisResult(null); setAnalysisError(null);
    try {
      const base64 = await compressImage(analysisImage);
      const { data: sessionData } = await (await import("@/app/lib/supabase")).supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token ?? null;
      const res = await fetch("/api/analyze-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          language: lang,
          accessToken,
          gender: localStorage.getItem("leo_gender") ?? form.gender ?? "male",
          hijab: localStorage.getItem("leo_hijab") === "true",
        }),
      });
      const data = await res.json();
      if (res.status === 403 && data?.error === "limit_reached") {
        const newCount = freeLimit;
        setAnalysisCount(newCount);
        localStorage.setItem("leo_analysis_count", String(newCount));
        localStorage.setItem("leo_analysis_date", new Date().toDateString());
        setAnalysisError(t.limitMsg);
        return;
      }
      if (!res.ok || !data?.result) throw new Error(data?.error || "No result");
      setAnalysisResult(data.result);
      saveToHistory(data.result);
      const newCount = data.usageCount ?? analysisCount + 1;
      setAnalysisCount(newCount);
      localStorage.setItem("leo_analysis_count", String(newCount));
      localStorage.setItem("leo_analysis_date", new Date().toDateString());
    } catch { setAnalysisError(t.errorMsg); }
    finally { analysisLock.current = false; setAnalysisLoading(false); }
  }

  async function handleOpenCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" } });
      setCameraStream(stream); setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 100);
    } catch { setAnalysisError(lang === "ar" ? "تعذّر الوصول للكاميرا." : "Camera access denied."); }
  }

  function handleCapturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) { setAnalysisImage(new File([blob], "camera-capture.jpg", { type:"image/jpeg" })); setAnalysisResult(null); setAnalysisError(null); }
    }, "image/jpeg", 0.9);
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null); setCameraOpen(false);
  }

  function handleCloseCamera() { cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); setCameraOpen(false); }

  const STYLE_OPTIONS = [
    { value:"classic", label:t.styleClassic }, { value:"streetwear", label:t.styleStreetwear },
    { value:"elegant", label:t.styleElegant }, { value:"sporty", label:t.styleSporty },
    { value:"luxury", label:t.styleLuxury }, { value:"casual", label:t.styleCasual },
    { value:"formal", label:t.styleFormal }, { value:"old_money", label:t.styleOldMoney },
  ];

  const smartNoteParts = reply ? reply.split(/ملاحظة ذكية:|smart note:/i) : [];
  const smartNote = smartNoteParts.length > 1 ? smartNoteParts[1].trim() : null;
  const mainText = smartNote ? (reply ?? "").replace(/ملاحظة ذكية:[\s\S]*/i,"").replace(/smart note:[\s\S]*/i,"").trim() : (reply ?? "");
  const tone = mainText.length > 350 ? t.toneDetailed : t.toneQuick;

  if (loading) return null;
  if (!user && !isGuest) return null;

  if (!mounted) return (
    <section className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-gray-800 rounded animate-pulse mb-10" />
      <div className="space-y-4 bg-black border border-[#D4AF37]/30 p-8 rounded-2xl">
        <div className="h-12 bg-gray-800 rounded animate-pulse" />
        <div className="h-12 bg-gray-800 rounded animate-pulse" />
      </div>
    </section>
  );

  return (
    <section className="max-w-3xl mx-auto px-6 pt-32 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#D4AF37]">{t.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className="lang-toggle-btn">{t.langToggle}</button>
          {user && (
            <button onClick={async () => { await signout(); router.push("/"); }} className="lang-toggle-btn" style={{ borderColor: "rgba(231,76,60,0.5)", color: "#E74C3C" }}>
              🚪 {lang === "ar" ? "خروج" : "Logout"}
            </button>
          )}
        </div>
      </div>

      {isGuest && (
        <div className="guest-banner">
          <div>
            <p style={{ color:"#D4AF37", fontWeight:"600", fontSize:"14px" }}>👁️ {t.guestBannerTitle}</p>
            <p style={{ color:"#888", fontSize:"12px", marginTop:"2px" }}>{t.guestBannerSub}</p>
          </div>
          <button onClick={goToSignup} style={{ background:"#D4AF37", color:"black", fontWeight:"700", padding:"8px 18px", borderRadius:"999px", border:"none", cursor:"pointer", fontSize:"13px", whiteSpace:"nowrap" }}>
            {t.guestSignup}
          </button>
        </div>
      )}

      <div className="tab-bar">
        <button className={"tab-btn"+(activeTab==="analyze"  ?" tab-btn-active":"")} onClick={()=>setActiveTab("analyze")}>🔍 {t.tabAnalyze}</button>
        <button className={"tab-btn"+(activeTab==="wardrobe" ?" tab-btn-active":"")} onClick={()=>setActiveTab("wardrobe")}>🗄️ {t.tabWardrobe}</button>
        <button className={"tab-btn"+(activeTab==="myleo"    ?" tab-btn-active":"")} onClick={()=>setActiveTab("myleo")}>👤 {t.tabMyLeo}</button>
      </div>

      {/* ─── Analyze Tab: NO GuestLockOverlay here ─────────── */}
      {/* Guest can do 1 free analysis. LimitBanner inside     */}
      {/* AnalyzeSection handles the UI after limit is reached.*/}
      {activeTab === "analyze" && (
        <AnalyzeSection
          analysisImage={analysisImage}
          setAnalysisImage={setAnalysisImage}
          analysisLoading={analysisLoading}
          analysisResult={analysisResult}
          setAnalysisResult={setAnalysisResult}
          analysisError={analysisError}
          setAnalysisError={setAnalysisError}
          analysisCount={analysisCount}
          cameraOpen={cameraOpen}
          videoRef={videoRef}
          canvasRef={canvasRef}
          handleAnalyzeOutfit={handleAnalyzeOutfit}
          handleOpenCamera={handleOpenCamera}
          handleCapturePhoto={handleCapturePhoto}
          handleCloseCamera={handleCloseCamera}
          limitReached={isGuest ? analysisCount >= 1 : analysisCount >= 3}
          t={t}
          lang={lang}
          styleGoal={styleGoal}
          setStyleGoal={setStyleGoal}
          isGuest={isGuest}
          onUpgrade={() => router.push("/pricing")}
          onSignUp={goToSignup}
        />
      )}

      {/* ─── Stylist Tab: locked for guests ─────────────────── */}
      {activeTab === "stylist" && (
        <div style={{ position:"relative" }}>
          <StylistSection
            form={form} handleChange={handleChange} selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle} STYLE_OPTIONS={STYLE_OPTIONS}
            step={step} setStep={setStep} reply={reply} displayText={displayText}
            loadingMain={loadingMain} loadingImprove={loadingImprove} accuracy={accuracy}
            tone={tone} smartNote={smartNote} mainText={mainText} imageUrl={imageUrl}
            loadingImage={loadingImage} imageCount={imageCount} countdown={countdown}
            bodyDataSubmitted={!!(form.age && form.height && form.weight)} feedbackState={feedbackState}
            setFeedbackState={setFeedbackState} copied={copied} savedFlash={savedFlash}
            submitRequest={submitRequest} handleRefineLook={handleRefineLook}
            handleShare={handleShare} saveToWishlist={saveToWishlist}
            handleActionGenerateImage={handleActionGenerateImage}
            setActionModalOpen={setActionModalOpen} t={t} lang={lang}
            styleGoal={styleGoal} setStyleGoal={handleSetStyleGoal}
          />
          {isGuest && <GuestLockOverlay message={t.guestFeatureLocked} onSignup={goToSignup} />}
        </div>
      )}

      {/* ─── Wardrobe Tab: locked for guests ────────────────── */}
      {activeTab === "wardrobe" && (
        <div style={{ position:"relative" }}>
<WardrobeSection username={user?.email || "guest"} city={"Amman"} lang={lang} />
          {isGuest && <GuestLockOverlay message={t.guestFeatureLocked} onSignup={goToSignup} />}
        </div>
      )}

      {/* ─── MyLEO Tab: locked for guests ───────────────────── */}
      {activeTab === "myleo" && (
        <div style={{ position:"relative" }}>
          <MyLeoSection
            styleHistory={styleHistory} wishlist={wishlist} isRTL={isRTL}
            deleteWishlist={deleteWishlist} updateWishlistNote={updateWishlistNote}
            updateWishlistPriority={updateWishlistPriority} clearHistory={clearHistory}
            t={t} lang={lang}
          />
          {isGuest && <GuestLockOverlay message={t.guestFeatureLocked} onSignup={goToSignup} />}
        </div>
      )}

      {actionModalOpen && (
        <div className="modal-overlay" onClick={()=>setActionModalOpen(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <p className="text-[#D4AF37] font-semibold text-lg mb-4">{t.modalTitle}</p>
            <input value={modalAge} onChange={e=>setModalAge(e.target.value)} placeholder={t.age} className="input mb-3" type="number" />
            <input value={modalHeight} onChange={e=>setModalHeight(e.target.value)} placeholder={t.height} className="input mb-3" type="number" />
            <input value={modalWeight} onChange={e=>setModalWeight(e.target.value)} placeholder={t.weight} className="input mb-5" type="number" />
            <div className="flex gap-3">
              <button type="button" onClick={handleModalSubmit} className="btn-outline">{t.modalSubmit}</button>
              <button type="button" onClick={()=>setActionModalOpen(false)} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{t.modalCancel}</button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => { setShowAuthModal(false); setIsGuest(false); }}
          onGuest={() => setShowAuthModal(false)}
        />
      )}
    </section>
  );
}
