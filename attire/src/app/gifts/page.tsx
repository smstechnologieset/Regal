'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Gift, Sparkles, Filter, Search, ArrowRight } from 'lucide-react';
import { GIFT_CATEGORIES } from '@/lib/constants';
import { getGiftPackages, GiftPackage } from '@/lib/services/gifts';
import GiftPackageCard from '@/components/gifts/GiftPackageCard';
import Loader from '@/components/ui/Loader';

export default function GiftsPage() {
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
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1974&auto=format&fit=crop"
                    alt="Gift Packages"
                    fill
                    unoptimized
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 transition-opacity" />
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 backdrop-blur-md rounded-full text-purple-200 font-medium text-sm mb-6 animate-fade-in-up border border-purple-500/30">
                        <Sparkles size={16} />
                        <span>Curated Moment Makers</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 animate-fade-in-up tracking-tight" style={{ animationDelay: '0.1s' }}>
                        Perfect Gifts for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">Every Occasion</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
                        Thoughtfully curated gift packages designed to make your loved ones feel special. 
                        Order now and we'll handle the magic.
                    </p>
                </div>
            </section>

            {/* Filter & Search Bar */}
            <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                All Gifts
                            </button>
                            {GIFT_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setSelectedCategory(cat.value)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                        selectedCategory === cat.value
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search packages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full outline-none focus:ring-2 focus:ring-purple-500/50 text-sm font-medium transition-all"
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
                        <p className="text-slate-400 font-medium animate-pulse">Unwrapping treasures...</p>
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
                            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                                <Search size={48} className="text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-800">No packages found</h3>
                                <p className="text-slate-500 mt-1">Try adjusting your category or search term.</p>
                                <button 
                                    onClick={() => {setSelectedCategory('all'); setSearchTerm('');}}
                                    className="mt-6 text-purple-600 font-bold hover:text-purple-700 underline underline-offset-4"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Custom Gift CTA */}
            <section className="bg-slate-900 py-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <Gift size={64} className="text-purple-400 mx-auto mb-8" strokeWidth={1.5} />
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Tailor-Made <span className="text-purple-400">Surprises</span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                            Need something truly unique? Our gift specialists can curate a completely custom package 
                            based on your recipient's tastes and your budget.
                        </p>
                        <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
                            <span>Inquire for Custom Gift</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
