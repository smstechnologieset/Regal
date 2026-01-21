'use client';

import React from 'react';
import Link from 'next/link';
import { Award, Users, Heart, Sparkles, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AboutPage() {
    const values = [
        {
            icon: Award,
            title: 'Uncompromising Quality',
            description: 'From the finest fabrics in our attire to the meticulous details of our events, we never settle for anything less than perfection.'
        },
        {
            icon: Users,
            title: 'Customer Centric',
            description: 'Your dreams and satisfaction are at the heart of everything we do. We listen, adapt, and deliver beyond expectations.'
        },
        {
            icon: Sparkles,
            title: 'Modern Innovation',
            description: 'We blend timeless traditions with modern solutions to create experiences that are both classic and cutting-edge.'
        },
        {
            icon: Heart,
            title: 'Passion Driven',
            description: 'Our team is fueled by a genuine love for style, celebrations, and creating moments that last a lifetime.'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-primary">
                    <div className="absolute inset-0 hero-gradient opacity-90" />
                    <img
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                        alt="About Regal"
                        className="w-full h-full object-cover mix-blend-overlay"
                    />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                        Our Story
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed animate-slide-up">
                        Redefining elegance and celebration since inception. Regal is your destination for premium style and unforgettable moments.
                    </p>
                </div>
            </section>

            {/* Our Journey */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl font-bold mb-6 text-primary">The Regal Journey</h2>
                            <div className="space-y-4 text-slate-600 leading-relaxed">
                                <p>
                                    Founded on the principle of providing unparalleled service across the most important facets of style and celebration, Regal has grown into a multi-vertical platform that simplifies the way you shop and celebrate.
                                </p>
                                <p>
                                    What started as a boutique fashion vision has expanded into a full-scale ecosystem. Today, we specialize in curated high-end attire, bespoke event planning, breathtaking bridal services, and gourmet catering.
                                </p>
                                <p>
                                    Our mission is simple: to bring sophistication and ease to your life. Whether you're finding the perfect outfit or planning the event of the decade, we are here to ensure every detail is regal.
                                </p>
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
                                    alt="Our team at work"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-secondary text-white p-8 rounded-2xl shadow-xl hidden md:block">
                                <p className="text-4xl font-bold">10+</p>
                                <p className="text-sm font-medium uppercase tracking-wider">Years of Excellence</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Values Grid */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-primary">Our Core Values</h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            The foundation of our success and the promise we keep to our clients every single day.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors">
                                    <value.icon size={24} className="text-secondary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-primary">{value.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Tie-in */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="bg-primary rounded-3xl p-8 md:p-16 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/10 skew-x-12 translate-x-1/2" />

                        <div className="relative z-10 max-w-2xl">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">A Complete Ecosystem for Modern Living</h2>
                            <p className="text-white/80 mb-8 leading-relaxed">
                                Regal isn't just a store; it's a partner in your most significant moments. Discover how our diverse services work together to serve you better.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/attire">
                                    <Button variant="secondary" className="flex items-center gap-2">
                                        Explore Attire <ArrowRight size={18} />
                                    </Button>
                                </Link>
                                <Link href="/events">
                                    <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white">
                                        Event Services
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-4 text-primary">Ready to Experience Elegance?</h2>
                    <p className="text-slate-500 mb-8 max-w-xl mx-auto">
                        Join the thousand of clients who trust Regal for their most important needs. We're here to make it unforgettable.
                    </p>
                    <Link href="/contact">
                        <Button size="lg" variant="primary">
                            Get in Touch Today
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
