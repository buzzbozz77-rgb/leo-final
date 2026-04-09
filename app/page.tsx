"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import UsernamePickerModal from "./UsernamePickerModal";

type Tier = "low" | "mid" | "high";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; size: number; depth: number;
}

const store = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

const createParticles = (n: number, w: number, h: number): Particle[] =>
  Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    life: Math.random() * 1000, depth: Math.random(),
    size: Math.random() * 2 + 0.4,
  }));

const DUST_CSS = `
@keyframes leoDustFall {
  0%   { transform: translateY(-10px) translateX(0px); opacity: 0; }
  10%  { opacity: var(--p-opacity); }
  90%  { opacity: var(--p-opacity); }
  100% { transform: translateY(100vh) translateX(var(--p-drift)); opacity: 0; }
}
.leo-dust-particle {
  position: absolute;
  border-radius: 50%;
  background: #D4AF37;
  box-shadow: 0 0 6px 2px rgba(212,175,55,0.55);
  animation: leoDustFall var(--p-dur) var(--p-delay) linear infinite;
  pointer-events: none;
  will-change: transform, opacity;
}
`;

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);

  const [tier, setTier] = useState<Tier>("high");
  const [entering, setEntering] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUsernamePicker, setShowUsernamePicker] = useState(false);
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  useEffect(() => {
    router.prefetch("/ai-stylist");
    const cores = navigator.hardwareConcurrency ?? 2;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    if (cores <= 4 || mem <= 4) setTier("low");
    else if (cores <= 8) setTier("mid");
    else setTier("high");
    store("leo_start", Date.now().toString());
    const end = () => store("leo_end", Date.now().toString());
    window.addEventListener("beforeunload", end);
    return () => window.removeEventListener("beforeunload", end);
  }, [router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true, willReadFrequently: false });
    if (!ctx) return;
    let w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0, visible = !document.hidden;
    const COUNT: Record<Tier, number> = { low: 60, mid: 140, high: 260 };
    let particles: Particle[] = [];
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(COUNT[tier], w, h);
    };
    resize();
    let mx = w / 2, my = h / 2;
    const pointer = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const vis = () => { visible = !document.hidden; if (visible) loop(); };
    let last = performance.now();
    const loop = () => {
      if (!visible) return;
      const now = performance.now(), dt = now - last, fps = 1000 / dt;
      last = now;
      if (fps < 28 && particles.length > 50) particles.length = Math.floor(particles.length * 0.92);
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.life += dt; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const parallaxX = (mx - w / 2) * 0.0012 * p.depth;
        const parallaxY = (my - h / 2) * 0.0012 * p.depth;
        const dist = Math.hypot(mx - p.x, my - p.y);
        const glow = Math.max(0, 1 - dist / 240);
        const alpha = 0.1 + glow * 0.9;
        const pulse = Math.sin(p.life * 0.002) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(p.x + parallaxX, p.y + parallaxY, p.size + glow * 2.5 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${alpha})`;
        ctx.shadowColor = `rgba(212,175,55,${alpha})`;
        ctx.shadowBlur = glow * 35;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      frame = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", pointer, { passive: true });
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", pointer);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [tier]);

  useEffect(() => {
    let ticking = false, lastX = 0, lastY = 0;
    const move = (e: MouseEvent) => {
      lastX = e.clientX; lastY = e.clientY;
      if (!ticking) {
        requestAnimationFrame(() => {
          const el = wrapRef.current;
          if (!el) return;
          const x = (lastX / window.innerWidth - 0.5) * 28;
          const y = (lastY / window.innerHeight - 0.5) * 28;
          el.style.transform = `rotateX(${-y}deg) rotateY(${x}deg) translateZ(0)`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    if (!document.getElementById("leo-dust-style")) {
      const style = document.createElement("style");
      style.id = "leo-dust-style";
      style.textContent = DUST_CSS;
      document.head.appendChild(style);
    }
    const container = document.getElementById("leo-dust-particles");
    if (!container) return;
    const COUNT = 35;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement("div");
      el.className = "leo-dust-particle";
      const size  = (Math.random() * 2 + 1).toFixed(1);
      const left  = (Math.random() * 100).toFixed(2);
      const dur   = (Math.random() * 6 + 6).toFixed(2) + "s";
      const delay = (Math.random() * 10).toFixed(2) + "s";
      const opac  = (Math.random() * 0.35 + 0.15).toFixed(2);
      const drift = ((Math.random() - 0.5) * 60).toFixed(1) + "px";
      el.style.cssText = [
        `width:${size}px`, `height:${size}px`, `left:${left}%`, `top:-8px`,
        `--p-dur:${dur}`, `--p-delay:-${delay}`,
        `--p-opacity:${opac}`, `--p-drift:${drift}`,
      ].join(";");
      fragment.appendChild(el);
    }
    container.appendChild(fragment);
    return () => { while (container.firstChild) container.removeChild(container.firstChild); };
  }, []);

  const enterAsGuest = useCallback(() => {
    store("leo_guest", "true");
    store("leo_click", Date.now().toString());
    setEntering(true);
    setTimeout(() => router.push("/ai-stylist"), 1600);
  }, [router]);

  const goToStylist = useCallback(() => {
    store("leo_click", Date.now().toString());
    setEntering(true);
    setTimeout(() => router.push("/ai-stylist"), 1600);
  }, [router]);

  const enterLEO = useCallback(() => {
    if (loading) return;
    if (!user) { setShowAuth(true); return; }
    if (lockRef.current) return;
    lockRef.current = true;
    store("leo_click", Date.now().toString());
    setEntering(true);
    setTimeout(() => router.push("/ai-stylist"), 1600);
  }, [router, user, loading]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />

      <main
        className="relative bg-black flex flex-col items-center"
        style={{ minHeight: "100svh", zIndex: 1 }}
      >
        <div
          id="leo-dust-particles"
          style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none", overflow: "hidden" }}
        />

        {user && (
          <div style={{ position: "fixed", top: 20, right: 20, color: "lime", zIndex: 9999 }}>
            Logged in as: {user.email}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center w-full py-12">
          <div
            ref={wrapRef}
            className={`z-10 flex flex-col items-center transition-all duration-[1600ms] ${
              entering ? "scale-[2.5] opacity-0 blur-lg" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            <Image src="/logo.png" alt="LEO" width={210} height={210} priority />

            <h1 className="mt-8 text-7xl font-bold text-[#D4AF37] tracking-[0.45em]">LEO</h1>

            <p className="text-gray-400 mt-4 tracking-widest text-sm">
              Crafted by AI — Worn by Kings
            </p>

            <div className="mt-3 flex flex-col items-center gap-1">
              <p className="text-[#D4AF37]/60 text-xs tracking-[0.2em] font-light">
                AI That Understands Your Style — And Builds It
              </p>
              <p className="text-gray-600 text-[11px] tracking-widest">
                Analyze your outfit. Build your wardrobe.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 w-72">
              <button
                onClick={enterAsGuest}
                className="w-full px-8 py-4 rounded-full bg-[#D4AF37] text-black font-bold text-base hover:bg-[#E5C158] hover:scale-105 transition-all duration-300 active:scale-95 shadow-lg shadow-[#D4AF37]/20"
                aria-label="Try LEO Instantly"
              >
                Try LEO Instantly
              </button>
              <p className="text-gray-600 text-[11px] tracking-wide -mt-1">
                No account needed. Experience AI styling now.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="w-full px-8 py-4 rounded-full border border-[#D4AF37]/50 text-[#D4AF37] font-semibold text-sm hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-300"
                aria-label="Create Account"
              >
                Create Account
              </button>
              <p className="text-gray-600 text-xs mt-1">
                Already have an account?{" "}
                <button
                  onClick={enterLEO}
                  className="text-[#D4AF37]/70 hover:text-[#D4AF37] underline underline-offset-2 transition-colors duration-200"
                >
                  Enter LEO
                </button>
              </p>
            </div>
          </div>
        </div>

        <footer
          className="relative w-full flex justify-center items-center gap-4 text-xs text-neutral-600 py-5"
          style={{ zIndex: 10 }}
        >
          <span>© {new Date().getFullYear()} <span className="text-[#D4AF37]/60">LEO</span></span>
          <span className="opacity-40">•</span>
          <button
            onClick={() => setLegalModal("privacy")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#D4AF37", textDecoration: "underline", textUnderlineOffset: "2px", fontSize: "12px", padding: 0 }}
          >
            Privacy
          </button>
          <span className="opacity-40">•</span>
          <button
            onClick={() => setLegalModal("terms")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#D4AF37", textDecoration: "underline", textUnderlineOffset: "2px", fontSize: "12px", padding: 0 }}
          >
            Terms
          </button>
        </footer>

        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={async () => {
              setShowAuth(false);
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              if (currentUser) {
                const { data } = await supabase
                  .from("profiles").select("display_name")
                  .eq("id", currentUser.id).single();
                if (!data?.display_name) { setShowUsernamePicker(true); return; }
              }
              goToStylist();
            }}
            onGuest={() => { setShowAuth(false); enterAsGuest(); }}
          />
        )}

        {showUsernamePicker && (
          <UsernamePickerModal lang="ar" onDone={() => { setShowUsernamePicker(false); goToStylist(); }} />
        )}

        {legalModal && (
          <div
            onClick={() => setLegalModal(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: "relative", width: "100%", maxWidth: "420px", background: "#000", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "20px", padding: "32px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 0 60px rgba(212,175,55,0.15)" }}
            >
              <button onClick={() => setLegalModal(null)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#666", fontSize: "20px", cursor: "pointer", lineHeight: 1, padding: 0 }}>✕</button>

              {legalModal === "privacy" ? (
                <>
                  <h2 style={{ color: "#D4AF37", fontWeight: "700", fontSize: "20px", marginBottom: "20px", letterSpacing: "0.1em" }}>Privacy Policy</h2>
                  <div style={{ color: "#999", fontSize: "14px", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <p>LEO respects your privacy. We collect only the information necessary to provide our AI styling service.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Data We Collect:</span> When you create an account, we collect your email address, username, and optionally your phone number. Guest users are not required to provide any personal information.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>How We Use It:</span> Your data is used solely to personalize your experience, manage your account, and improve our service. We do not sell or share your personal information with third parties.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Data Security:</span> We use industry-standard security measures to protect your information. Your password is encrypted and never stored in plain text.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Your Rights:</span> You may request deletion of your account and associated data at any time by contacting us.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Cookies:</span> We use essential cookies to maintain your session and preferences. No third-party tracking cookies are used.</p>
                    <p style={{ color: "#555", fontSize: "12px", marginTop: "8px" }}>Last updated: {new Date().getFullYear()}</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ color: "#D4AF37", fontWeight: "700", fontSize: "20px", marginBottom: "20px", letterSpacing: "0.1em" }}>Terms of Service</h2>
                  <div style={{ color: "#999", fontSize: "14px", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <p>By using LEO, you agree to the following terms. Please read them carefully.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Use of Service:</span> LEO provides AI-powered fashion styling and wardrobe recommendations. The service is intended for personal, non-commercial use only.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Account Responsibility:</span> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Acceptable Use:</span> You agree not to misuse the service, attempt to reverse-engineer the AI, or use LEO for any unlawful purpose.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>AI Recommendations:</span> Styling suggestions provided by LEO are generated by artificial intelligence and are for inspiration purposes only. We make no guarantees regarding the accuracy or suitability of any recommendation.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Modifications:</span> We reserve the right to modify or discontinue the service at any time. Continued use of LEO after changes constitutes acceptance of the updated terms.</p>
                    <p><span style={{ color: "rgba(212,175,55,0.85)", fontWeight: "600" }}>Limitation of Liability:</span> LEO is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
                    <p style={{ color: "#555", fontSize: "12px", marginTop: "8px" }}>Last updated: {new Date().getFullYear()}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* ================= AUTH MODAL ================= */
function AuthModal({ onClose, onSuccess, onGuest }: {
  onClose: () => void; onSuccess: () => void; onGuest: () => void;
}) {
  const { signin, signup, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function resetErrors() { setError(""); setSuccessMsg(""); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) return;
    resetErrors(); setAuthLoading(true);
    try {
      await signin(identifier, password, keepLoggedIn);
      onSuccess();
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("email not confirmed")) setError("Please confirm your email first.");
      else if (msg.toLowerCase().includes("no account found")) setError(msg);
      else if (msg.toLowerCase().includes("invalid login credentials") || msg.toLowerCase().includes("invalid email or password")) setError("Wrong password. Please try again.");
      else setError(msg || "Something went wrong. Please try again.");
    } finally { setAuthLoading(false); }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); resetErrors();
    if (!signupEmail || !signupUsername || !signupPassword) return;
    if (signupPassword !== signupConfirm) { setError("Passwords don't match."); return; }
    if (signupPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (signupUsername.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (!/^[a-zA-Z0-9._]+$/.test(signupUsername)) { setError("Username can only contain letters, numbers, dots, and underscores."); return; }
    setAuthLoading(true);
    try {
      await signup(signupEmail, signupPassword, signupUsername, signupPhone || undefined);
      setSuccessMsg("Account created! Check your email to confirm before signing in.");
      setMode("login"); setSignupPassword(""); setSignupConfirm("");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally { setAuthLoading(false); }
  }

  async function handleGoogle() {
    resetErrors();
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
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
          <p className="text-gray-500 text-xs mt-1 tracking-widest">{mode === "login" ? "Welcome back" : "Join LEO"}</p>
        </div>

        {/* ── Google Button Only ── */}
        <div className="flex flex-col gap-2 mb-5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] text-white text-sm font-medium hover:border-[#D4AF37]/50 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
              </svg>
            )}
            Continue with Google
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#D4AF37]/10" />
          <span className="text-gray-600 text-xs">or</span>
          <div className="flex-1 h-px bg-[#D4AF37]/10" />
        </div>

        <div className="flex bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-xl p-1 mb-5">
          {(["login", "signup"] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); resetErrors(); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-gray-500 hover:text-gray-300"}`}>
              {m === "login" ? "Enter LEO" : "Sign Up"}
            </button>
          ))}
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs text-center leading-relaxed">{successMsg}</div>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                placeholder="Email, username, or phone" required autoComplete="username"
                className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
              {identifier.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#D4AF37]/50">
                  {identifier.includes("@") ? "email" : /^[+\d][\d\s\-]{5,}$/.test(identifier) ? "phone" : "username"}
                </span>
              )}
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" required
              className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setKeepLoggedIn(v => !v)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${keepLoggedIn ? "bg-[#D4AF37] border-[#D4AF37]" : "border-[#D4AF37]/40"}`}>
                {keepLoggedIn && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className="text-gray-400 text-xs">Keep me logged in</span>
            </label>
            {error && <p className="text-red-400 text-xs text-center leading-relaxed">{error}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-xl hover:bg-[#E5C158] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {authLoading && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
              Enter LEO
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-3">
            <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
              placeholder="Email *" required
              className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">@</span>
              <input type="text" value={signupUsername}
                onChange={e => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                placeholder="Choose your @username *" required maxLength={30}
                className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl pl-8 pr-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
            </div>
            <p className="text-gray-600 text-[11px] px-1 -mt-1">This will be your public identity</p>
            <input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)}
              placeholder="Phone number (optional)  e.g. +962..."
              className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
            <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)}
              placeholder="Password * (min 8 chars)" required
              className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
            <input type="password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)}
              placeholder="Confirm password *" required
              className="w-full bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#D4AF37] transition-colors" />
            {error && <p className="text-red-400 text-xs text-center leading-relaxed">{error}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-xl hover:bg-[#E5C158] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {authLoading && <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
              Create Account
            </button>
          </form>
        )}

        <div className="mt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#D4AF37]/10" />
            <span className="text-gray-600 text-xs">or</span>
            <div className="flex-1 h-px bg-[#D4AF37]/10" />
          </div>
          <button type="button" onClick={onGuest}
            className="w-full border border-[#D4AF37]/20 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 py-3 rounded-xl text-sm transition-all">
            👁️ Try LEO Instantly
          </button>
          <p className="text-gray-600 text-xs text-center mt-2">No account needed. Experience AI styling now.</p>
        </div>
      </div>
    </div>
  );
}