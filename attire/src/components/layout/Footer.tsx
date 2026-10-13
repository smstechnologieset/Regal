"use client";

/**
 * Footer Component
 * 
 * Rebranded with organic luxury styling, warm earth tones,
 * bilingual localization (English / Amharic), and restructured pillars.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import NewsletterForm from "./NewsletterForm";
import { useLanguage } from "@/context/LanguageContext";

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export default function Footer() {
  const { t, isAmharic } = useLanguage();
  const currentYear = new Date().getFullYear();

  const columns = {
    pillars: [
      { label: t.footer.pillarAttire, href: "/attire" },
      { label: t.footer.pillarFood, href: "/catering" },
      { label: t.footer.pillarKids, href: "/attire/products?category=toys" },
      { label: t.footer.pillarSkincare, href: "/attire/products?category=skincare" },
      { label: t.footer.pillarGifts, href: "/gifts" },
    ],
    philosophy: [
      { label: t.footer.linkStory, href: "/about" },
      { label: t.footer.linkPurity, href: "/about#purity" },
      { label: t.footer.linkIngredients, href: "/about#ingredients" },
      { label: t.footer.linkTextile, href: "/about#fabrics" },
    ],
    support: [
      { label: t.footer.linkCustomerCare, href: "/contact" },
      { label: t.footer.linkShipping, href: "/contact#shipping" },
      { label: t.footer.linkSizing, href: "/contact#sizing" },
      { label: t.footer.linkFaq, href: "/contact#faq" },
      { label: t.footer.linkContact, href: "/contact" },
    ],
  };

  return (
    <footer className="bg-[#2B2D2F] text-[#FDFBF7]">
      {/* Newsletter & Direct Contact Banner */}
      <div className="bg-[#4A5D4E] border-b border-[#C5A059]/20 text-[#FDFBF7]">
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[#C5A059] text-xs font-semibold uppercase tracking-widest block mb-2 font-sans">
              {isAmharic ? "ሬጋል ማህበረሰብ" : "Regal Community"}
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 tracking-tight">
              {t.newsletter.headline}
            </h3>
            <p className="text-[#FDFBF7]/85 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed font-sans">
              {t.newsletter.subheadline}
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Main Footer Navigation Content */}
      <div className="container mx-auto px-4 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand & Mission Statement (Span 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="p-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm group-hover:scale-105 transition-transform">
                <Image
                  src="/Logo-bg.png"
                  alt="Regal Logo"
                  width={100}
                  height={100}
                  className="h-14 w-auto object-contain filter drop-shadow-sm"
                />
              </div>
              <div>
                <span className="text-2xl font-serif font-extrabold tracking-wider text-[#FDFBF7] block">
                  REGAL
                </span>
                <span className="text-[11px] tracking-widest text-[#C5A059] font-medium block">
                  {t.hero.headline}
                </span>
              </div>
            </Link>
            <p className="text-[#FDFBF7]/70 text-sm mb-6 leading-relaxed max-w-md font-sans">
              {t.footer.tagline}
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[#C5A059] hover:text-[#FDFBF7] hover:bg-[#4A5D4E] hover:border-[#4A5D4E] transition-all flex items-center justify-center"
                  aria-label={social.label}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 1: Our Pillars */}
          <div>
            <h4 className="font-serif font-bold text-base sm:text-lg mb-4 text-[#C5A059] tracking-wide">
              {t.footer.colPillars}
            </h4>
            <ul className="space-y-2.5">
              {columns.pillars.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#FDFBF7]/70 hover:text-[#C5A059] text-sm transition-colors block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Philosophy & Quality */}
          <div>
            <h4 className="font-serif font-bold text-base sm:text-lg mb-4 text-[#C5A059] tracking-wide">
              {t.footer.colPhilosophy}
            </h4>
            <ul className="space-y-2.5">
              {columns.philosophy.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#FDFBF7]/70 hover:text-[#C5A059] text-sm transition-colors block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support & Care */}
          <div>
            <h4 className="font-serif font-bold text-base sm:text-lg mb-4 text-[#C5A059] tracking-wide">
              {t.footer.colSupport}
            </h4>
            <ul className="space-y-2.5">
              {columns.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#FDFBF7]/70 hover:text-[#C5A059] text-sm transition-colors block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-[#242628]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-[#FDFBF7]/60">
            <p suppressHydrationWarning>
              © {currentYear} Regal. {t.footer.rightsReserved}
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[#C5A059] transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-[#C5A059] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/about#purity" className="hover:text-[#C5A059] transition-colors">
                Purity Guarantee
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
