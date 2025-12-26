'use client';

/**
 * QuantitySelector Component
 * 
 * Increment/decrement quantity control with input field.
 */

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
    quantity: number;
    onChange: (quantity: number) => void;
    min?: number;
    max?: number;
    size?: 'sm' | 'md';
}

export default function QuantitySelector({
    quantity,
    onChange,
    min = 1,
    max = 99,
    size = 'md',
}: QuantitySelectorProps) {
    const handleDecrement = () => {
        if (quantity > min) {
            onChange(quantity - 1);
        }
    };

    const handleIncrement = () => {
        if (quantity < max) {
            onChange(quantity + 1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= min && value <= max) {
            onChange(value);
        }
    };

    const buttonClasses = cn(
        'flex items-center justify-center border border-slate-300 transition-colors',
        'hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' ? 'w-8 h-8 rounded' : 'w-10 h-10 rounded-lg'
    );

    const inputClasses = cn(
        'text-center border-y border-slate-300 font-medium text-slate-900',
        'focus:outline-none focus:bg-slate-50',
        size === 'sm' ? 'w-10 h-8 text-sm' : 'w-14 h-10'
    );

    return (
        <div className="inline-flex items-center">
            <button
                onClick={handleDecrement}
                disabled={quantity <= min}
                className={cn(buttonClasses, 'rounded-r-none border-r-0')}
                aria-label="Decrease quantity"
            >
                <Minus size={size === 'sm' ? 14 : 16} />
            </button>
            <input
                type="number"
                value={quantity}
                onChange={handleInputChange}
                min={min}
                max={max}
                className={inputClasses}
                aria-label="Quantity"
            />
            <button
                onClick={handleIncrement}
                disabled={quantity >= max}
                className={cn(buttonClasses, 'rounded-l-none border-l-0')}
                aria-label="Increase quantity"
            >
                <Plus size={size === 'sm' ? 14 : 16} />
            </button>
        </div>
    );
}
