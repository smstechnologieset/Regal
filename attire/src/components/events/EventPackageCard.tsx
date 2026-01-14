'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight, Users, Gift } from 'lucide-react';
import { EventPackage } from '@/types';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

interface EventPackageCardProps {
    eventPackage: EventPackage;
}

export default function EventPackageCard({ eventPackage }: EventPackageCardProps) {
    return (
        <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col h-full">
            {/* Image */}
            <div className="relative aspect-video overflow-hidden">
                <Image
                    src={eventPackage.image}
                    alt={eventPackage.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-slate-900 rounded-full">
                        {eventPackage.type}
                    </span>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 right-4">
                    <div className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg shadow-lg">
                        From {formatPrice(eventPackage.priceStart)}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-rose-600 transition-colors">
                    {eventPackage.title}
                </h3>

                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {eventPackage.description}
                </p>

                {/* Capacity */}
                {eventPackage.capacity && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <Users size={16} className="text-rose-500" />
                        <span>{eventPackage.capacity}</span>
                    </div>
                )}

                {/* Features Preview */}
                <div className="space-y-2 mb-6 flex-1">
                    {eventPackage.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-slate-600">
                            <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                        </div>
                    ))}
                    {eventPackage.features.length > 3 && (
                        <div className="text-xs text-slate-400 pl-6">
                            +{eventPackage.features.length - 3} more features
                        </div>
                    )}
                </div>

                {/* Action */}
                <Link href={`/events/packages/${eventPackage.id}`} className="mt-auto">
                    <Button fullWidth variant="outline" rightIcon={<ArrowRight size={16} />}>
                        View Details
                    </Button>
                </Link>
            </div>
        </div>
    );
}
