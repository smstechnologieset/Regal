'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ServiceCardProps {
    title: string;
    description: string;
    image: string;
    link: string;
    priceStart?: number;
}

export default function ServiceCard({ title, description, image, link, priceStart }: ServiceCardProps) {
    return (
        <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
            <div className="relative h-64 overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-primary mb-2 font-serif">{title}</h3>
                <p className="text-slate-600 mb-4 flex-1 text-sm leading-relaxed">
                    {description}
                </p>
                {priceStart !== undefined && (
                    <p className="text-sm font-medium text-primary mb-4">
                        Starts at ${priceStart}
                    </p>
                )}
                <Link href={link}>
                    <Button variant="outline" className="w-full group-hover:bg-rose-50 group-hover:text-secondary/80 group-hover:border-rose-200">
                        Learn More
                    </Button>
                </Link>
            </div>
        </div>
    );
}
