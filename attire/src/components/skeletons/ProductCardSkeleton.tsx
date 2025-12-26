/**
 * ProductCardSkeleton Component
 * 
 * Loading skeleton for ProductCard, shown while products are loading.
 */

import React from 'react';

export default function ProductCardSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-[3/4] rounded-lg bg-slate-200" />

            {/* Content skeleton */}
            <div className="mt-3 space-y-2">
                {/* Rating */}
                <div className="h-4 w-20 bg-slate-200 rounded" />

                {/* Name */}
                <div className="h-5 w-full bg-slate-200 rounded" />
                <div className="h-5 w-3/4 bg-slate-200 rounded" />

                {/* Price */}
                <div className="h-5 w-24 bg-slate-200 rounded" />

                {/* Colors */}
                <div className="flex gap-1 pt-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-slate-200" />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * ProductGrid with skeletons
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}
