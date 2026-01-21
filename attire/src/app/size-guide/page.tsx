'use client';

import React, { useState } from 'react';
import {
    Ruler,
    Info,
    CheckCircle2,
    ChevronRight,
    ExternalLink,
    Maximize2,
    MoveHorizontal,
    Shirt,
    ShoppingBag
} from 'lucide-react';
import Button from '@/components/ui/Button';

// Types for size data
type SizeChartEntry = {
    size: string;
    us: string;
    uk: string;
    eu: string;
    bust?: string;
    waist?: string;
    hips?: string;
    chest?: string;
    height?: string;
    weight?: string;
};

type CategoryData = {
    id: string;
    label: string;
    description: string;
    charts: {
        title: string;
        data: SizeChartEntry[];
    }[];
};

// Size Guide Data
const categories: CategoryData[] = [
    {
        id: 'women',
        label: 'Women',
        description: 'Standard sizing for all women\'s apparel including dresses, tops, and bottoms.',
        charts: [
            {
                title: 'General Sizes',
                data: [
                    { size: 'XS', us: '0-2', uk: '4-6', eu: '32-34', bust: '31-32', waist: '24-25', hips: '34-35' },
                    { size: 'S', us: '4-6', uk: '8-10', eu: '36-38', bust: '33-34', waist: '26-27', hips: '36-37' },
                    { size: 'M', us: '8-10', uk: '12-14', eu: '40-42', bust: '35-36', waist: '28-29', hips: '38-39' },
                    { size: 'L', us: '12-14', uk: '16-18', eu: '44-46', bust: '37-39', waist: '30-32', hips: '40-42' },
                    { size: 'XL', us: '16-18', uk: '20-22', eu: '48-50', bust: '40-42', waist: '33-35', hips: '43-45' },
                ]
            }
        ]
    },
    {
        id: 'men',
        label: 'Men',
        description: 'Casual and formal sizing for men\'s shirts, t-shirts, and trousers.',
        charts: [
            {
                title: 'General Sizes',
                data: [
                    { size: 'S', us: '34-36', uk: '34-36', eu: '44-46', chest: '34-36', waist: '28-30' },
                    { size: 'M', us: '38-40', uk: '38-40', eu: '48-50', chest: '38-40', waist: '32-34' },
                    { size: 'L', us: '42-44', uk: '42-44', eu: '52-54', chest: '42-44', waist: '36-38' },
                    { size: 'XL', us: '46-48', uk: '46-48', eu: '56-58', chest: '46-48', waist: '40-42' },
                    { size: 'XXL', us: '50-52', uk: '50-52', eu: '60-62', chest: '50-52', waist: '44-46' },
                ]
            }
        ]
    },
    {
        id: 'kids',
        label: 'Kids',
        description: 'Sizing based on age and height for children and infants.',
        charts: [
            {
                title: 'Children (2-10 years)',
                data: [
                    { size: '2-3Y', us: '2T-3T', uk: '2-3', eu: '92-98', height: '36-38', weight: '28-32 lbs' },
                    { size: '4-5Y', us: '4T-5', uk: '4-5', eu: '104-110', height: '40-43', weight: '36-42 lbs' },
                    { size: '6-7Y', us: '6-7', uk: '6-7', eu: '116-122', height: '45-48', weight: '46-52 lbs' },
                    { size: '8-9Y', us: '8-9', uk: '8-9', eu: '128-134', height: '50-53', weight: '60-72 lbs' },
                    { size: '10-11Y', us: '10-12', uk: '10-11', eu: '140-146', height: '55-58', weight: '80-92 lbs' },
                ]
            }
        ]
    },
    {
        id: 'accessories',
        label: 'Accessories',
        description: 'Guidelines for hats, belts, and other accessory sizing.',
        charts: [
            {
                title: 'Hats & Headwear',
                data: [
                    { size: 'S', us: '6 3/4 - 6 7/8', uk: '6 5/8 - 6 3/4', eu: '54-55', chest: '21.2-21.6' },
                    { size: 'M', us: '7 - 7 1/8', uk: '6 7/8 - 7', eu: '56-57', chest: '22-22.4' },
                    { size: 'L', us: '7 1/4 - 7 3/8', uk: '7 1/8 - 7 1/4', eu: '58-59', chest: '22.8-23.2' },
                    { size: 'XL', us: '7 1/2 - 7 5/8', uk: '7 3/8 - 7 1/2', eu: '60-61', chest: '23.6-24' },
                ]
            }
        ]
    }
];

export default function SizeGuidePage() {
    const [activeTab, setActiveTab] = useState('women');

    const activeCategory = categories.find(cat => cat.id === activeTab) || categories[0];

    return (
        <main className="min-h-screen pb-20">
            {/* Hero Section */}
            <section className="bg-primary text-white py-16 md:py-24 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 animate-fade-in">
                        <Ruler size={14} className="text-secondary" />
                        <span>Finding your perfect fit</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
                        Size Guide
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        We want to ensure you look your best in Regal attire. Use our detailed size charts below to find the perfect measurement for any garment.
                    </p>
                </div>
            </section>

            {/* Category Tabs */}
            <section className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex overflow-x-auto no-scrollbar py-1">
                        <div className="flex space-x-8">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    className={`py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${activeTab === cat.id
                                            ? 'border-secondary text-secondary'
                                            : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Left Side: How to Measure */}
                    <div className="lg:col-span-1 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                                <Maximize2 size={24} className="text-secondary" />
                                How to Measure
                            </h2>
                            <p className="text-slate-600 mb-8">
                                To get the most accurate measurements, have someone else measure you or use a flexible measuring tape directly against your skin.
                            </p>

                            <div className="space-y-6">
                                {[
                                    {
                                        label: 'Bust / Chest',
                                        desc: 'Measure around the fullest part of your chest, keeping the tape horizontal.',
                                        icon: Shirt
                                    },
                                    {
                                        label: 'Waist',
                                        desc: 'Measure around the narrowest part of your waistline, usually near your navel.',
                                        icon: Ruler
                                    },
                                    {
                                        label: 'Hips',
                                        desc: 'Measure around the fullest part of your hips/backside with feet together.',
                                        icon: Ruler
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-hover hover:border-secondary/30">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-secondary flex-shrink-0">
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary mb-1">{item.label}</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-primary text-white">
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <Info size={20} className="text-secondary" />
                                Pro Tip
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed mb-4">
                                If your measurements are between sizes, we generally recommend going for the larger size for a more comfortable fit, unless you prefer a tighter look.
                            </p>
                            <Button variant="secondary" size="sm" className="w-full" fullWidth>
                                Need more help?
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Charts */}
                    <div className="lg:col-span-2">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-primary mb-2">
                                {activeCategory.label} Size Chart
                            </h2>
                            <p className="text-slate-600">
                                {activeCategory.description}
                            </p>
                        </div>

                        <div className="space-y-12">
                            {activeCategory.charts.map((chart, chartIdx) => (
                                <div key={chartIdx} className="animate-fade-in">
                                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-secondary rounded-full" />
                                        {chart.title}
                                    </h3>

                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-secondary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
                                            {/* Scroll Indicator for Mobile */}
                                            <div className="md:hidden flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-400 text-xs font-medium border-b border-slate-200">
                                                <MoveHorizontal size={14} />
                                                <span>Scroll horizontally to see all data</span>
                                            </div>

                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">Size</th>
                                                        <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">US</th>
                                                        <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">UK</th>
                                                        <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">EU</th>
                                                        {chart.data[0].bust && <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">Bust (in)</th>}
                                                        {chart.data[0].chest && <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">Chest (in)</th>}
                                                        {chart.data[0].waist && <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">Waist (in)</th>}
                                                        {chart.data[0].hips && <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">Hips (in)</th>}
                                                        {chart.data[0].height && <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">Height (in)</th>}
                                                        {chart.data[0].weight && <th className="px-6 py-4 font-bold text-primary text-sm uppercase tracking-wider">Weight</th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {chart.data.map((row, rowIdx) => (
                                                        <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-secondary">{row.size}</td>
                                                            <td className="px-6 py-4 text-slate-600">{row.us}</td>
                                                            <td className="px-6 py-4 text-slate-600">{row.uk}</td>
                                                            <td className="px-6 py-4 text-slate-600">{row.eu}</td>
                                                            {row.bust && <td className="px-6 py-4 text-slate-600">{row.bust}</td>}
                                                            {row.chest && <td className="px-6 py-4 text-slate-600">{row.chest}</td>}
                                                            {row.waist && <td className="px-6 py-4 text-slate-600">{row.waist}</td>}
                                                            {row.hips && <td className="px-6 py-4 text-slate-600">{row.hips}</td>}
                                                            {row.height && <td className="px-6 py-4 text-slate-600">{row.height}</td>}
                                                            {row.weight && <td className="px-6 py-4 text-slate-600">{row.weight}</td>}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Fit Guide Section */}
                        <div className="mt-16 pt-12 border-t border-slate-200">
                            <h2 className="text-2xl font-bold text-primary mb-8">Fit & Fabric Guide</h2>
                            <div className="grid sm:grid-cols-3 gap-6">
                                {[
                                    {
                                        title: 'Slim Fit',
                                        desc: 'Designed to fit close to the body for a sharp, tailored silhouette.'
                                    },
                                    {
                                        title: 'Regular Fit',
                                        desc: 'A classic shape that offers comfortable movement without extra bulk.'
                                    },
                                    {
                                        title: 'Relaxed Fit',
                                        desc: 'A looser, more casual feel for maximum comfort and an easy-going style.'
                                    }
                                ].map((fit, idx) => (
                                    <div key={idx} className="p-6 rounded-2xl border border-slate-200 hover:border-secondary transition-colors group">
                                        <CheckCircle2 size={24} className="text-secondary mb-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                                        <h4 className="font-bold text-primary mb-2">{fit.title}</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">{fit.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <section className="container mx-auto px-4 mt-12">
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_#179c22_0%,_transparent_25%)] opacity-20" />
                    <div className="relative z-10">
                        <ShoppingBag size={48} className="text-secondary mx-auto mb-6 opacity-80" />
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to find your style?</h2>
                        <p className="text-white/60 mb-8 max-w-xl mx-auto">
                            Now that you've found your size, explore our latest collection and discover pieces that will make you feel like royalty.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="secondary" size="lg" rightIcon={<ChevronRight size={18} />}>
                                Shop Women's Collection
                            </Button>
                            <Button variant="outline" size="lg" className="text-white border-white/20 hover:bg-white hover:text-black">
                                See New Arrivals
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
