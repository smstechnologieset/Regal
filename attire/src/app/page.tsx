"use client";

/**
 * Regal Main Landing Page
 *
 * Rebranded with organic luxury styling, warm earth tones (Warm Linen, Olive Sage, Muted Gold),
 * bilingual localization (English / Amharic), and the Five Pillars of Regal.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Droplets,
  Leaf,
  Smile,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Star,
  Heart,
  Users,
  Compass,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export default function RegalLandingPage() {
  const { t, isAmharic } = useLanguage();

  // The Five Pillars of Regal
  const pillars = [
    {
      id: "attire",
      title: t.pillars.pillar1Title,
      description: t.pillars.pillar1Desc,
      icon: Sparkles,
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop",
      href: "/attire",
      badge: isAmharic ? "አለባበስ" : "Attire",
    },
    {
      id: "skincare",
      title: t.pillars.pillar2Title,
      description: t.pillars.pillar2Desc,
      icon: Droplets,
      image:
        "https://images.unsplash.com/photo-1608248597359-52822a6136a6?w=800&h=600&fit=crop",
      href: "/attire/products?category=skincare",
      badge: isAmharic ? "ቆዳ እንክብካቤ" : "Skincare",
    },
    {
      id: "catering",
      title: t.pillars.pillar3Title,
      description: t.pillars.pillar3Desc,
      icon: Leaf,
      image:
        "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop",
      href: "/catering",
      badge: isAmharic ? "ምግብ ዝግጅት" : "Catering",
    },
    {
      id: "toys",
      title: t.pillars.pillar4Title,
      description: t.pillars.pillar4Desc,
      icon: Smile,
      image:
        "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=600&fit=crop",
      href: "/attire/products?category=toys",
      badge: isAmharic ? "አሻንጉሊቶች" : "Childhood",
    },
    {
      id: "gifts",
      title: t.pillars.pillar5Title,
      description: t.pillars.pillar5Desc,
      icon: BookOpen,
      image:
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop",
      href: "/gifts",
      badge: isAmharic ? "ስጦታ እና ማስታወሻ" : "Journals & Gifts",
    },
  ];

  // Stats
  const stats = [
    {
      icon: ShieldCheck,
      value: "100%",
      label: isAmharic ? "ከተጨማሪ ነፃ እና ንጹህ" : "Pure & Additive-Free",
    },
    {
      icon: Compass,
      value: "5",
      label: isAmharic ? "መሰረታዊ ምሰሶዎች" : "Core Living Pillars",
    },
    {
      icon: Users,
      value: "1,000+",
      label: isAmharic ? "የታመኑ ቤተሰቦች" : "Families Welcomed",
    },
    {
      icon: Heart,
      value: "100%",
      label: isAmharic ? "ክብር እና ጥራት" : "Dignity & Integrity",
    },
  ];

  // Checkmark bullets
  const bullets = [
    {
      title: t.difference.bullet1Title,
      description: t.difference.bullet1Desc,
    },
    {
      title: t.difference.bullet2Title,
      description: t.difference.bullet2Desc,
    },
    {
      title: t.difference.bullet3Title,
      description: t.difference.bullet3Desc,
    },
    {
      title: t.difference.bullet4Title,
      description: t.difference.bullet4Desc,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2B2D2F]">
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F4EFEA] via-[#FDFBF7] to-[#FDFBF7] pt-28 pb-20">
        {/* Subtle Organic Background Accents */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(74,93,78,0.08),_transparent_70%)] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-[#4A5D4E]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 text-[#4A5D4E] text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in shadow-xs">
              <Leaf size={16} className="text-[#4A5D4E]" />
              <span>{t.hero.topBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-[#2B2D2F] tracking-tight leading-[1.12] mb-4 animate-fade-in-up">
              {t.hero.headline}
            </h1>

            {/* Sub-Tagline in Alternate Language for Rich Cultural Elegance */}
            <p className="text-lg sm:text-2xl font-serif text-[#C5A059] font-medium tracking-wide mb-8 animate-fade-in-up">
              {t.hero.amharicTagline}
            </p>

            {/* Mission Subheadline */}
            <p
              className="text-base sm:text-xl text-[#4A5D4E]/90 max-w-2xl mx-auto leading-relaxed mb-10 font-sans animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              {t.hero.subheadline}
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link href="/attire">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight size={18} />}
                  className="px-8 py-3.5 shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  {t.hero.primaryCta}
                </Button>
              </Link>
              <Link href="/about#purity">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-3.5 border-[#4A5D4E]/30 text-[#4A5D4E] hover:bg-[#4A5D4E] hover:text-[#FDFBF7] transition-all"
                >
                  {t.hero.secondaryCta}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-60">
          <div className="w-5 h-9 border-2 border-[#4A5D4E]/40 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-[#4A5D4E] rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* The Five Pillars Section */}
      <section id="services" className="py-24 md:py-32 bg-[#FDFBF7]">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#C5A059] font-semibold text-xs sm:text-sm uppercase tracking-widest block mb-2 font-sans">
              {t.pillars.tagline}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#2B2D2F] mt-2 mb-5 leading-tight">
              {t.pillars.headline}
            </h2>
            <div className="w-16 h-0.5 bg-[#C5A059] mx-auto mb-6" />
            <p className="text-base sm:text-lg text-[#2B2D2F]/75 leading-relaxed font-sans">
              {t.pillars.subheadline}
            </p>
          </div>

          {/* Pillars Responsive Grid (3 on top row, 2 centered on bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isWideBottom = idx >= 3;
              return (
                <Link
                  key={pillar.id}
                  href={pillar.href}
                  className={`group relative overflow-hidden rounded-2xl border border-[#E0D6C8] bg-white shadow-xs hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col ${
                    isWideBottom && idx === 3 ? "lg:col-span-1 lg:col-start-1" : ""
                  } ${isWideBottom && idx === 4 ? "lg:col-span-1" : ""}`}
                >
                  {/* Image Container with Natural Toned Gradient */}
                  <div className="aspect-[16/11] relative overflow-hidden bg-[#F4EFEA]">
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B2D2F]/80 via-[#2B2D2F]/30 to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />

                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-[#FDFBF7]/90 text-[#4A5D4E] text-xs font-semibold backdrop-blur-md shadow-xs">
                        {pillar.badge}
                      </span>
                    </div>

                    {/* Pillar Icon inside Image */}
                    <div className="absolute bottom-4 left-4 w-11 h-11 rounded-xl bg-[#FDFBF7]/90 backdrop-blur-md flex items-center justify-center text-[#4A5D4E] shadow-xs group-hover:scale-110 transition-transform">
                      <Icon size={20} />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2B2D2F] mb-2.5 group-hover:text-[#4A5D4E] transition-colors">
                        {pillar.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#2B2D2F]/70 leading-relaxed font-sans mb-6">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-[#4A5D4E] group-hover:text-[#C5A059] transition-colors pt-2 border-t border-[#F4EFEA]">
                      <span>{t.common.exploreNow}</span>
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-1.5"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#F4EFEA] border-y border-[#E0D6C8]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#4A5D4E]/10 text-[#4A5D4E] flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <div className="text-3xl md:text-4xl font-serif font-bold text-[#2B2D2F] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4A5D4E] font-medium font-sans">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The Regal Difference Section */}
      <section className="py-24 md:py-32 bg-[#FDFBF7]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Atmospheric Image with Reviews Floating Card */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden relative shadow-lg border border-[#E0D6C8]">
                <Image
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1000&fit=crop"
                  alt="Pure and dignified lifestyle"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2D2F]/40 to-transparent" />
              </div>

              {/* Floating Reviews Card */}
              <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-[#FDFBF7] rounded-xl shadow-xl p-5 sm:p-6 max-w-xs border border-[#E0D6C8] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-[#C5A059] fill-[#C5A059]"
                    />
                  ))}
                  <span className="text-xs font-bold text-[#2B2D2F] ml-1">5.0</span>
                </div>
                <div className="font-serif font-bold text-[#2B2D2F] text-sm sm:text-base leading-snug">
                  {t.difference.reviewsTitle}
                </div>
                <div className="text-xs text-[#2B2D2F]/70 mt-1 leading-relaxed">
                  {t.difference.reviewsSub}
                </div>
              </div>
            </div>

            {/* Right Column: Mission Narrative & 4 Purity Bullets */}
            <div>
              <span className="text-[#C5A059] font-semibold text-xs sm:text-sm uppercase tracking-widest block mb-2">
                {t.difference.tagline}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#2B2D2F] mt-2 mb-5 leading-tight">
                {t.difference.headline}
              </h2>
              <div className="w-16 h-0.5 bg-[#C5A059] mb-6" />
              <p className="text-base sm:text-lg text-[#2B2D2F]/80 mb-8 leading-relaxed font-sans">
                {t.difference.narrative}
              </p>

              {/* 4 Checkmark Bullets */}
              <div className="space-y-4">
                {bullets.map((bullet, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white border border-[#E0D6C8]/60 shadow-2xs hover:border-[#4A5D4E]/40 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#4A5D4E]/10 text-[#4A5D4E] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2B2D2F]">
                        {bullet.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#2B2D2F]/70 mt-0.5 leading-relaxed">
                        {bullet.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/attire">
                  <Button
                    size="lg"
                    variant="primary"
                    rightIcon={<ArrowRight size={18} />}
                    className="px-8 shadow-md"
                  >
                    {t.difference.button}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pure Living Call to Action Banner */}
      <section className="py-24 bg-[#4A5D4E] text-[#FDFBF7] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(197,160,89,0.15),_transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
          <span className="text-[#C5A059] font-medium text-xs sm:text-sm uppercase tracking-widest block mb-3">
            {isAmharic ? "ሬጋል አኗኗር" : "The Regal Standard"}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight leading-tight">
            {t.cta.headline}
          </h2>
          <p className="text-base sm:text-xl text-[#FDFBF7]/85 mb-10 leading-relaxed font-sans">
            {t.cta.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/attire">
              <Button
                size="lg"
                variant="secondary"
                rightIcon={<ArrowRight size={18} />}
                className="px-9 py-3.5 shadow-md"
              >
                {t.cta.button}
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3.5 border-[#FDFBF7]/40 text-[#FDFBF7] hover:bg-[#FDFBF7] hover:text-[#4A5D4E]"
              >
                {t.nav.about}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
