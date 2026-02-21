"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { language, toggleLanguage } = useLanguage();
  const isAR = language === "ar";
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("leo_user");
    setUser(storedUser);
    setMounted(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem("leo_user");
    setUser(null);
    router.push("/");
  }

  function isActive(path: string) {
    return pathname === path;
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur border-b border-[#D4AF37]/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="LEO Logo"
            width={36}
            height={36}
            priority
          />
          <span className="text-[#D4AF37] font-semibold tracking-wide">
            LEO
          </span>
        </Link>

        {/* CENTER — AI STYLIST LINK */}
        <div className="hidden md:flex items-center text-sm">
          <Link
            href="/ai-stylist"
            className={`transition-colors duration-200 ${
              isActive("/ai-stylist")
                ? "text-[#D4AF37]"
                : "text-white/80 hover:text-[#D4AF37]"
            }`}
          >
            {isAR ? "المصمم الذكي" : "AI Stylist"}
          </Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">

          <button
            onClick={toggleLanguage}
            className="rounded-full border border-[#D4AF37]/40 px-4 py-1.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors duration-200"
          >
            {isAR ? "EN" : "AR"}
          </button>

          {mounted && user && (
            <button
              onClick={handleLogout}
              className="rounded-full border border-neutral-600 px-4 py-1.5 text-xs text-neutral-300 hover:border-red-500 hover:text-red-500 transition-colors duration-200"
            >
              {isAR ? "تسجيل الخروج" : "Logout"}
            </button>
          )}

          <Link
            href="/contact"
            className="rounded-full bg-[#D4AF37] px-5 py-2 text-sm text-black hover:bg-[#e6c75a] transition-colors duration-200"
          >
            {isAR ? "تواصل" : "Contact"}
          </Link>

        </div>
      </div>
    </nav>
  );
}