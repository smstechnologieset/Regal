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
        <div>
            <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-slate-700">Color:</label>
                {selectedColor && (
                    <span className="text-sm text-slate-500">{selectedColor.name}</span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                    const isSelected = selectedColor?.name === color.name;
                    const isLight = isLightColor(color.hex);

                    return (
                        <button
                            key={color.name}
                            onClick={() => onSelect(color)}
                            className={cn(
                                'w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center',
                                isSelected
                                    ? 'border-slate-900 scale-110'
                                    : 'border-slate-200 hover:border-slate-400',
                                color.hex === '#FFFFFF' && 'border-slate-300'
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            aria-label={`Select ${color.name} color`}
                        >
                            {isSelected && (
                                <Check
                                    size={16}
                                    className={isLight ? 'text-slate-900' : 'text-white'}
                                />
                            )}
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
