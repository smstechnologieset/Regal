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
        <div className="min-h-screen bg-white">
            {/* Header / Breadcrumb */}
            <div className="bg-slate-50 border-b border-slate-200 sticky top-16 z-20 backdrop-blur-md bg-white/80">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/gifts"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={18} />
                        Back to Gifts
                    </Link>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                            <Share2 size={20} />
                        </button>
                        <button 
                            onClick={() => setIsWishlisted(!isWishlisted)}
                            className={`p-2 transition-colors ${isWishlisted ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                        >
                            <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Left: Image Gallery (Single for now as per schema) */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-purple-50">
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
                                <div className="w-full h-full flex flex-col items-center justify-center text-purple-200">
                                    <Gift size={120} strokeWidth={1} />
                                    <p className="text-sm font-medium mt-4">No image available</p>
                                </div>
                            )}
                            
                            {/* Category Badge */}
                            <div className="absolute top-6 left-6">
                                <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-purple-700 shadow-lg">
                                    {pkg.category}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="flex flex-col">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm mb-4">
                                <Sparkles size={18} />
                                <span className="uppercase tracking-widest">Premium Gift Package</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                                {pkg.name}
                            </h1>
                            <div className="text-3xl font-black text-purple-600">
                                {formatPrice(pkg.price)}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-10">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Info size={16} />
                                Description
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {pkg.description}
                            </p>
                        </div>

                        {/* What's Inside */}
                        <div className="mb-12">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Check size={18} className="text-emerald-500" />
                                What&apos;s Inside this Box
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {pkg.contents?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-purple-200 hover:bg-purple-50 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-white text-emerald-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                        <span className="text-slate-700 font-bold text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                            <Button 
                                fullWidth 
                                size="lg" 
                                className="bg-purple-600 hover:bg-purple-700 h-16 text-lg rounded-2xl shadow-xl shadow-purple-200"
                                onClick={() => setIsOrderModalOpen(true)}
                                leftIcon={<ShoppingBag size={24} />}
                            >
                                Order Now
                            </Button>
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="h-16 px-8 rounded-2xl border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Ask a Question
                            </Button>
                        </div>
                        
                        <p className="mt-6 text-xs text-center sm:text-left text-slate-400 font-medium">
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
