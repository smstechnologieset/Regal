'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Sparkles, Calendar, PenTool, ArrowRight } from 'lucide-react';
import { EVENT_TYPES } from '@/lib/constants';
import { getEventPackages } from '@/lib/services/event-service';
import { EventPackage } from '@/types';
import EventPackageCard from '@/components/events/EventPackageCard';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { useLanguage } from '@/context/LanguageContext';
import { useServices } from '@/context/ServicesContext';
import ServiceDisabledCard from '@/components/common/ServiceDisabledCard';

export default function EventsPage() {
    const { t, isAmharic } = useLanguage();
    const { isServiceEnabled } = useServices();

    if (!isServiceEnabled('events')) {
        return (
            <ServiceDisabledCard
                serviceId="events"
                serviceName={isAmharic ? "የዝግጅት እቅድ እና ዲኮር" : "Event Planning & Decor"}
            />
        );
    }
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
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://plus.unsplash.com/premium_photo-1664474653221-8412b8dfca3e?q=80&w=869&auto=format&fit=crop"
                    alt="Event Planning"
                    fill
                    unoptimized
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-[#2B2D2F]/70" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-xs sm:text-sm mb-6 animate-fade-in-up border border-white/30">
                        ✨ {t.eventsPage.tag}
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {t.eventsPage.title}
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 animate-fade-in-up font-light leading-relaxed" style={{ animationDelay: '0.2s' }}>
                        {t.eventsPage.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <Link href="#packages">
                            <Button size="lg" className="bg-[#4A5D4E] hover:bg-[#38463B] text-white" leftIcon={<Search size={18} />}>
                                {t.eventsPage.browsePackages}
                            </Button>
                        </Link>
                        <Link href="/events/custom">
                            <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm" leftIcon={<PenTool size={18} />}>
                                {t.eventsPage.planCustom}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Filter Section */}
            <section id="packages" className="py-12 bg-white border-b border-[#E0D6C8]">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                            onClick={() => setSelectedType('all')}
                            className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${selectedType === 'all'
                                ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-md shadow-[#4A5D4E]/20'
                                : 'bg-[#F4EFEA] text-[#2B2D2F]/80 hover:bg-[#E0D6C8]'
                                }`}
                        >
                            {t.eventsPage.allEvents}
                        </button>
                        {EVENT_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setSelectedType(type.value)}
                                className={`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${selectedType === type.value
                                    ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-md shadow-[#4A5D4E]/20'
                                    : 'bg-[#F4EFEA] text-[#2B2D2F]/80 hover:bg-[#E0D6C8]'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages Grid */}
            <section className="py-16 md:py-24 bg-[#FDFBF7]">
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
                                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E0D6C8]">
                                    <p className="text-[#2B2D2F]/60 text-lg">
                                        {isAmharic ? "ለዚህ ምድብ የተዘጋጀ ጥቅል አልተገኘም።" : "No event packages found for this category."}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Custom Event CTA */}
            <section className="py-20 bg-[#2B2D2F] text-white relative overflow-hidden border-t border-[#E0D6C8]">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <Sparkles size={48} className="text-[#C5A059] mx-auto mb-6" />
                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-[#FDFBF7]">
                            {t.eventsPage.customCtaTitle}
                        </h2>
                        <p className="text-base sm:text-lg text-[#FDFBF7]/75 mb-8 leading-relaxed font-light">
                            {t.eventsPage.customCtaDesc}
                        </p>
                        <Link href="/events/custom">
                            <Button size="lg" className="bg-[#4A5D4E] hover:bg-[#38463B] text-white" rightIcon={<ArrowRight size={18} />}>
                                {t.eventsPage.startPlanning}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
