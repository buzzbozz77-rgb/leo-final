import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none" aria-label="LEO logo">
      <Image
        src="/logo.png"
        alt="LEO Logo"
        width={40}
        height={40}
        priority
      />

      <span className="text-[#D4AF37] font-semibold tracking-[0.3em]">
        LEO
      </span>
    </div>
  );
}