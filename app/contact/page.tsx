"use client";

import { motion } from "framer-motion";

export default function Contact() {
  return (
    <section className="relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0c0c0c] to-black opacity-95" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative max-w-3xl mx-auto px-6 py-36"
      >

        {/* Title */}
        <h1 className="text-5xl font-light tracking-wide text-[#D4AF37] mb-6">
          Contact LEO
        </h1>

        {/* Divider */}
        <div className="w-20 h-[1px] bg-[#D4AF37] mb-10 opacity-70" />

        {/* Investors Badge */}
        <div className="inline-block border border-[#D4AF37] px-4 py-1 text-sm text-[#D4AF37] mb-10">
          Investors & Serious Partnerships Only
        </div>

        {/* Executive Message */}
        <p className="text-gray-300 text-lg leading-[1.9] mb-16 max-w-3xl">
          This channel is reserved exclusively for investors, strategic partners,
          and individuals seeking serious, long-term collaboration with LEO.
          If your intent is aligned with growth, precision, and real execution —
          you are in the right place.
        </p>

        {/* Contact Info */}
        <div className="space-y-4 text-gray-300 text-lg mb-20">
          <p>
            <span className="text-[#D4AF37]">Email:</span>{" "}
            Info@leoaifashion.com
          </p>

          <p>
            <span className="text-[#D4AF37]">Location:</span>{" "}
            Jordan – Amman – Alwaha Circle – Building 153 – 3rd Floor – Office 15
          </p>
        </div>

        {/* Contact Form */}
        <form
          action="mailto:Info@leoaifashion.com"
          method="POST"
          encType="text/plain"
          className="space-y-6 mb-20"
        >
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            required
            className="w-full bg-transparent border border-white/20 px-4 py-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
          />

          <input
            type="email"
            name="email"
            placeholder="Your Email"
            required
            className="w-full bg-transparent border border-white/20 px-4 py-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
          />

          <textarea
            name="message"
            placeholder="Your Message (Serious inquiries only)"
            rows={4}
            required
            className="w-full bg-transparent border border-white/20 px-4 py-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
          />

          <button
            type="submit"
            className="mt-4 inline-block border border-[#D4AF37] px-8 py-3 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition"
          >
            Send Serious Inquiry
          </button>
        </form>

        {/* Final CTA */}
        <div className="border-t border-white/10 pt-12 mt-24">
          <p className="text-gray-400 text-sm mb-4">
            This contact form is not intended for general inquiries or casual messages.
          </p>

          <p className="text-gray-300 text-lg mb-6">
            If you are an investor or a professional seeking meaningful,
            high-level collaboration — we welcome your message.
          </p>

          <a
            href="mailto:Info@leoaifashion.com"
            className="inline-block text-lg text-[#D4AF37] border border-[#D4AF37] px-8 py-3 hover:bg-[#D4AF37] hover:text-black transition"
          >
            Start a Serious Conversation
          </a>
        </div>

      </motion.div>
    </section>
  );
}