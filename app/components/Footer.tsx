import Link from "next/link";

export default function Footer() {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-[#D4AF37]/20 bg-black px-6 py-14"
    >
      <div className="mx-auto max-w-3xl text-center space-y-6">

        <p className="text-sm tracking-wide text-neutral-400">
          © {new Date().getFullYear()}{" "}
          <span className="text-[#D4AF37] font-medium">LEO</span>{" "}
          — Crafted by AI. Worn by Kings.
        </p>

        <p className="text-xs text-neutral-500 leading-relaxed opacity-80">
          An AI-powered platform shaping modern presence — for individuals and
          businesses who value intelligence, elegance, and precision.
        </p>

        <div className="flex justify-center items-center gap-4 text-xs text-neutral-500">

          <Link
            href="/privacy"
            className="hover:text-[#D4AF37] transition-colors"
          >
            Privacy
          </Link>

          <span aria-hidden="true" className="opacity-40">•</span>

          <Link
            href="/terms"
            className="hover:text-[#D4AF37] transition-colors"
          >
            Terms
          </Link>

        </div>
      </div>
    </footer>
  );
}