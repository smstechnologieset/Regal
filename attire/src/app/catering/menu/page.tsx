'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search } from 'lucide-react';
import { getCateringPackages, getMenuItems } from '@/lib/services/catering';
import { CateringPackage, MenuItem } from '@/types';
import { CATERING_CATEGORIES } from '@/lib/constants';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export default function CateringMenuPage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [packages, setPackages] = useState<CateringPackage[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const categories = ['all', ...CATERING_CATEGORIES.map(c => c.value)];

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        async function fetchData() {
            const [pkgData, itemData] = await Promise.all([
                getCateringPackages(),
                getMenuItems()
            ]);
            setPackages(pkgData);
            setMenuItems(itemData);
            setLoading(false);
        }
        fetchData();
    }, []);

    const filteredItems = activeCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === activeCategory);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <Link href="/catering" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4">
                        <ArrowLeft size={20} />
                        Back to Catering
                    </Link>
                    <div className="text-center max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-serif mb-4">Our Menu</h1>
                        <p className="text-slate-600">
                            Explore our selection of gourmet dishes and curated packages.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Packages Section */}
                        <div className="mb-16">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8 font-serif">Featured Packages</h2>
                            <div className="grid md:grid-cols-3 gap-8">
                                {packages.map(pkg => (
                                    <div key={pkg.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
                                        <div className="relative h-48">
                                            <Image
                                                src={pkg.image}
                                                alt={pkg.name}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-slate-900 shadow-sm">
                                                ${pkg.pricePerGuest}/guest
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 font-serif">{pkg.name}</h3>
                                            <p className="text-slate-600 text-sm mb-4">{pkg.description}</p>

                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Includes:</p>
                                                <ul className="space-y-1 mb-6">
                                                    {pkg.includes.map((item, i) => (
                                                        <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <Link href={`/catering/quote?package=${pkg.id}`}>
                                                <Button fullWidth className="bg-slate-900 hover:bg-slate-800">
                                                    Select Package
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* A La Carte Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 font-serif">A La Carte Selections</h2>

                            {/* Category Filter */}
                            <div className="flex flex-wrap justify-center gap-2 mb-10">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all capitalize ${activeCategory === cat
                                            ? 'bg-amber-600 text-white shadow-md'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                unoptimized
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 font-serif text-lg">{item.name}</h3>
                                                {item.dietary && item.dietary.map(d => (
                                                    <span key={d} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredItems.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-slate-500 text-lg">No menu items found for this category.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

