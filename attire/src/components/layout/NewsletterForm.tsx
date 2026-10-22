"use client";

/**
 * Newsletter subscription form & direct call option
 * Styled for luxury earth tones with bilingual support.
 */

import React, { useState } from "react";
import { Mail, Check, Loader2, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function NewsletterForm() {
  const { t, isAmharic } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(
          isAmharic
            ? "እናመሰግናለን! በሬጋል ቤተሰብ ውስጥ ተመዝግበዋል።"
            : "Thank you for joining the Regal Circle!"
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(
          data.error ||
            (isAmharic
              ? "ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።"
              : "Something went wrong. Please try again.")
        );
      }
    } catch {
      setStatus("error");
      setMessage(
        isAmharic
          ? "የግንኙነት ችግር። እባክዎ እንደገና ይሞክሩ።"
          : "Network error. Please try again."
      );
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder={t.newsletter.placeholder}
            suppressHydrationWarning
            className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm font-sans"
          />
          <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50" />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-7 py-3.5 bg-[#D4AF37] hover:bg-[#B4942E] disabled:opacity-60 text-[#111827] font-semibold rounded-xl transition-all shadow-sm hover:shadow inline-flex items-center justify-center gap-2 text-sm shrink-0"
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin text-[#111827]" />
          ) : status === "success" ? (
            <Check size={16} className="text-[#111827]" />
          ) : null}
          {t.newsletter.button}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm font-medium ${
            status === "success" ? "text-[#D4AF37]" : "text-rose-300"
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      {/* Direct Call Us Option */}
      <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-white/80">
        <span>{t.newsletter.callUsPrompt}</span>
        <a
          href="tel:+251912345678"
          className="inline-flex items-center gap-1.5 font-semibold text-[#D4AF37] hover:text-white transition-colors underline decoration-[#D4AF37]/50 hover:decoration-white"
        >
          <Phone size={13} className="shrink-0" />
          <span>{t.newsletter.callUsAction}</span>
        </a>
      </div>
    </div>
  );
}
