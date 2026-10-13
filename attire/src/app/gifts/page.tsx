'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Gift, Sparkles, Filter, Search, ArrowRight } from 'lucide-react';
import { GIFT_CATEGORIES } from '@/lib/constants';
import { getGiftPackages, GiftPackage } from '@/lib/services/gifts';
import GiftPackageCard from '@/components/gifts/GiftPackageCard';
import Loader from '@/components/ui/Loader';
import { useLanguage } from '@/context/LanguageContext';

export default function GiftsPage() {
    const { t, isAmharic } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [packages, setPackages] = useState<GiftPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchPackages() {
            setLoading(true);
            try {
                const data = await getGiftPackages();
                setPackages(data);
            } catch (error) {
                console.error('Failed to load gift packages:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPackages();
    }, []);

    const filteredPackages = packages.filter(pkg => {
        const matchesCategory = selectedCategory === 'all' || pkg.category === selectedCategory;
        const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             pkg.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Hero Section */}
            <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1974&auto=format&fit=crop"
                    alt="Gift Packages"
                    fill
                    unoptimized
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-[#2B2D2F]/70 transition-opacity" />
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C5A059]/20 backdrop-blur-md rounded-full text-[#C5A059] font-medium text-xs sm:text-sm mb-6 border border-[#C5A059]/30">
                        <Sparkles size={16} />
                        <span>{t.giftsPage.badge}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-6 tracking-tight">
                        {t.giftsPage.title}
                    </h1>
                    <p className="text-base md:text-xl text-[#FDFBF7]/85 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        {t.giftsPage.subtitle}
                    </p>
                </div>
            </section>

            {/* Filter & Search Bar */}
            <section className="sticky top-16 z-30 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#E0D6C8]">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-md shadow-[#4A5D4E]/20'
                                        : 'bg-white text-[#2B2D2F]/80 hover:bg-[#F4EFEA] border border-[#E0D6C8]'
                                }`}
                            >
                                {t.giftsPage.allGifts}
                            </button>
                            {GIFT_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setSelectedCategory(cat.value)}
                                    className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                        selectedCategory === cat.value
                                            ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-md shadow-[#4A5D4E]/20'
                                            : 'bg-white text-[#2B2D2F]/80 hover:bg-[#F4EFEA] border border-[#E0D6C8]'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2D2F]/40" size={18} />
                            <input
                                type="text"
                                placeholder={t.giftsPage.searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E0D6C8] rounded-full outline-none focus:ring-2 focus:ring-[#4A5D4E]/40 text-sm font-medium text-[#2B2D2F] transition-all"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 py-16">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader />
                        <p className="text-[#2B2D2F]/50 font-medium animate-pulse text-sm">
                            {isAmharic ? "ጥቅሎች እየተዘጋጁ ነው..." : "Unwrapping packages..."}
                        </p>
                    </div>
                ) : (
                    <>
                        {filteredPackages.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredPackages.map((pkg) => (
                                    <GiftPackageCard key={pkg.id} pkg={pkg} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-[#E0D6C8]">
                                <Search size={48} className="text-[#2B2D2F]/30 mx-auto mb-4" />
                                <h3 className="text-xl font-bold font-serif text-[#2B2D2F]">
                                    {t.giftsPage.noPackages}
                                </h3>
                                <p className="text-[#2B2D2F]/60 mt-1 text-sm">
                                    {isAmharic ? "ምድቡን ወይም የፍለጋ ቃሉን ያስተካክሉ።" : "Try adjusting your category or search term."}
                                </p>
                                <button 
                                    onClick={() => {setSelectedCategory('all'); setSearchTerm('');}}
                                    className="mt-6 text-[#4A5D4E] font-bold hover:text-[#38463B] underline underline-offset-4"
                                >
                                    {isAmharic ? "ሁሉንም አጽዳ" : "Clear all filters"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Custom Gift CTA */}
            <section className="bg-[#2B2D2F] py-24 relative overflow-hidden border-t border-[#E0D6C8]">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <Gift size={56} className="text-[#C5A059] mx-auto mb-6" strokeWidth={1.5} />
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#FDFBF7] mb-5">
                            {t.giftsPage.customGiftTitle}
                        </h2>
                        <p className="text-base sm:text-lg text-[#FDFBF7]/75 mb-10 leading-relaxed font-light">
                            {t.giftsPage.customGiftDesc}
                        </p>
                        <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#4A5D4E] hover:bg-[#38463B] text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
                            <span>{t.giftsPage.contactGiftTeam}</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
