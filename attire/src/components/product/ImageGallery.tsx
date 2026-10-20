'use client';

/**
 * ImageGallery Component
 * 
 * Product image gallery with main image display and thumbnail navigation.
 * Features: zoom on hover, thumbnail selection, keyboard navigation.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
    images: string[];
    productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    };

    const goToPrevious = () => {
        setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-3 sm:gap-4 w-full max-w-full min-w-0">
            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] py-1 lg:py-0 lg:pr-2 w-full max-w-full min-w-0 scrollbar-hide">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                'shrink-0 w-14 h-16 sm:w-16 sm:h-20 lg:w-20 lg:h-24 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative',
                                selectedIndex === index
                                    ? 'border-[#4A5D4E] ring-2 ring-[#4A5D4E]/30 scale-102'
                                    : 'border-slate-200 hover:border-slate-400 opacity-60 hover:opacity-100'
                            )}
                        >
                            <Image
                                src={image}
                                alt={`${productName} - View ${index + 1}`}
                                width={80}
                                height={96}
                                unoptimized
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main image */}
            <div className="flex-1 relative w-full max-w-full min-w-0">
                <div
                    className="relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in w-full max-w-full"
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleMouseMove}
                >
                    <Image
                        src={images[selectedIndex] || images[0] || ''}
                        alt={`${productName} - Main view`}
                        fill
                        priority
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className={cn(
                            'object-cover transition-transform duration-200',
                            isZoomed && 'scale-150'
                        )}
                        style={
                            isZoomed
                                ? {
                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                }
                                : undefined
                        }
                    />
                </div>

                {/* Navigation arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
                            aria-label="Next image"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-0.5 bg-black/60 text-white text-[10px] sm:text-xs font-semibold rounded-full backdrop-blur-xs">
                        {selectedIndex + 1} / {images.length}
                    </div>
                )}
            </div>
        </div>
    );
}
