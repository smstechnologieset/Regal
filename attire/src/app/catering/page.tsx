'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Utensils, Coffee, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CateringPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop"
                    alt="Gourmet Catering"
                    fill
                    unoptimized
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif">Exquisite Tastes</h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light">
                        Elevate your event with our world-class culinary experiences,
                        crafted with passion and the finest ingredients.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/catering/menu">
                            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white min-w-[180px]">
                                View Menu
                            </Button>
                        </Link>
                        <Link href="/catering/quote">
                            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 min-w-[180px]">
                                Get a Quote
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
                                <ChefHat size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">Master Chefs</h3>
                            <p className="text-slate-600">
                                Our culinary team brings decades of experience from top restaurants around the world.
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
                                <Utensils size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">Full Service</h3>
                            <p className="text-slate-600">
                                From table settings to service staff, we handle every detail of your dining experience.
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
                                <Coffee size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3">Custom Menus</h3>
                            <p className="text-slate-600">
                                We tailor every menu to your specific tastes, dietary requirements, and event theme.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12 bg-primary rounded-2xl overflow-hidden shadow-2xl">
                        <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto md:self-stretch min-h-[300px]">
                            <Image
                                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&fit=crop"
                                alt="Fine Dining"
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                        <div className="w-full md:w-1/2 p-8 md:py-12 md:pr-12 text-white">
                            <h2 className="text-3xl font-bold mb-4 font-serif">Curated for You</h2>
                            <p className="text-slate-300 mb-8">
                                Whether it&apos;s an intimate dinner or a grand gala, we have packages to suit every occasion.
                            </p>
                            <Link href="/catering/quote">
                                <Button className="bg-amber-600 hover:bg-amber-700 text-white w-full md:w-auto">
                                    Start Planning
                                    <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
