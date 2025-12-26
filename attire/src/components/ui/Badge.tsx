/**
 * Badge Component
 * 
 * Product badges for NEW, SALE, BESTSELLER, LIMITED, OUT OF STOCK labels.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ProductBadge } from '@/types';

interface BadgeProps {
    type: ProductBadge | 'outOfStock';
    size?: 'sm' | 'md';
    className?: string;
}

const badgeStyles: Record<string, string> = {
    new: 'bg-emerald-500 text-white',
    sale: 'bg-rose-600 text-white',
    bestseller: 'bg-amber-500 text-white',
    limited: 'bg-purple-600 text-white',
    outOfStock: 'bg-slate-500 text-white',
};

const badgeLabels: Record<string, string> = {
    new: 'NEW',
    sale: 'SALE',
    bestseller: 'BESTSELLER',
    limited: 'LIMITED',
    outOfStock: 'OUT OF STOCK',
};

const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
};

export default function Badge({ type, size = 'sm', className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-block font-semibold uppercase tracking-wider rounded',
                badgeStyles[type],
                sizeStyles[size],
                className
            )}
        >
            {badgeLabels[type]}
        </span>
    );
}
