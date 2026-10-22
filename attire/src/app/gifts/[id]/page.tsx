'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, Gift, ShoppingBag, Share2, Heart, Info, Sparkles } from 'lucide-react';
import { getGiftPackageById, GiftPackage } from '@/lib/services/gifts';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import OrderModal from '@/components/gifts/OrderModal';
import Loader from '@/components/ui/Loader';

interface GiftDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function GiftDetailPage({ params }: GiftDetailPageProps) {
    const { id } = use(params);
    const [pkg, setPkg] = useState<GiftPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);

    useEffect(() => {
        async function fetchPackage() {
            setLoading(true);
            try {
                const data = await getGiftPackageById(id);
                if (!data) {
                    notFound();
                }
                setPkg(data);
            } catch (error) {
                console.error('Error fetching gift package:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPackage();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader />
                <p className="text-slate-400 font-medium animate-pulse">Opening the gift box...</p>
            </div>
        );
    }

    if (!pkg) return null;

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            {/* Header / Breadcrumb */}
            <div className="bg-[#F4EFEA]/80 border-b border-[#E5DFD7] sticky top-16 z-20 backdrop-blur-md">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/gifts"
                        className="inline-flex items-center gap-2 text-[#111827]/70 hover:text-[#1E3A8A] transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={18} />
                        Back to Gifts
                    </Link>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-[#111827]/60 hover:text-[#1E3A8A] transition-colors">
                            <Share2 size={20} />
                        </button>
                        <button 
                            onClick={() => setIsWishlisted(!isWishlisted)}
                            className={`p-2 transition-colors ${isWishlisted ? 'text-rose-500' : 'text-[#111827]/40 hover:text-rose-500'}`}
                        >
                            <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 w-full max-w-full overflow-x-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 w-full max-w-full min-w-0">
                    {/* Left: Image Gallery (Single for now as per schema) */}
                    <div className="space-y-6 w-full max-w-full min-w-0">
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-[#F4EFEA] border border-[#E5DFD7] w-full">
                            {pkg.image ? (
                                <Image
                                    src={pkg.image}
                                    alt={pkg.name}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#D4AF37]">
                                    <Gift size={120} strokeWidth={1} />
                                    <p className="text-sm font-medium mt-4 text-[#111827]/60">No image available</p>
                                </div>
                            )}
                            
                            {/* Category Badge */}
                            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                                <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#F9F8F6]/95 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#1E3A8A] shadow-sm border border-[#E5DFD7]">
                                    {pkg.category}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="flex flex-col w-full max-w-full min-w-0">
                        <div className="mb-6 sm:mb-8">
                            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs sm:text-sm mb-3">
                                <Sparkles size={16} />
                                <span className="uppercase tracking-widest">Premium Gift Package</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-serif text-[#111827] mb-3 tracking-tight leading-tight break-words">
                                {pkg.name}
                            </h1>
                            <div className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">
                                {formatPrice(pkg.price)}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-10">
                            <h2 className="text-sm font-bold text-[#111827]/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Info size={16} />
                                Description
                            </h2>
                            <p className="text-lg text-[#111827]/80 leading-relaxed font-sans">
                                {pkg.description}
                            </p>
                        </div>

                        {/* What's Inside */}
                        <div className="mb-12">
                            <h2 className="text-sm font-bold text-[#111827]/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Check size={18} className="text-[#1E3A8A]" />
                                What&apos;s Inside this Box
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {pkg.contents?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#E5DFD7] group hover:border-[#D4AF37]/50 hover:bg-[#F4EFEA]/60 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                        <span className="text-[#111827] font-bold text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="mt-auto pt-8 border-t border-[#E5DFD7] flex flex-col sm:flex-row gap-4">
                            <Button 
                                fullWidth 
                                size="lg" 
                                className="bg-[#1E3A8A] hover:bg-[#172554] text-[#F4F1EA] h-16 text-lg rounded-2xl shadow-xl shadow-[#1E3A8A]/20"
                                onClick={() => setIsOrderModalOpen(true)}
                                leftIcon={<ShoppingBag size={24} />}
                            >
                                Order Now
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="h-16 px-8 rounded-2xl border-[#E5DFD7] text-[#111827] hover:bg-[#F4EFEA] transition-colors"
                            >
                                Ask a Question
                            </Button>
                        </div>
                        <p className="mt-6 text-xs text-center sm:text-left text-[#111827]/50 font-medium">
                           💳 No advance payment required. Chat with us to finalize details.
                        </p>
                    </div>
                </div>
            </main>

            {/* Order Modal */}
            <OrderModal 
                pkg={pkg} 
                isOpen={isOrderModalOpen} 
                onClose={() => setIsOrderModalOpen(false)} 
            />
        </div>
    );
}
