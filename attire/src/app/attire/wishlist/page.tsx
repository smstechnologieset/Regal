'use client';

/**
 * Wishlist Page
 * 
 * Displays all products saved by the user.
 * Allows users to remove items or add them to the cart.
 */

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';

export default function WishlistPage() {
    const { items, removeFromWishlist, clearWishlist, itemCount, isLoading } = useWishlist();
    const { addToCart, toggleCart } = useCart();
    const { addToast } = useApp();
    const router = useRouter();

    const handleAddToCart = (product: Product) => {
        if (product.sizes && product.sizes.length > 0) {
            addToCart(product, product.sizes[0], product.colors[0], 1);
            addToast(`${product.name} added to cart!`, 'success');
            toggleCart();
        } else {
            router.push(`/attire/products/${product.id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Page Header */}
            <div className="bg-slate-50 border-b border-slate-200">
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-primary">My Wishlist</h1>
                    <p className="text-slate-500 mt-2">
                        {itemCount === 0
                            ? "Your wishlist is empty"
                            : `You have ${itemCount} items in your wishlist`}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart size={32} className="text-slate-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-primary mb-2">Nothing here yet</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Add items you love to your wishlist to keep track of them and buy them later.
                        </p>
                        <Link href="/attire/products">
                            <Button className="flex items-center gap-2 mx-auto">
                                Start Shopping <ArrowRight size={18} />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-semibold text-primary">Saved Items</h2>
                            <button
                                onClick={clearWishlist}
                                className="text-sm text-secondary hover:text-secondary/80 font-medium"
                            >
                                Remove All
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                            {items.map((product) => (
                                <div key={product.id} className="group relative">
                                    <ProductCard
                                        product={product}
                                        onQuickAdd={() => handleAddToCart(product)}
                                    />
                                    <button
                                        onClick={() => removeFromWishlist(product.id)}
                                        className="absolute top-2 left-2 p-2 bg-white/90 text-slate-500 hover:text-secondary rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        aria-label="Remove from wishlist"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Recommendations or Browse Section */}
                {items.length > 0 && (
                    <div className="mt-20 pt-12 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-primary font-serif">Continue Shopping</h2>
                            <Link href="/attire/products" className="text-secondary hover:underline flex items-center gap-1 font-medium">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>
                        {/* You could add a FeaturedProducts component here in the future */}
                    </div>
                )}
            </div>
        </div>
    );
}
