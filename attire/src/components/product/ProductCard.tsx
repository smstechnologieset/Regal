'use client';

/**
 * ProductCard Component
 * 
 * Displays a product in a card format for listing pages.
 * Features: image with hover zoom, badges, price display, quick add to cart.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Product } from '@/types';
import Badge from '@/components/ui/Badge';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice, calculateDiscount, cn } from '@/lib/utils';

interface ProductCardProps {
    product: Product;
    onQuickAdd?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const isWishlisted = isInWishlist(product.id);

    const discount = product.originalPrice
        ? calculateDiscount(product.originalPrice, product.price)
        : 0;

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onQuickAdd?.(product);
    };

    return (
        <Link href={`/attire/products/${product.id}`} className="group block">
            <div
                className="relative overflow-hidden rounded-lg bg-slate-100"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Aspect ratio container */}
                <div className="aspect-[3/4] relative">
                    {/* Product image */}
                    <Image
                        src={isHovered && product.images[1] ? product.images[1] : product.images[0]}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className={cn(
                            'object-cover transition-all duration-500',
                            isHovered ? 'scale-105' : 'scale-100',
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Skeleton loader */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                    )}

                    {/* Out of stock overlay */}
                    {(!product.inStock || (product.stockCount ?? 0) <= 0) && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Badge type="outOfStock" size="md" />
                        </div>
                    )}

                    {/* Badges */}
                    {product.badges.length > 0 && product.inStock && (
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {product.badges.slice(0, 2).map((badge) => (
                                <Badge key={badge} type={badge} />
                            ))}
                        </div>
                    )}

                    {/* Discount badge */}
                    {discount > 0 && product.inStock && (
                        <div className="absolute top-2 right-2">
                            <span className="bg-secondary text-white text-xs font-bold px-2 py-1 rounded">
                                -{discount}%
                            </span>
                        </div>
                    )}

                    {/* Wishlist button */}
                    <button
                        onClick={handleWishlist}
                        className={cn(
                            'absolute top-2 right-2 p-2 rounded-full transition-all duration-200',
                            discount > 0 ? 'top-10' : 'top-2',
                            isWishlisted
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-secondary',
                            'opacity-0 group-hover:opacity-100'
                        )}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>

                    {/* Quick add button */}
                    {product.inStock && (product.stockCount ?? 0) > 0 && onQuickAdd && (
                        <button
                            onClick={handleQuickAdd}
                            className="absolute bottom-2 left-2 right-2 py-2.5 bg-primary text-white text-sm font-medium rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={16} />
                            Quick Add
                        </button>
                    )}
                </div>
            </div>

            {/* Product info */}
            <div className="mt-3 space-y-1">
                {/* Rating */}
                <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm text-slate-600">
                        {product.rating} ({product.reviewCount})
                    </span>
                </div>

                {/* Name */}
                <h3 className="font-medium text-primary group-hover:text-secondary transition-colors line-clamp-2">
                    {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">
                        {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                        <span className="text-sm text-slate-400 line-through">
                            {formatPrice(product.originalPrice)}
                        </span>
                    )}
                </div>

                {/* Color options preview */}
                {product.colors.length > 1 && (
                    <div className="flex items-center gap-1 pt-1">
                        {product.colors.slice(0, 4).map((color) => (
                            <span
                                key={color.name}
                                className="w-4 h-4 rounded-full border border-slate-200"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            />
                        ))}
                        {product.colors.length > 4 && (
                            <span className="text-xs text-slate-500">
                                +{product.colors.length - 4}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
