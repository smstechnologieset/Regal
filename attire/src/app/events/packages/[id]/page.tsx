'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, Calendar, Users, Clock, Mail } from 'lucide-react';
import { getEventPackageById } from '@/lib/services/event-service';
import { EventPackage } from '@/types';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

interface EventDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
    const { id } = use(params);
    const [pkg, setPkg] = React.useState<EventPackage | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchPackage() {
            setLoading(true);
            const data = await getEventPackageById(id);
            if (!data) {
                notFound();
            }
            setPkg(data);
            setLoading(false);
        }
        fetchPackage();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    if (!pkg) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Image */}
            <div className="relative h-[50vh] min-h-[400px]">
                <Image
                    src={pkg.image}
                    alt={pkg.title}
                    fill
                    unoptimized
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-slate-900/50" />
                <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-4">
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Events
                        </Link>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                            {pkg.title}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-white/90">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium uppercase tracking-wide">
                                {pkg.type}
                            </span>
                            {pkg.capacity && (
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium flex items-center gap-2">
                                    <Users size={16} />
                                    {pkg.capacity}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Overview */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Overview</h2>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                {pkg.description}
                            </p>
                        </div>

                        {/* Included Features */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">What&apos;s Included</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {pkg.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check size={14} />
                                        </div>
                                        <span className="text-slate-700 font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gallery (Placeholder for now) */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Gallery</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                                        <Image
                                            src={`https://images.unsplash.com/photo-${i % 2 === 0 ? '1519741497674-611481863552' : '1511795409834-ef04bbd61622'
                                                }?w=400&h=400&fit=crop`}
                                            alt="Gallery"
                                            fill
                                            unoptimized
                                            className="object-cover hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 sticky top-24">
                            <div className="mb-6">
                                <span className="text-slate-500">Starting from</span>
                                <div className="text-3xl font-bold text-slate-900">
                                    {formatPrice(pkg.priceStart)}
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Calendar className="text-rose-500" />
                                    <span>Check availability</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Clock className="text-rose-500" />
                                    <span>Flexible duration</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail className="text-rose-500" />
                                    <span>Customizable proposal</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link href={`/events/custom?package=${pkg.id}`}>
                                    <Button fullWidth size="lg">
                                        Customize Proposal
                                    </Button>
                                </Link>
                                <Link href={`/events/custom?package=${pkg.id}`}>
                                    <Button fullWidth variant="outline" size="lg">
                                        Contact Planner
                                    </Button>
                                </Link>
                            </div>

                            <p className="mt-4 text-xs text-center text-slate-400">
                                No payment required now. Our planner will contact you to finalize details.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
