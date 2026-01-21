'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Calendar, ArrowRight, Heart, Scissors } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function BridalPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1549488497-94b52bddac5d?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Bridal Elegance"
                    fill
                    unoptimized
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-2xl text-white animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white font-medium text-sm mb-6 border border-white/30">
                            Regal Bridal Collection
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif">
                            Say Yes to <br />
                            <span className="text-rose-200">Elegance</span>
                        </h1>
                        <p className="text-xl text-white/90 mb-10 leading-relaxed font-light">
                            From the perfect gown to flawless makeup, we curate every detail
                            to make your special day truly unforgettable.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/bridal/appointments">
                                <Button size="lg" variant="secondary" className="min-w-[180px]">
                                    Book Appointment
                                </Button>
                            </Link>
                            <Link href="/bridal/gallery">
                                <Button
                                    size="lg"
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm min-w-[180px]"
                                >
                                    View Collection
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-20 md:py-28 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4 font-serif">
                            Complete Bridal Services
                        </h2>
                        <p className="text-slate-600">
                            Expert stylists and consultants dedicated to your bridal journey.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Gowns */}
                        <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                                <Heart size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">Designer Gowns</h3>
                            <p className="text-slate-600 mb-6">
                                Explore our curated collection of luxury gowns from top designers.
                                Available for rent or purchase.
                            </p>
                            <Link href="/bridal/gallery" className="inline-flex items-center text-secondary font-medium hover:gap-2 transition-all">
                                Browse Collection <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        {/* Beauty */}
                        <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">Hair & Makeup</h3>
                            <p className="text-slate-600 mb-6">
                                Professional bridal beauty services including trials,
                                airbrush makeup, and updos.
                            </p>
                            <Link href="/bridal/appointments?type=beauty" className="inline-flex items-center text-secondary font-medium hover:gap-2 transition-all">
                                View Packages <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        {/* Fittings */}
                        <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                                <Scissors size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">Personal Styling</h3>
                            <p className="text-slate-600 mb-6">
                                Private fitting sessions with our expert stylists to ensure
                                the perfect fit and look.
                            </p>
                            <Link href="/bridal/appointments" className="inline-flex items-center text-secondary font-medium hover:gap-2 transition-all">
                                Book Consultation <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Image Split */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="https://images.unsplash.com/photo-1584126467121-0db1e6bb47a7?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                alt="Bridal Fitting"
                                fill
                                unoptimized
                                className="object-cover hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-medium">
                                <Calendar size={16} /> Now Accepting 2026 Bookings
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-primary font-serif leading-tight">
                                Private Showroom <br />Experience
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Step into our exclusive bridal suite where dreams come to life.
                                Enjoy champagne while our consultants guide you through our collection
                                to find the dress that captures your unique style and spirit.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    'Exclusive access to designer collections',
                                    'Professional alteration services available',
                                    'Virtual consultations for remote brides',
                                    'Group appointments for bridal parties'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-4">
                                <Link href="/bridal/appointments">
                                    <Button size="lg" variant="primary">
                                        Schedule Your Visit
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
