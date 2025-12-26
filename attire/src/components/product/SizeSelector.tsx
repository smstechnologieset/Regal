'use client';

/**
 * SizeSelector Component
 * 
 * Displays available sizes as selectable buttons.
 * Shows out-of-stock sizes as disabled.
 */

import React from 'react';
import { cn } from '@/lib/utils';

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
                <button className="text-sm text-slate-500 hover:text-slate-900 underline">
                    Size Guide
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                    const isOutOfStock = outOfStockSizes.includes(size);
                    const isSelected = selectedSize === size;

                    return (
                        <button
                            key={size}
                            onClick={() => !isOutOfStock && onSelect(size)}
                            disabled={isOutOfStock}
                            className={cn(
                                'min-w-[48px] h-11 px-3 rounded-lg border text-sm font-medium transition-all',
                                isSelected
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900',
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
