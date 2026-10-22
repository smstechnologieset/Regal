"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Calendar, ArrowRight, Heart, Scissors } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { useServices } from "@/context/ServicesContext";
import ServiceDisabledCard from "@/components/common/ServiceDisabledCard";

export default function BridalPage() {
  const { t, isAmharic } = useLanguage();
  const { isServiceEnabled } = useServices();

  if (!isServiceEnabled('bridal')) {
    return (
      <ServiceDisabledCard
        serviceId="bridal"
        serviceName={isAmharic ? "የሙሽራ አገልግሎቶች" : "Bridal Services"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1549488497-94b52bddac5d?q=80&w=870&auto=format&fit=crop"
          alt="Bridal Elegance"
          fill
          unoptimized
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C]/85 via-[#0B192C]/50 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-white animate-fade-in-up">
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-xs sm:text-sm mb-6 border border-white/30">
              {t.bridalPage.badge}
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 font-serif leading-tight">
              {t.bridalPage.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed font-light">
              {t.bridalPage.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/bridal/appointments">
                <Button size="lg" className="bg-[#1E3A8A] hover:bg-[#172554] text-white min-w-[180px]">
                  {t.bridalPage.bookAppointment}
                </Button>
              </Link>
              <Link href="/bridal/gallery">
                <Button
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm min-w-[180px]"
                >
                  {t.bridalPage.viewCollection}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-28 bg-[#F4EFEA] border-y border-[#E5DFD7]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4 font-serif">
              {t.bridalPage.servicesTitle}
            </h2>
            <p className="text-[#111827]/70 text-sm sm:text-base">
              {t.bridalPage.servicesSub}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Gowns */}
            <div className="group bg-white rounded-2xl p-8 shadow-xs hover:shadow-xl transition-all duration-300 border border-[#E5DFD7] flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center text-[#1E3A8A] mb-6 group-hover:scale-110 transition-transform">
                  <Heart size={32} />
                </div>
                <h3 className="text-xl font-bold font-serif text-[#111827] mb-3">
                  {t.bridalPage.gownsTitle}
                </h3>
                <p className="text-[#111827]/70 text-sm mb-6 leading-relaxed">
                  {t.bridalPage.gownsDesc}
                </p>
              </div>
              <Link
                href="/bridal/gallery"
                className="inline-flex items-center text-[#1E3A8A] font-semibold text-sm hover:gap-2 transition-all"
              >
                {t.bridalPage.viewCollection} <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            {/* Beauty */}
            <div className="group bg-white rounded-2xl p-8 shadow-xs hover:shadow-xl transition-all duration-300 border border-[#E5DFD7] flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center text-[#1E3A8A] mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-bold font-serif text-[#111827] mb-3">
                  {t.bridalPage.beautyTitle}
                </h3>
                <p className="text-[#111827]/70 text-sm mb-6 leading-relaxed">
                  {t.bridalPage.beautyDesc}
                </p>
              </div>
              <Link
                href="/bridal/appointments?type=beauty"
                className="inline-flex items-center text-[#1E3A8A] font-semibold text-sm hover:gap-2 transition-all"
              >
                {t.bridalPage.bookAppointment} <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            {/* Fittings */}
            <div className="group bg-white rounded-2xl p-8 shadow-xs hover:shadow-xl transition-all duration-300 border border-[#E5DFD7] flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center text-[#1E3A8A] mb-6 group-hover:scale-110 transition-transform">
                  <Scissors size={32} />
                </div>
                <h3 className="text-xl font-bold font-serif text-[#111827] mb-3">
                  {t.bridalPage.fittingsTitle}
                </h3>
                <p className="text-[#111827]/70 text-sm mb-6 leading-relaxed">
                  {t.bridalPage.fittingsDesc}
                </p>
              </div>
              <Link
                href="/bridal/appointments"
                className="inline-flex items-center text-[#1E3A8A] font-semibold text-sm hover:gap-2 transition-all"
              >
                {t.bridalPage.bookAppointment} <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            {/* Accessories */}
            <div className="group bg-white rounded-2xl p-8 shadow-xs hover:shadow-xl transition-all duration-300 border border-[#E5DFD7] flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center text-[#1E3A8A] mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-bold font-serif text-[#111827] mb-3">
                  {t.bridalPage.accessoriesTitle}
                </h3>
                <p className="text-[#111827]/70 text-sm mb-6 leading-relaxed">
                  {t.bridalPage.accessoriesDesc}
                </p>
              </div>
              <Link
                href="/bridal/accessories"
                className="inline-flex items-center text-[#1E3A8A] font-semibold text-sm hover:gap-2 transition-all"
              >
                {isAmharic ? "መለዋወጫዎችን ይመልከቱ" : "Browse Accessories"} <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Image Split */}
      <section className="py-24 bg-[#F9F8F6]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-[#E5DFD7]">
              <Image
                src="https://images.unsplash.com/photo-1584126467121-0db1e6bb47a7?q=80&w=870&auto=format&fit=crop"
                alt="Bridal Fitting"
                fill
                unoptimized
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-full text-xs font-semibold">
                <Calendar size={14} /> {isAmharic ? "ለ 2026 ቀጠሮዎችን እየተቀበልን ነው" : "Now Accepting 2026 Bookings"}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-serif text-[#111827] leading-tight">
                {t.bridalPage.experienceTitle}
              </h2>
              <p className="text-base sm:text-lg text-[#111827]/75 leading-relaxed font-light">
                {t.bridalPage.experienceDesc}
              </p>

              <ul className="space-y-3.5">
                {[
                  isAmharic ? "ልዩ የሆኑ የዲዛይነር ሰርግ ቀሚሶች ምርጫ" : "Exclusive access to modest designer collections",
                  isAmharic ? "ሙያዊ የልኬት እና የማስተካከል አገልግሎቶች" : "Professional alteration & custom fitting services",
                  isAmharic ? "ለሩቅ ደንበኞች በቪዲዮ የማማከር አገልግሎት" : "Virtual consultations for overseas & diaspora brides",
                  isAmharic ? "ከቤተሰብዎ ጋር በግል ሰፊ ክፍል ውስጥ የመምረጥ እድል" : "Private boutique appointments for bride and family",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm sm:text-base text-[#111827]/85"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link href="/bridal/appointments">
                  <Button size="lg" className="bg-[#1E3A8A] hover:bg-[#172554] text-white">
                    {t.bridalPage.bookAppointment}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
