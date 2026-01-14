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
        <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] pb-2 lg:pb-0 lg:pr-2">
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={cn(
                            'flex-shrink-0 w-16 h-20 lg:w-20 lg:h-24 rounded-lg overflow-hidden border-2 transition-all',
                            selectedIndex === index
                                ? 'border-slate-900'
                                : 'border-transparent hover:border-slate-300'
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

            {/* Main image */}
            <div className="flex-1 relative">
                <div
                    className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in"
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleMouseMove}
                >
                    <Image
                        src={images[selectedIndex]}
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
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                            aria-label="Next image"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                    {selectedIndex + 1} / {images.length}
                </div>
            </div>
        </div>
    );
}
