'use client';

/**
 * ServiceDisabledCard Component
 *
 * Rendered when a visitor accesses a service route that is currently disabled in the Admin Dashboard.
 * Designed with regal luxury aesthetics (Warm Linen, Olive Sage, Muted Gold),
 * explaining that new collections are being curated, and providing clear buttons back to active stores.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sparkles, ShoppingBag, Droplets, Smile, BookOpen, Compass } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useServices } from '@/context/ServicesContext';

interface ServiceDisabledCardProps {
  serviceId: string;
  serviceName?: string;
}

export default function ServiceDisabledCard({ serviceId, serviceName }: ServiceDisabledCardProps) {
  const { isAmharic } = useLanguage();
  const { activeServices } = useServices();

  const storeServices = activeServices.filter((s) => s.isStore || s.id === 'attire');

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-[#F4EFEA] via-[#F9F8F6] to-[#F9F8F6] px-4 py-16">
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-md border border-[#D4AF37]/25 rounded-3xl p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#1E3A8A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Regal Emblem */}
        <div className="mx-auto w-20 h-20 relative mb-6">
          <Image
            src="/Logo-bg.png"
            alt="Regal Crest"
            width={80}
            height={80}
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold tracking-wider uppercase mb-5">
          <Sparkles size={14} className="text-[#D4AF37]" />
          <span>{isAmharic ? 'ወቅታዊ እረፍት / በመዘጋጀት ላይ' : 'Curating New Offerings'}</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#111827] mb-4 leading-tight">
          {serviceName ? (
            isAmharic ? (
              `${serviceName} በቅርቡ ይመለሳል`
            ) : (
              `${serviceName} is Returning Soon`
            )
          ) : isAmharic ? (
            'ይህ አገልግሎት በቅርቡ አዲስ ስብስብ ይዞ ይመለሳል'
          ) : (
            'This Service is Currently Preparing New Collections'
          )}
        </h1>

        {/* Manifesto / Explanation */}
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-8">
          {isAmharic
            ? 'በሬጋል የምናቀርበው እያንዳንዱ አገልግሎት ከፍተኛውን ክብር እና ጥራት እንዲጠብቅ እንሰራለን። ይህ አገልግሎት በአዲስ እና በተሻሻለ መልኩ እስኪመለስ ድረስ ሌሎች ንጹህ እና የተመረጡ ስብስቦቻችንን እንዲጎበኙ በአክብሮት እንጋብዛለን።'
            : 'At Regal, every offering is held to the highest standard of dignity and purity. While this collection is temporarily paused for curation, we warmly invite you to explore our active premier stores.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-[#F4F1EA] font-medium transition-all shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft size={16} />
            <span>{isAmharic ? 'ወደ መነሻ ገጽ ተመለስ' : 'Return to Home'}</span>
          </Link>
          <Link
            href="/attire"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-[#F9F8F6] border border-[#D4AF37]/40 text-[#111827] font-medium transition-all shadow-xs text-sm"
          >
            <ShoppingBag size={16} className="text-[#D4AF37]" />
            <span>{isAmharic ? 'የአልባሳት ስብስቦችን ይመልከቱ' : 'Explore Attire Collection'}</span>
          </Link>
        </div>

        {/* Active Collections Quick Links */}
        <div className="pt-6 border-t border-slate-200/70">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3.5">
            {isAmharic ? 'አሁን ክፍት የሆኑ የሬጋል አገልግሎቶች' : 'Currently Active Regal Services'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {storeServices.map((svc) => (
              <Link
                key={svc.id}
                href={svc.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F9F8F6] hover:bg-[#1E3A8A]/10 border border-slate-200/80 text-xs font-medium text-[#111827] transition-colors"
              >
                <span>{isAmharic ? svc.nameAm : svc.defaultName}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
