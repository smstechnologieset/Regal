'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Filter, X } from 'lucide-react';
import { getBridalGowns } from '@/lib/services/bridal';
import { BridalGown } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { BRIDAL_SILHOUETTES } from '@/lib/constants';

export default function BridalGalleryPage() {
    const [filter, setFilter] = useState('all');
    const [gowns, setGowns] = useState<BridalGown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchGowns() {
            setLoading(true);
            const data = await getBridalGowns();
            setGowns(data);
            setLoading(false);
        }
        fetchGowns();
    }, []);

    const filteredGowns = filter === 'all'
        ? gowns
        : gowns.filter(gown => gown.silhouette.toLowerCase() === filter.toLowerCase());

    const silhouettes = ['all', ...BRIDAL_SILHOUETTES];

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <Link href="/bridal" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4">
                        <ArrowLeft size={20} />
                        Back to Bridal
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-serif">Bridal Collection</h1>
                            <p className="text-slate-600 mt-2">Exquisite gowns for your perfect moment.</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-slate-200">
                    {silhouettes.map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${filter === s
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredGowns.map(gown => (
                            <div key={gown.id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                                    <Image
                                        src={gown.images[0]}
                                        alt={gown.name}
                                        fill
                                        unoptimized
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    {gown.isNew && (
                                        <div className="absolute top-4 left-4">
                                            <Badge type="new" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <div className="flex gap-2">
                                            <Link href={`/bridal/appointments?package=${gown.id}`} className="flex-1">
                                                <Button size="sm" className="w-full bg-white text-slate-900 hover:bg-slate-100">
                                                    Book Fitting
                                                </Button>
                                            </Link>
                                            <Button size="sm" variant="outline" className="text-white border-white hover:bg-white/20">
                                                Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 font-serif">{gown.name}</h3>
                                            <p className="text-sm text-slate-500">{gown.designer}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-slate-900">Rent: {formatPrice(gown.priceRent)}</p>
                                            <p className="text-xs text-slate-500">Buy: {formatPrice(gown.priceBuy)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs rounded-md border border-slate-100">
                                            {gown.silhouette}
                                        </span>
                                        <span className="px-2 py-1 bg-slate-50 text-slate-600 text-xs rounded-md border border-slate-100">
                                            {gown.style}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredGowns.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-500 text-lg">No gowns found for this silhouette.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

