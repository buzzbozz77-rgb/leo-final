"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/app/lib/supabase'
/**
 * This page lives at /auth/callback
 * Supabase redirects here after Google / Apple OAuth.
 * It exchanges the code for a session then sends the user to /ai-stylist.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      // exchangeCodeForSession picks up the ?code= param automatically
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href,
      );

      if (error) {
        console.error("OAuth callback error:", error.message);
        router.replace("/?auth_error=true");
        return;
      }

      // Check if this user already has a display_name / username set
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        // New OAuth user — no username yet → let them pick one
        if (!profile?.display_name) {
          router.replace("/?pick_username=true");
          return;
        }
      }

      router.replace("/ai-stylist");
    };

    handle();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100svh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Spinner */}
      <span
        style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(212,175,55,0.2)",
          borderTop: "3px solid #D4AF37",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "rgba(212,175,55,0.7)", fontSize: "13px", letterSpacing: "0.15em" }}>
        Entering LEO…
      </p>
    </main>
  );
}
