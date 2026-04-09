"use client";

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function UsernamePickerModal({ lang, onDone }: {
  lang: string;
  onDone: (name: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (!data?.display_name) setVisible(true);
    }
    check();
  }, []);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.length < 2) {
      setError(lang === "ar" ? "الاسم قصير جداً" : "Name is too short");
      return;
    }
    if (trimmed.length > 20) {
      setError(lang === "ar" ? "الاسم طويل جداً (20 حرف max)" : "Name too long (20 chars max)");
      return;
    }
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ display_name: trimmed, username: trimmed })
        .eq("id", user.id);
    }
    setLoading(false);
    setVisible(false);
    onDone(trimmed);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#D4AF37]/30 rounded-t-3xl p-6 pb-10 animate-slide-up">
        <div className="text-center mb-6">
          <p className="text-2xl mb-2">✍️</p>
          <h2 className="text-lg font-bold text-[#D4AF37]">
            {lang === "ar" ? "شو اسمك؟" : "What's your name?"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {lang === "ar"
              ? "هيظهر في الترتيب العام — اختر اسماً مميزاً"
              : "This will appear on the leaderboard — pick something unique"}
          </p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setError(null); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder={lang === "ar" ? "مثال: StyleKing أو FashionPro..." : "e.g. StyleKing or FashionPro..."}
            maxLength={20}
            className="w-full bg-[#111] border border-[#D4AF37]/30 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-[#D4AF37] transition-all placeholder-gray-600"
            autoFocus
          />
          <div className="flex justify-between mt-1.5">
            {error
              ? <p className="text-xs text-red-400">{error}</p>
              : <span />
            }
            <p className="text-xs text-gray-600 mr-auto ml-0" style={{ direction: "ltr" }}>
              {value.trim().length}/20
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!value.trim() || loading}
          className="w-full bg-[#D4AF37] py-4 rounded-xl text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading
            ? (lang === "ar" ? "جاري الحفظ..." : "Saving...")
            : (lang === "ar" ? "تأكيد ✓" : "Confirm ✓")}
        </button>
      </div>
    </div>
  );
}
