"use client";

import { ReactNode } from "react";
import { LanguageProvider } from "./context/LanguageContext";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}