'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gift, ArrowRight, ListChecks } from 'lucide-react';
import { GiftPackage } from '@/lib/services/gifts';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

interface GiftPackageCardProps {
    pkg: GiftPackage;
}

export default function GiftPackageCard({ pkg }: GiftPackageCardProps) {
    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden">
                {pkg.image ? (
                    <Image
                        src={pkg.image}
                        alt={pkg.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-purple-50 flex items-center justify-center text-purple-200">
                        <Gift size={64} strokeWidth={1} />
                    </div>
                )}
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-purple-700 rounded-full shadow-sm">
                        {pkg.category}
                    </span>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                    <div className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-lg">
                        {formatPrice(pkg.price)}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {pkg.name}
                </h3>

                <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {pkg.description}
                </p>

                {/* Contents Preview */}
                <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <ListChecks size={14} />
                        Inside this package
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {pkg.contents?.slice(0, 3).map((item, index) => (
                            <span key={index} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100">
                                {item}
                            </span>
                        ))}
                        {pkg.contents?.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                                + {pkg.contents.length - 3} more
                            </span>
                        )}
                    </div>
                </div>

                {/* Call to Action */}
                <Link href={`/gifts/${pkg.id}`} className="mt-auto block">
                    <Button 
                        fullWidth 
                        variant="secondary" 
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-none group/btn shadow-none"
                    >
                        <span>View Package</span>
                        <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
