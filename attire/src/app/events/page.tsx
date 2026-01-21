'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Sparkles, Calendar, PenTool, ArrowRight } from 'lucide-react';
import { EVENT_TYPES } from '@/lib/constants';
import { getEventPackages } from '@/lib/services/events';
import { EventPackage } from '@/types';
import EventPackageCard from '@/components/events/EventPackageCard';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';

export default function EventsPage() {
    const [selectedType, setSelectedType] = useState<string>('all');
    const [packages, setPackages] = useState<EventPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPackages() {
            const data = await getEventPackages();
            setPackages(data);
            setLoading(false);
        }
        fetchPackages();
    }, []);

    const filteredPackages = selectedType === 'all'
        ? packages
        : packages.filter(pkg => pkg.type === selectedType);


    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://plus.unsplash.com/premium_photo-1664474653221-8412b8dfca3e?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Event Planning"
                    fill
                    unoptimized
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-primary/60" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-sm mb-6 animate-fade-in-up">
                        ✨ Unforgettable Moments
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Plan Your Perfect Event
                    </h1>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        From intimate gatherings to grand celebrations, we bring your vision to life.
                        Choose a package or create your own.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <Link href="#packages">
                            <Button size="lg" variant="secondary" leftIcon={<Search size={18} />}>
                                Browse Packages
                            </Button>
                        </Link>
                        <Link href="/events/custom">
                            <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm" leftIcon={<PenTool size={18} />}>
                                Plan Custom Event
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Filter Section */}
            <section id="packages" className="py-12 bg-white border-b border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                            onClick={() => setSelectedType('all')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedType === 'all'
                                ? 'bg-secondary text-white shadow-lg shadow-rose-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            All Events
                        </button>
                        {EVENT_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setSelectedType(type.value)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedType === type.value
                                    ? 'bg-secondary text-white shadow-lg shadow-rose-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages Grid */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="py-20">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredPackages.map((pkg) => (
                                    <EventPackageCard key={pkg.id} eventPackage={pkg} />
                                ))}
                            </div>

                            {filteredPackages.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-slate-500 text-lg">No event packages found for this category.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Custom Event CTA */}
            <section className="py-20 bg-primary text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/10 rounded-full blur-3xl transform translate-x-1/3" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <Sparkles size={48} className="text-rose-400 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Can&apos;t find what you&apos;re looking for?
                        </h2>
                        <p className="text-xl text-slate-300 mb-8">
                            We specialize in creating bespoke experiences tailored to your unique preferences and budget.
                        </p>
                        <Link href="/events/custom">
                            <Button size="lg" variant="secondary" rightIcon={<ArrowRight size={18} />}>
                                Create Custom Event
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

