'use client';

/**
 * SizeSelector Component
 * 
 * Displays available sizes as selectable buttons.
 * Shows out-of-stock sizes as disabled.
 */

import React from 'react';
import { cn } from '@/lib/utils';
// import { Link } from 'lucide-react';
import Link from "next/link";


interface SizeSelectorProps {
    sizes: string[];
    selectedSize: string | null;
    onSelect: (size: string) => void;
    outOfStockSizes?: string[];
}

export default function SizeSelector({
    sizes,
    selectedSize,
    onSelect,
    outOfStockSizes = [],
}: SizeSelectorProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Size</label>

                <Link href="/size-guide" className="text-sm text-slate-500 hover:text-primary underline" > Size Guide </Link>
                {/* <button className="text-sm text-slate-500 hover:text-primary underline">
                    Size Guide

                </button> */}

            </div>
            <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                    const isOutOfStock = outOfStockSizes.includes(size);
                    const isSelected = selectedSize === size;

                    return (
                        <button
                            key={size}
                            type="button"
                            onClick={() => !isOutOfStock && onSelect(size)}
                            disabled={isOutOfStock}
                            className={cn(
                                'min-w-[44px] h-10 sm:h-11 px-3 rounded-lg border text-xs sm:text-sm font-medium transition-all max-w-full cursor-pointer',
                                isSelected
                                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                                    : 'bg-white text-slate-700 border-slate-300 hover:border-[#1E3A8A]',
                                isOutOfStock && 'opacity-40 cursor-not-allowed line-through'
                            )}
                        >
                            {size}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
