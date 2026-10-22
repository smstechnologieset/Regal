"use client";

/**
 * About / Our Story Page
 *
 * Fully rewritten per client specification with bilingual localization (English / Amharic),
 * the founding narrative of motherhood and pure living, philosophy, the 5 pillars,
 * and the quality guarantees.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Droplets,
  Leaf,
  Smile,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Heart,
  Globe2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t, isAmharic } = useLanguage();

  const pillars = [
    {
      icon: Sparkles,
      title: t.pillars.pillar1Title,
      description: t.pillars.pillar1Desc,
      href: "/attire",
    },
    {
      icon: Leaf,
      title: t.pillars.pillar3Title,
      description: t.pillars.pillar3Desc,
      href: "/catering",
    },
    {
      icon: Droplets,
      title: t.pillars.pillar2Title,
      description: t.pillars.pillar2Desc,
      href: "/attire/products?category=skincare",
    },
    {
      icon: Smile,
      title: t.pillars.pillar4Title,
      description: t.pillars.pillar4Desc,
      href: "/attire/products?category=toys",
    },
    {
      icon: BookOpen,
      title: t.pillars.pillar5Title,
      description: t.pillars.pillar5Desc,
      href: "/gifts",
    },
  ];

  const guarantees = [
    {
      icon: ShieldCheck,
      title: t.about.g1Title,
      description: t.about.g1Desc,
    },
    {
      icon: Heart,
      title: t.about.g2Title,
      description: t.about.g2Desc,
    },
    {
      icon: Globe2,
      title: t.about.g3Title,
      description: t.about.g3Desc,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F8F6] text-[#111827]">
      {/* Hero Banner */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F4EFEA] to-[#F9F8F6] pt-24 pb-16 border-b border-[#E5DFD7]">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(30,58,138,0.06), transparent 70%)' }} />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <span className="text-[#D4AF37] font-semibold text-xs sm:text-sm uppercase tracking-widest block mb-3 font-sans">
            {t.about.heroTag}
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-[#111827] mb-6 leading-tight">
            {t.about.heroTitle}
          </h1>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mb-6" />
          <p className="text-base sm:text-xl text-[#1E3A8A] font-medium leading-relaxed font-sans">
            {t.about.storyP1}
          </p>
        </div>
      </section>

      {/* The Origin Journey Section */}
      <section className="py-20 md:py-28 bg-[#F9F8F6]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Story Imagery */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden relative shadow-lg border border-[#E5DFD7] bg-[#F4EFEA]">
                <Image
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1000&fit=crop"
                  alt="Regal Founding Story"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-[#0B192C] text-[#F4F1EA] p-6 rounded-2xl shadow-xl hidden sm:block border border-[#D4AF37]/30">
                <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                  {isAmharic ? "መሰረታዊ መርህ" : "Our Heritage"}
                </p>
                <p className="text-xl font-serif font-bold mt-1">
                  {isAmharic ? "እውነተኛ ክብር እና ንጽህና" : "Pure Living & Dignity"}
                </p>
              </div>
            </div>

            {/* Story Narrative */}
            <div className="lg:col-span-7 space-y-6 text-[#111827]/80 leading-relaxed font-sans text-base sm:text-lg">
              <p>{t.about.storyP2}</p>
              <p>{t.about.storyP3}</p>
              <div className="p-6 rounded-xl bg-[#F4EFEA] border-l-4 border-[#1E3A8A] italic font-serif text-[#111827] text-lg">
                &ldquo;{t.about.storyP4}&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 bg-[#F4EFEA] border-y border-[#E5DFD7]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <span className="text-[#D4AF37] font-semibold text-xs sm:text-sm uppercase tracking-widest block mb-2">
            {t.about.philosophyTag}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#111827] mt-2 mb-6">
            {t.about.philosophyTitle}
          </h2>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mb-8" />
          <div className="space-y-6 text-base sm:text-lg text-[#111827]/80 leading-relaxed font-sans max-w-3xl mx-auto">
            <p>{t.about.philosophyP1}</p>
            <p>{t.about.philosophyP2}</p>
          </div>
        </div>
      </section>

      {/* The Five Pillars in Detail */}
      <section className="py-20 md:py-28 bg-[#F9F8F6]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#D4AF37] font-semibold text-xs sm:text-sm uppercase tracking-widest block mb-2">
              {t.pillars.tagline}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#111827]">
              {t.pillars.headline}
            </h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4 mb-4" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <Link
                  key={idx}
                  href={pillar.href}
                  className="p-7 rounded-2xl bg-white border border-[#E5DFD7] shadow-2xs hover:shadow-lg hover:border-[#1E3A8A]/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] group-hover:bg-[#1E3A8A] group-hover:text-[#F4F1EA] transition-colors flex items-center justify-center mb-5">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-[#111827] mb-3 group-hover:text-[#1E3A8A] transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#111827]/70 leading-relaxed font-sans">
                      {pillar.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#F4EFEA] flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] group-hover:text-[#D4AF37] transition-colors">
                    <span>{t.common.exploreNow}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Guarantee Section (id="purity") */}
      <section id="purity" className="py-20 md:py-28 bg-[#0B192C] text-[#F4F1EA] relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#D4AF37] font-medium text-xs sm:text-sm uppercase tracking-widest block mb-2">
              {isAmharic ? "የማይናወጥ ቃል" : "Our Unwavering Promise"}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6">
              {t.about.guaranteeTitle}
            </h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mb-6" />
            <p className="text-base sm:text-lg text-[#F4F1EA]/85 leading-relaxed font-sans">
              {t.about.guaranteeSub}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {guarantees.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mx-auto mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-serif font-bold text-xl mb-3 text-[#F4F1EA]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#F4F1EA]/75 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/attire">
              <Button
                size="lg"
                variant="secondary"
                rightIcon={<ArrowRight size={18} />}
                className="px-8 shadow-md"
              >
                {t.about.ctaExplore}
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="px-8 border-[#F4F1EA]/40 text-[#F4F1EA] hover:bg-[#F4F1EA] hover:text-[#0B192C]"
              >
                {t.nav.contact}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
