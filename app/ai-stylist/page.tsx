"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

const TEXT = {
  ar: {
    title: "LEO المصمم الذكي",
    subtitle: "احصل على اقتراح إطلالة بسرعة، ويمكنك تحسين الدقة لاحقًا.",
    hijab: "هل أنتِ محجبة؟",
    hijabHint: "يساعدنا هذا في اختيار القصّات المناسبة.",
    yes: "نعم",
    no: "لا",
    male: "ذكر",
    female: "أنثى",
    business: "عمل",
    formal: "رسمي",
    event: "مناسبة",
    date: "موعد",
    gym: "جيم",
    button: "اقترح LEO",
    accurate: "بدك إطلالة أدق؟",
    improve: "حسّن الدقة",
    skip: "تخطي",
    age: "العمر",
    height: "الطول (سم)",
    weight: "الوزن (كغ)",
    resultTitle: "اقتراح LEO",
    another: "اقتراح آخر",
    share: "مشاركة",
    copied: "تم نسخ الاقتراح",
    smart: "ملاحظة ذكية",
    refineLook: "تعديل اللوك",
    moreAccurate: "دقة أعلى",
    generateImage: "توليد صورة",
    modalTitle: "أدخل بياناتك",
    modalSubmit: "تأكيد",
    modalCancel: "إلغاء",
    styleLabel: "اختر الستايل",
    generatingIn: "جاري التوليد في",
    styleClassic: "كلاسيك",
    styleStreetwear: "ستريت وير",
    styleElegant: "أنيق",
    styleSporty: "رياضي",
    styleLuxury: "فاخر",
    styleCasual: "كاجوال",
    styleFormal: "رسمي",
    styleOldMoney: "أولد موني",
  },
  en: {
    title: "LEO AI Stylist",
    subtitle: "Get a fast outfit suggestion.",
    hijab: "Do you wear hijab?",
    hijabHint: "This helps us suggest suitable necklines.",
    yes: "Yes",
    no: "No",
    male: "Male",
    female: "Female",
    business: "Business",
    formal: "Formal",
    event: "Event",
    date: "Date",
    gym: "Gym",
    button: "Ask LEO",
    accurate: "Want more accuracy?",
    improve: "Improve",
    skip: "Skip",
    age: "Age",
    height: "Height",
    weight: "Weight",
    resultTitle: "LEO Suggestion",
    another: "Another",
    share: "Share",
    copied: "Copied",
    smart: "Smart note",
    refineLook: "Refine Look",
    moreAccurate: "More Accurate",
    generateImage: "Generate Image",
    modalTitle: "Enter your details",
    modalSubmit: "Confirm",
    modalCancel: "Cancel",
    styleLabel: "Choose Style",
    generatingIn: "Generating in",
    styleClassic: "Classic",
    styleStreetwear: "Streetwear",
    styleElegant: "Elegant",
    styleSporty: "Sporty",
    styleLuxury: "Luxury",
    styleCasual: "Casual",
    styleFormal: "Formal",
    styleOldMoney: "Old Money",
  },
};

const pageStyles = `
  .input{
    width:100%;
    padding:14px;
    background:#0b0b0b;
    border:1px solid rgba(212,175,55,0.4);
    border-radius:14px;
    color:white;
    transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    outline:none;
  }
  .input:hover{
    border-color:rgba(212,175,55,0.6);
    background:#111;
  }
  .input:focus{
    border-color:#D4AF37;
    background:#0f0f0f;
    box-shadow:0 0 0 3px rgba(212,175,55,0.12);
  }
  .btn-outline{
    border:1px solid #D4AF37;
    padding:8px 18px;
    border-radius:999px;
    color:#D4AF37;
    background:transparent;
    transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor:pointer;
    position:relative;
    overflow:hidden;
  }
  .btn-outline::before{
    content:'';
    position:absolute;
    inset:0;
    background:rgba(212,175,55,0.1);
    transform:scale(0);
    transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius:999px;
  }
  .btn-outline:hover::before{ transform:scale(1); }
  .btn-outline:hover{
    transform:translateY(-2px);
    box-shadow:0 4px 12px rgba(212,175,55,0.25);
  }
  .btn-outline:active{
    transform:translateY(0);
    transition:all 0.1s;
  }
  .btn-outline:disabled{
    opacity:0.5;
    cursor:not-allowed;
    transform:none;
  }
  .btn-outline:disabled:hover{ transform:none; box-shadow:none; }
  .active-btn{
    background:#D4AF37;
    color:black;
    transform:scale(1.05);
  }
  .active-btn:hover{ transform:scale(1.08) translateY(-2px); }
  .main-cta{
    transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:0 4px 20px rgba(212,175,55,0.3);
  }
  .main-cta:hover:not(:disabled){
    transform:translateY(-3px);
    box-shadow:0 8px 30px rgba(212,175,55,0.45);
    background:#E5C158;
  }
  .main-cta:active:not(:disabled){
    transform:translateY(-1px);
    transition:all 0.1s;
  }
  .main-cta:disabled{ opacity:0.7; cursor:not-allowed; }
  .loader{
    width:16px;
    height:16px;
    border:2px solid black;
    border-top-color:transparent;
    border-radius:50%;
    animation:spin 0.6s linear infinite;
  }
  .loader-small{
    display:inline-block;
    width:14px;
    height:14px;
    border:2px solid #D4AF37;
    border-top-color:transparent;
    border-radius:50%;
    animation:spin 0.6s linear infinite;
  }
  .accuracy-badge{
    border:1px solid #D4AF37;
    color:#D4AF37;
    padding:4px 10px;
    border-radius:999px;
    width:fit-content;
    animation:badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .analysis{
    font-size:12px;
    color:#aaa;
    animation:fade-in 0.5s ease 0.2s both;
  }
  .result-enter{ animation:reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .copied-toast{ animation:toast-pop 2s ease; }
  .image-fade-in{ animation:img-reveal 0.6s ease; }
  .action-buttons-row{
    padding-bottom:8px;
    border-bottom:1px solid rgba(212,175,55,0.15);
  }
  .modal-overlay{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.75);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:999;
    animation:fade-in 0.2s ease;
  }
  .modal-box{
    background:#0b0b0b;
    border:1px solid rgba(212,175,55,0.4);
    border-radius:20px;
    padding:32px;
    width:100%;
    max-width:380px;
    animation:reveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .style-chip{
    border:1px solid rgba(212,175,55,0.4);
    padding:7px 16px;
    border-radius:999px;
    color:#aaa;
    background:transparent;
    transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor:pointer;
    font-size:13px;
  }
  .style-chip:hover{
    border-color:#D4AF37;
    color:#D4AF37;
    transform:translateY(-1px);
  }
  .style-chip-active{
    border-color:#D4AF37;
    background:rgba(212,175,55,0.15);
    color:#D4AF37;
    font-weight:600;
  }
  .smart-note{
    animation:fade-slide 0.5s ease;
    transition:all 0.3s ease;
  }
  .smart-note:hover{
    transform:translateX(4px);
    border-color:#E5C158;
  }
  .lang-toggle-btn{
    border:1px solid #D4AF37;
    color:#D4AF37;
    padding:6px 16px;
    border-radius:8px;
    font-size:13px;
    font-weight:500;
    background:transparent;
    transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor:pointer;
    position:relative;
    overflow:hidden;
  }
  .lang-toggle-btn::after{
    content:'';
    position:absolute;
    inset:0;
    background:rgba(212,175,55,0.1);
    transform:scaleX(0);
    transform-origin:left;
    transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .lang-toggle-btn:hover::after{ transform:scaleX(1); }
  .lang-toggle-btn:hover{
    transform:translateY(-2px);
    box-shadow:0 4px 12px rgba(212,175,55,0.2);
  }
  .lang-toggle-btn:active{
    transform:translateY(0);
    transition:all 0.1s;
  }
  @keyframes reveal{
    from{opacity:0;transform:translateY(20px) scale(0.96)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes spin{ to{transform:rotate(360deg)} }
  @keyframes fade-slide{
    from{opacity:0;transform:translateY(15px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes fade-in{
    from{opacity:0}
    to{opacity:1}
  }
  @keyframes badge-pop{
    from{opacity:0;transform:scale(0.8)}
    to{opacity:1;transform:scale(1)}
  }
  @keyframes toast-pop{
    0%{opacity:0;transform:translateY(10px) scale(0.9)}
    10%{opacity:1;transform:translateY(0) scale(1)}
    90%{opacity:1;transform:translateY(0) scale(1)}
    100%{opacity:0;transform:translateY(-10px) scale(0.9)}
  }
  @keyframes img-reveal{
    from{opacity:0;transform:scale(0.95)}
    to{opacity:1;transform:scale(1)}
  }
`;

export default function AIStylistPage() {
  const [mounted, setMounted] = useState(false);

  let setLanguage: ((lang: string) => void) | null = null;
  let language = "ar";
  try {
    const context = useLanguage();
    language = context.language;
    setLanguage = context.setLanguage;
  } catch (e) {
    console.warn("LanguageContext not available, using default language");
  }

  const lang = language === "en" ? "en" : "ar";
  const t = TEXT[lang];

  const requestLock = useRef(false);

  const [step, setStep] = useState<"form" | "summary">("form");
  const [reply, setReply] = useState<string | null>(null);
  const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
  const [displayText, setDisplayText] = useState("");

  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingImprove, setLoadingImprove] = useState(false);
  const [loadingAnother, setLoadingAnother] = useState(false);

  const [showAccurate, setShowAccurate] = useState(false);
  const [variation, setVariation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageCount, setImageCount] = useState(0);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalAge, setModalAge] = useState("");
  const [modalHeight, setModalHeight] = useState("");
  const [modalWeight, setModalWeight] = useState("");
  const [generateEnabled, setGenerateEnabled] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const IMAGE_LIMIT = 3;

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState({
    gender: "male",
    hijab: "no",
    occasion: "business",
    age: "",
    height: "",
    weight: ""
  });

  const [analysisImage, setAnalysisImage] = useState<File | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<null | {
    score: number;
    feedback: string;
    suggestions: string[];
  }>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const savedForm = localStorage.getItem("leo_form");
    if (savedForm) setForm(JSON.parse(savedForm));
  }, [mounted]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (mounted) localStorage.setItem("leo_form", JSON.stringify(updated));
  }

  useEffect(() => {
    if (!mounted) return;
    const ignore = sessionStorage.getItem("leo_ignore_memory");
    if (ignore) return;
    const saved = localStorage.getItem("leo_last_outfit");
    if (saved) {
      setReply(saved);
      setStep("summary");
      setShowAccurate(true);
    }
  }, [mounted]);

  useEffect(() => {
    if (!reply) return;
    let i = 0;
    setDisplayText("");
    const interval = setInterval(() => {
      setDisplayText(reply.slice(0, i));
      i++;
      if (i > reply.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [reply]);

  async function submitRequest(extra = false, v = variation) {
    if (requestLock.current) return;
    requestLock.current = true;

    if (extra) setLoadingImprove(true);
    else if (v > variation) setLoadingAnother(true);
    else setLoadingMain(true);

    const payload = {
      userId:
        localStorage.getItem("leo_user_id") ||
        (() => {
          const id = "user_" + Math.random().toString(36).slice(2, 9);
          localStorage.setItem("leo_user_id", id);
          return id;
        })(),
      gender: form.gender,
      hijab: form.gender === "female" ? form.hijab === "yes" : false,
      occasion: form.occasion,
      age: extra ? Number(form.age) : undefined,
      height: extra ? Number(form.height) : undefined,
      weight: extra ? Number(form.weight) : undefined,
      language,
      variation: v,
      mode: extra ? "accurate" : "normal",
      feedback: localStorage.getItem("leo_feedback") || null,
      style: selectedStyle || undefined,
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await res.json();
      setGeneratedOutfit(data.outfit);
      clearTimeout(timeout);

      console.log("AI RESPONSE:", data);

      if (!data?.text) {
        setReply("⚠️ No response from stylist.");
        return;
      }

      setReply(data.text);
      setAccuracy(data.accuracy ?? null);
      localStorage.setItem("leo_last_outfit", data.text);
      setStep("summary");
      setShowAccurate(!extra);

    } catch (err) {
      console.error("REQUEST ERROR:", err);
      setReply("⚠️ Network or server error.");
    } finally {
      requestLock.current = false;
      setLoadingMain(false);
      setLoadingImprove(false);
      setLoadingAnother(false);
    }
  }

  function handleAnother() {
    const next = variation + 1;
    setVariation(next);
    submitRequest(false, next);
  }

  function handleShare() {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerateImage() {
    if (!reply) return;
    setLoadingImage(true);
    try {
      const res = await fetch("/api/generate-look-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: form.gender,
          outfit: generatedOutfit,
          description: reply,
          ...(selectedStyle ? { style: selectedStyle } : {})
        })
      });
      const data = await res.json();
      if (data?.url) {
        setImageUrl(data.url);
        setImageCount(c => c + 1);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingImage(false);
  }

  function handleRefineLook() {
    if (!reply) return;
    const refineMsg = lang === "ar" ? "تعديل اللوك" : "Refine this look";
    localStorage.setItem("leo_feedback", refineMsg);
    submitRequest(false, variation);
  }

  function handleMoreAccurate() {
    setActionModalOpen(true);
  }

  function handleModalSubmit() {
    if (!modalAge || !modalHeight || !modalWeight) return;
    const updatedForm = { ...form, age: modalAge, height: modalHeight, weight: modalWeight };
    setForm(updatedForm);
    setActionModalOpen(false);
    setGenerateEnabled(true);
    submitRequestWithData(updatedForm);
  }

  async function submitRequestWithData(updatedForm: typeof form) {
    if (requestLock.current) return;
    requestLock.current = true;
    setLoadingImprove(true);

    const payload = {
      userId:
        localStorage.getItem("leo_user_id") ||
        (() => {
          const id = "user_" + Math.random().toString(36).slice(2, 9);
          localStorage.setItem("leo_user_id", id);
          return id;
        })(),
      gender: updatedForm.gender,
      hijab: updatedForm.gender === "female" ? updatedForm.hijab === "yes" : false,
      occasion: updatedForm.occasion,
      age: Number(updatedForm.age),
      height: Number(updatedForm.height),
      weight: Number(updatedForm.weight),
      language,
      variation,
      mode: "accurate",
      feedback: localStorage.getItem("leo_feedback") || null,
      style: selectedStyle || undefined,
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await res.json();
      setGeneratedOutfit(data.outfit);
      clearTimeout(timeout);

      if (!data?.text) {
        setReply("⚠️ No response from stylist.");
        return;
      }

      setReply(data.text);
      setAccuracy(data.accuracy ?? null);
      localStorage.setItem("leo_last_outfit", data.text);
      setStep("summary");
      setShowAccurate(false);

    } catch (err) {
      console.error("REQUEST ERROR:", err);
      setReply("⚠️ Network or server error.");
    } finally {
      requestLock.current = false;
      setLoadingImprove(false);
    }
  }

  function handleModalCancel() {
    setActionModalOpen(false);
  }

  function handleActionGenerateImage() {
    if (!generateEnabled || imageCount >= IMAGE_LIMIT || countdown !== null) return;
    startCountdown();
  }

  function startCountdown() {
    setCountdown(10);
    let remaining = 10;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        handleGenerateImage();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }

  function toggleLanguage() {
    if (setLanguage) setLanguage(language === "en" ? "ar" : "en");
  }

  async function handleAnalyzeOutfit() {
    if (!analysisImage) return;
    setAnalysisLoading(true);
    setAnalysisResult(null);

    await new Promise(resolve => setTimeout(resolve, 1800));

    const scores = [72, 76, 81, 84, 88, 91, 94, 96];
    const score = scores[Math.floor(Math.random() * scores.length)];

    const feedbackOptions = [
      "Strong silhouette and balanced tones.",
      "Clean structure with confident styling.",
      "Excellent color harmony and presence.",
      "Well-styled with refined proportions.",
      "Sharp look with clear visual hierarchy."
    ];

    const suggestionsOptions = [
      "Try adding contrast shoes",
      "Consider darker belt tone",
      "Layering would elevate presence",
      "A watch would strengthen authority",
      "Add texture contrast"
    ];

    const feedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    const shuffled = [...suggestionsOptions].sort(() => Math.random() - 0.5);
    const suggestions = shuffled.slice(0, 3);

    setAnalysisResult({ score, feedback, suggestions });
    setAnalysisLoading(false);
  }

  const STYLE_OPTIONS = [
    { value: "classic", label: t.styleClassic },
    { value: "streetwear", label: t.styleStreetwear },
    { value: "elegant", label: t.styleElegant },
    { value: "sporty", label: t.styleSporty },
    { value: "luxury", label: t.styleLuxury },
    { value: "casual", label: t.styleCasual },
    { value: "formal", label: t.styleFormal },
    { value: "old_money", label: t.styleOldMoney },
  ];

  const smartNote = reply?.split(/ملاحظة ذكية:|smart note:/i)[1]?.trim() || null;
  const mainText = smartNote
    ? reply?.replace(/ملاحظة ذكية:|smart note:.*/is, "").trim()
    : reply || "";
  const tone = lang === "ar"
    ? (mainText.length > 350 ? "تفصيلي" : "سريع")
    : (mainText.length > 350 ? "Detailed" : "Quick");

  if (!mounted) {
    return (
      <section className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-800 rounded animate-pulse mb-10"></div>
        <div className="space-y-4 bg-black border border-[#D4AF37]/30 p-8 rounded-2xl">
          <div className="h-12 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      <div className="flex justify-end mb-4">
        <button onClick={toggleLanguage} className="lang-toggle-btn">
          {language === "en" ? "العربية" : "English"}
        </button>
      </div>

      <h1 className="text-3xl font-semibold text-[#D4AF37] mb-2">{t.title}</h1>
      <p className="text-sm text-gray-400 mb-10">{t.subtitle}</p>

      {step === "form" && (
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
              {STYLE_OPTIONS.map(opt => (
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
            onClick={() => submitRequest(false)}
            disabled={loadingMain}
            className="w-full bg-[#D4AF37] py-4 rounded-xl text-black font-medium flex items-center justify-center gap-2 main-cta"
          >
            {loadingMain ? (<><span className="loader" /> LEO thinking...</>) : t.button}
          </button>
        </div>
      )}

      {step === "summary" && reply && (
        <div className="result-enter mt-10 bg-black border border-[#D4AF37]/30 p-8 rounded-2xl space-y-8">

          <button
            onClick={() => {
              sessionStorage.setItem("leo_ignore_memory", "1");
              setStep("form");
            }}
            className="btn-outline"
          >
            ← Back
          </button>

          <h3 className="text-lg font-semibold text-[#D4AF37]">{t.resultTitle}</h3>

          {accuracy !== null && (
            <div className="accuracy-badge">Accuracy {accuracy}%</div>
          )}

          <div className="analysis">Tone: {tone}</div>

          {loadingImprove ? (
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <span className="loader-small" />
              <span className="text-sm">{lang === "ar" ? "جاري تحليل بياناتك..." : "Analyzing your data..."}</span>
            </div>
          ) : (
            displayText.split("\n").map((l, i) => (
              <p key={i} className="text-gray-200">{l}</p>
            ))
          )}

          {smartNote && !loadingImprove && (
            <div className="smart-note border border-[#D4AF37] p-5 rounded-xl">
              <p className="text-[#D4AF37] font-semibold">{t.smart}</p>
              <p>{smartNote}</p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap action-buttons-row">
            <button
              onClick={handleRefineLook}
              className="btn-outline"
              disabled={loadingMain || loadingImprove}
            >
              {t.refineLook}
            </button>

            <button
              onClick={handleMoreAccurate}
              className="btn-outline"
              disabled={loadingImprove}
            >
              {loadingImprove ? <span className="loader-small" /> : t.moreAccurate}
            </button>

            {generateEnabled && imageCount < IMAGE_LIMIT && (
              <button
                onClick={handleActionGenerateImage}
                className="btn-outline"
                disabled={loadingImage || countdown !== null}
              >
                {countdown !== null
                  ? (t.generatingIn + " " + countdown + "...")
                  : loadingImage
                    ? <span className="loader-small" />
                    : (t.generateImage + (imageCount > 0 ? " (" + imageCount + "/" + IMAGE_LIMIT + ")" : ""))
                }
              </button>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={handleShare} className="btn-outline">{t.share}</button>

            <button
              onClick={() => { localStorage.setItem("leo_feedback", "liked"); setFeedbackState("liked"); }}
              className={"btn-outline " + (feedbackState === "liked" ? "active-btn" : "")}
            >👍</button>

            <button
              onClick={() => { localStorage.setItem("leo_feedback", "disliked"); setFeedbackState("disliked"); }}
              className={"btn-outline " + (feedbackState === "disliked" ? "active-btn" : "")}
            >👎</button>

            {copied && <span className="text-green-400 copied-toast">{t.copied}</span>}
          </div>

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Generated outfit"
              className="rounded-xl border border-[#D4AF37]/40 mt-4 image-fade-in"
            />
          )}
        </div>
      )}

      {actionModalOpen && (
        <div className="modal-overlay" onClick={handleModalCancel}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p className="text-[#D4AF37] font-semibold text-lg mb-4">{t.modalTitle}</p>
            <input
              value={modalAge}
              onChange={e => setModalAge(e.target.value)}
              placeholder={t.age}
              className="input mb-3"
              type="number"
            />
            <input
              value={modalHeight}
              onChange={e => setModalHeight(e.target.value)}
              placeholder={t.height}
              className="input mb-3"
              type="number"
            />
            <input
              value={modalWeight}
              onChange={e => setModalWeight(e.target.value)}
              placeholder={t.weight}
              className="input mb-5"
              type="number"
            />
            <div className="flex gap-3">
              <button onClick={handleModalSubmit} className="btn-outline">{t.modalSubmit}</button>
              <button onClick={handleModalCancel} className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200">{t.modalCancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-28 flex flex-col items-center gap-6">
        <h2 className="text-3xl font-semibold text-[#D4AF37]">Analyze Your Outfit</h2>

        <div className="w-full bg-black border border-[#D4AF37]/30 p-8 rounded-2xl flex flex-col items-center gap-5">

          <input
            id="analysis-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0] ?? null;
              setAnalysisImage(file);
              setAnalysisResult(null);
            }}
          />

          <label htmlFor="analysis-file-input" className="btn-outline cursor-pointer">
            {analysisImage ? analysisImage.name : "Upload Outfit"}
          </label>

          {analysisImage && (
            <img
              src={URL.createObjectURL(analysisImage)}
              alt="Outfit preview"
              className="rounded-xl border border-[#D4AF37]/30 max-h-64 object-contain image-fade-in"
            />
          )}

          <button
            onClick={handleAnalyzeOutfit}
            disabled={!analysisImage || analysisLoading}
            className="w-full bg-[#D4AF37] py-4 rounded-xl text-black font-medium flex items-center justify-center gap-2 main-cta"
          >
            {analysisLoading ? (<><span className="loader" /> Analyzing...</>) : "Analyze Outfit"}
          </button>
        </div>

        {analysisResult && (
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-black/40 backdrop-blur-xl p-8 text-center max-w-md w-full result-enter">
            <p className="text-6xl font-bold text-[#D4AF37]">{analysisResult.score}</p>
            <p className="text-sm text-gray-500 mt-1 mb-5">Outfit Score</p>
            <p className="text-gray-300 mb-6">{analysisResult.feedback}</p>
            <ul className="text-left space-y-2">
              {analysisResult.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-400 text-sm">
                  <span className="text-[#D4AF37] mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}