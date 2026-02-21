"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// safe initializer (runs once)
function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const saved = localStorage.getItem("leo_language");
  return saved === "ar" ? "ar" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (lang: SetStateAction<Language>) => {
        const resolved =
          typeof lang === "function" ? lang(language) : lang;

        setLanguage(resolved);

        if (typeof window !== "undefined") {
          localStorage.setItem("leo_language", resolved);
          document.documentElement.lang = resolved;
          document.documentElement.dir =
            resolved === "ar" ? "rtl" : "ltr";
        }
      },
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}