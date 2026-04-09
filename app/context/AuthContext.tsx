"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signin: (identifier: string, password: string, keepLoggedIn?: boolean) => Promise<void>;
  signup: (email: string, password: string, username: string, phone?: string) => Promise<void>;
  signout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signin: async () => {},
  signup: async () => {},
  signout: async () => {},
  signInWithGoogle: async () => {},
});

function clearLeoStorage() {
  try {
    const keys = [
      "leo_academy_progress", "leo_academy_progress_v3", "leo_analysis_count",
      "leo_analysis_date", "leo_last_outfit", "leo_style_goal", "leo_image_count",
      "leo_style_history", "leo_wishlist", "leo_form", "leo_feedback", "leo_user_id",
    ];
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

function detectIdentifierType(identifier: string): "email" | "phone" | "username" {
  if (identifier.includes("@")) return "email";
  if (/^[+\d][\d\s\-()]{6,}$/.test(identifier)) return "phone";
  return "username";
}

async function resolveToEmail(identifier: string): Promise<string> {
  const type = detectIdentifierType(identifier);

  if (type === "email") return identifier.trim().toLowerCase();

  if (type === "phone") {
    const normalized = identifier.replace(/[\s\-()]/g, "");
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("phone", normalized)
      .single();
    if (error || !data?.email) throw new Error("No account found with this phone number.");
    return data.email;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", identifier.trim().toLowerCase())
    .single();
  if (error || !data?.email) throw new Error("No account found with this username.");
  return data.email;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", u.id)
          .single();

        if (!existing) {
          const emailPart = u.email?.split("@")[0] ?? "";
          const baseUsername = emailPart
            .toLowerCase()
            .replace(/[^a-z0-9._]/g, "")
            .slice(0, 28);
          const suffix = Math.floor(1000 + Math.random() * 9000);
          const username = `${baseUsername}${suffix}`;

          await supabase.from("profiles").upsert({
            id: u.id,
            email: u.email ?? "",
            username,
            display_name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? username,
            avatar_url: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
          });
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signin = async (identifier: string, password: string, keepLoggedIn = true) => {
    const email = await resolveToEmail(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    clearLeoStorage();

    if (!keepLoggedIn && data.session) {
      const key = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1].split(".")[0]}-auth-token`;
      try {
        const s = localStorage.getItem(key);
        if (s) { sessionStorage.setItem(key, s); localStorage.removeItem(key); }
      } catch {}
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
  };

  const signup = async (
    email: string,
    password: string,
    username: string,
    phone?: string,
  ) => {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim().toLowerCase())
      .single();

    if (existing) throw new Error("This username is already taken. Please choose another.");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const profilePayload: Record<string, string> = {
        id: data.user.id,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        display_name: username.trim(),
      };
      if (phone) profilePayload.phone = phone.replace(/[\s\-()]/g, "");
      await supabase.from("profiles").upsert(profilePayload);
    }
  };

  const signout = async () => {
    clearLeoStorage();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);