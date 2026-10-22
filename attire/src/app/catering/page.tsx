'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Utensils, Coffee, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

export default function CateringPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            {/* Hero */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop"
                    alt="Gourmet Catering"
                    fill
                    unoptimized
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-[#0B192C]/65" />
                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-xs sm:text-sm mb-6 border border-white/30">
                        {t.services.cateringTagline}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif">
                        {t.cateringPage.title}
                    </h1>
                    <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        {t.cateringPage.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/catering/menu">
                            <Button size="lg" className="bg-[#1E3A8A] hover:bg-[#172554] text-white min-w-[180px]">
                                {t.cateringPage.viewMenu}
                            </Button>
                        </Link>
                        <Link href="/catering/quote">
                            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 min-w-[180px]">
                                {t.cateringPage.getQuote}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 bg-[#F9F8F6]">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="text-center p-8 bg-white rounded-2xl border border-[#E5DFD7] shadow-xs hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center text-[#1E3A8A] mx-auto mb-6">
                                <ChefHat size={32} />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-[#111827] mb-3">
                                {t.cateringPage.feature1Title}
                            </h3>
                            <p className="text-[#111827]/70 text-sm leading-relaxed">
                                {t.cateringPage.feature1Desc}
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl border border-[#E5DFD7] shadow-xs hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center text-[#1E3A8A] mx-auto mb-6">
                                <Utensils size={32} />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-[#111827] mb-3">
                                {t.cateringPage.feature2Title}
                            </h3>
                            <p className="text-[#111827]/70 text-sm leading-relaxed">
                                {t.cateringPage.feature2Desc}
                            </p>
                        </div>
                        <div className="text-center p-8 bg-white rounded-2xl border border-[#E5DFD7] shadow-xs hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-[#1E3A8A]/10 rounded-full flex items-center justify-center text-[#1E3A8A] mx-auto mb-6">
                                <Coffee size={32} />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-[#111827] mb-3">
                                {t.cateringPage.feature3Title}
                            </h3>
                            <p className="text-[#111827]/70 text-sm leading-relaxed">
                                {t.cateringPage.feature3Desc}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-[#F4EFEA] border-t border-[#E5DFD7]">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12 bg-[#0B192C] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto md:self-stretch min-h-[300px]">
                            <Image
                                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&fit=crop"
                                alt="Fine Dining"
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                        <div className="w-full md:w-1/2 p-8 md:py-12 md:pr-12 text-[#F4F1EA]">
                            <h2 className="text-3xl font-bold mb-4 font-serif text-[#F4F1EA]">
                                {t.cateringPage.curatedTitle}
                            </h2>
                            <p className="text-[#F4F1EA]/75 mb-8 text-sm leading-relaxed">
                                {t.cateringPage.curatedDesc}
                            </p>
                            <Link href="/catering/quote">
                                <Button className="bg-[#D4AF37] hover:bg-[#B4942E] text-[#111827] font-bold w-full md:w-auto">
                                    {t.cateringPage.startPlanning}
                                    <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
