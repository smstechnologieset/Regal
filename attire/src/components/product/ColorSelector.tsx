'use client';

/**
 * ColorSelector Component
 * 
 * Displays available colors as selectable swatches.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { ProductColor } from '@/types';
import { cn } from '@/lib/utils';

interface ColorSelectorProps {
    colors: ProductColor[];
    selectedColor: ProductColor | null;
    onSelect: (color: ProductColor) => void;
}

export default function ColorSelector({
    colors,
    selectedColor,
    onSelect,
}: ColorSelectorProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Color: <span className="text-slate-500 font-medium normal-case ml-1">{selectedColor?.name || 'Select a color'}</span>
                </span>
            </div>
            <div className="flex flex-wrap gap-3">
                {colors.map((color) => {
                    const isSelected = selectedColor?.name === color.name;
                    const isLight = isLightColor(color.hex);
                    const isWhite = color.hex.toUpperCase() === '#FFFFFF' || color.hex.toLowerCase() === 'white';

                    return (
                        <button
                            key={color.name}
                            onClick={() => onSelect(color)}
                            className={cn(
                                'relative w-11 h-11 rounded-full border-2 transition-all duration-300 ease-out flex items-center justify-center group',
                                isSelected
                                    ? 'border-slate-900 ring-2 ring-slate-900/10 ring-offset-2'
                                    : 'border-transparent hover:border-slate-300 hover:scale-105',
                                isWhite && !isSelected && 'border-slate-200'
                            )}
                            title={color.name}
                            aria-label={`Select ${color.name} color`}
                        >
                            <span 
                                className={cn(
                                    "w-8 h-8 rounded-full shadow-sm transition-transform duration-300",
                                    isSelected ? "scale-90" : "group-hover:scale-95"
                                )}
                                style={{ backgroundColor: color.hex }}
                            />
                            {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Check
                                        size={14}
                                        className={cn(
                                            'transition-opacity duration-300',
                                            isLight ? 'text-slate-900' : 'text-white'
                                        )}
                                        strokeWidth={3}
                                    />
                                </div>
                            )}
                            {/* Hover Tooltip (Optional, but nice for UX) */}
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                {color.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Utility to check if a color is light (for contrast)
 */
function isLightColor(hex: string): boolean {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
}
