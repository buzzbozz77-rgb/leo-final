"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback, memo } from "react";

type Tier = "low" | "mid" | "high";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  depth: number;
}

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: number;
}

const store = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

const createParticles = (n: number, w: number, h: number): Particle[] =>
  Array.from({ length: n }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    life: Math.random() * 1000,
    depth: Math.random(),
    size: Math.random() * 2 + 0.4
  }));

export default function Page() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);

  const [tier, setTier] = useState<Tier>("high");
  const [entering, setEntering] = useState(false);

  /* DEVICE PROFILING - OPTIMIZED */
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

  /* GOD ENGINE - ENHANCED */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    });
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let visible = !document.hidden;

    const COUNT: Record<Tier, number> = {
      low: 60,
      mid: 140,
      high: 260
    };

    let particles: Particle[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(COUNT[tier], w, h);
    };

    resize();

    let mx = w / 2;
    let my = h / 2;

    const pointer = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const vis = () => {
      visible = !document.hidden;
      if (visible) loop();
    };

    let last = performance.now();

    const loop = () => {
      if (!visible) return;

      const now = performance.now();
      const dt = now - last;
      const fps = 1000 / dt;
      last = now;

      if (fps < 28 && particles.length > 50) {
        particles.length = Math.floor(particles.length * 0.92);
      }

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.life += dt;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const parallaxX = (mx - w / 2) * 0.0012 * p.depth;
        const parallaxY = (my - h / 2) * 0.0012 * p.depth;

        const dist = Math.hypot(mx - p.x, my - p.y);
        const glow = Math.max(0, 1 - dist / 240);
        const alpha = 0.1 + glow * 0.9;

        const pulse = Math.sin(p.life * 0.002) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(
          p.x + parallaxX,
          p.y + parallaxY,
          p.size + glow * 2.5 + pulse,
          0,
          Math.PI * 2
        );

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

  /* 3D CAMERA PARALLAX - THROTTLED */
  useEffect(() => {
    let ticking = false;
    let lastX = 0;
    let lastY = 0;

    const move = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

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

  /* ENTER - MEMOIZED */
  const enter = useCallback(() => {
    if (lockRef.current) return;
    lockRef.current = true;

    store("leo_click", Date.now().toString());
    setEntering(true);
    setTimeout(() => router.push("/ai-stylist"), 1600);
  }, [router]);

  return (
    <main className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div
        ref={wrapRef}
        className={`z-10 flex flex-col items-center transition-all duration-[1600ms] ${
          entering ? "scale-[2.5] opacity-0 blur-lg" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <Image src="/logo.png" alt="LEO" width={210} height={210} priority />

        <h1 className="mt-8 text-7xl font-bold text-[#D4AF37] tracking-[0.45em]">
          LEO
        </h1>

        <p className="text-gray-400 mt-4 tracking-widest text-sm">
          Crafted by AI — Worn by Kings
        </p>

        <button
          onClick={enter}
          className="mt-14 px-14 py-5 rounded-full bg-[#D4AF37] text-black font-semibold hover:scale-110 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Enter LEO AI Stylist"
        >
          Enter
        </button>
      </div>

      <LionAssistant />
    </main>
  );
}

/* ================= LION CHAT BOT - PRODUCTION READY ================= */
const LionAssistant = memo(function LionAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Welcome. I am LEO, your elite fashion consultant. Tell me what you want to wear.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = useCallback(async () => {
    if (!input.trim() || typing) return;

    const userMsg: Message = {
      role: "user",
      text: input.trim(),
      timestamp: Date.now()
    };

    setMessages(m => [...m, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || "I apologize, I couldn't generate a response.";

      setMessages(m => [
        ...m,
        {
          role: "bot",
          text: reply,
          timestamp: Date.now()
        }
      ]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages(m => [
        ...m,
        {
          role: "bot",
          text: "I'm experiencing technical difficulties. Please try again in a moment.",
          timestamp: Date.now()
        }
      ]);
    } finally {
      setTyping(false);
    }
  }, [input, typing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  const toggleChat = useCallback(() => {
    setOpen(o => !o);
  }, []);

  const sendQuickMessage = useCallback(
    (msg: string) => {
      setInput(msg);
      setTimeout(() => {
        if (inputRef.current) {
          const event = new KeyboardEvent("keydown", { key: "Enter" });
          inputRef.current.dispatchEvent(event);
        }
      }, 100);
    },
    []
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-4 w-80 sm:w-96 rounded-2xl border border-[#D4AF37]/40 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-[#D4AF37]/30 flex items-center justify-between bg-gradient-to-r from-[#D4AF37]/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center text-black font-bold shadow-lg">
                L
              </div>
              <div>
                <div className="text-[#D4AF37] text-sm font-semibold">LEO Assistant</div>
                <div className="text-gray-500 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="p-4 h-72 overflow-y-auto space-y-3 text-sm custom-scrollbar">
            {messages.map((m, i) => (
              <div
                key={`${m.timestamp}-${i}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    m.role === "bot"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                      : "bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-black font-medium"
                  } shadow-lg animate-message-in`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex border-t border-[#D4AF37]/20 bg-[#D4AF37]/5">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typing}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-white text-sm placeholder:text-gray-600 disabled:opacity-50 focus:ring-0"
              placeholder={typing ? "LEO is thinking..." : "Ask LEO anything..."}
              maxLength={200}
              aria-label="Chat message"
            />
            <button
              onClick={send}
              disabled={!input.trim() || typing}
              className="px-5 text-[#D4AF37] hover:scale-110 transition-transform disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none"
              aria-label="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          <div className="p-3 border-t border-[#D4AF37]/10 bg-black/50 flex gap-2 flex-wrap">
            {["Formal event", "Casual look", "Date night"].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => sendQuickMessage(suggestion)}
                disabled={typing}
                className="text-xs px-3 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div onClick={toggleChat} className="cursor-pointer group relative" role="button" tabIndex={0} aria-label="Toggle chat">
        <div className="relative w-20 h-20">
  <img
    src="/lion.png"
    alt="LEO Assistant"
    className="w-full h-full object-contain animate-float z-10 relative"
  />

  <div className="absolute inset-0 rounded-full bg-[#D4AF37] blur-2xl opacity-30 animate-pulse"></div>

  <div className="absolute inset-0 rounded-full border border-[#D4AF37]/60 animate-spin-slow"></div>
</div>

        <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37] animate-ping opacity-20"></div>

        <div className="absolute -top-12 right-0 text-xs bg-black border border-[#D4AF37]/40 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
          <span className="text-[#D4AF37] font-semibold">Ask LEO</span>
        </div>

        {!open && messages.length > 1 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center text-black text-xs font-bold shadow-lg animate-bounce">
            !
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-float {
          animation: float 3.5s ease-in-out infinite;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        .animate-fade-in {
          animation: fade 0.3s ease;
        }
        @keyframes fade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-message-in {
          animation: messageIn 0.2s ease;
        }
        @keyframes messageIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(212, 175, 55, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
          .animate-spin-slow {
 animation: spinSlow 8s linear infinite;
}

@keyframes spinSlow {
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
}
      `}</style>
    </div>
  );
});