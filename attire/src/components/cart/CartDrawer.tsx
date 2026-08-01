'use client';

/**
 * CartDrawer Component
 * 
 * Slide-out cart drawer that displays cart items and summary.
 * Appears when cart icon is clicked.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice, cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function CartDrawer() {
    const {
        items,
        isOpen,
        closeCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartItemCount,
    } = useCart();

    const itemCount = getCartItemCount();
    const total = getCartTotal();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} />
                        <h2 className="text-lg font-semibold">
                            Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                        </h2>
                    </div>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cart items */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <ShoppingBag size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-primary mb-2">
                            Your cart is empty
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Looks like you haven&apos;t added anything to your cart yet.
                        </p>
                        <Button onClick={closeCart}>Continue Shopping</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {items.map((item) => (
                                <div
                                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                                    className="flex gap-4 p-3 bg-slate-50 rounded-lg"
                                >
                                    {/* Product image */}
                                    <Link
                                        href={`/attire/products/${item.product.id}`}
                                        onClick={closeCart}
                                        className="flex-shrink-0 w-20 h-24 rounded-md overflow-hidden bg-white"
                                    >
                                        <Image
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            width={80}
                                            height={96}
                                            unoptimized
                                            className="w-full h-full object-cover"
                                        />
                                    </Link>

                                    {/* Product details */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/attire/products/${item.product.id}`}
                                            onClick={closeCart}
                                            className="font-medium text-primary hover:text-secondary line-clamp-2 transition-colors"
                                        >
                                            {item.product.name}
                                        </Link>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {item.selectedSize} / {item.selectedColor.name}
                                        </p>
                                        <p className="font-semibold text-primary mt-1">
                                            {formatPrice(item.product.price)}
                                        </p>

                                        {/* Quantity controls */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.product.id,
                                                            item.selectedSize,
                                                            item.selectedColor.name,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                    className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.product.id,
                                                            item.selectedSize,
                                                            item.selectedColor.name,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                    className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    removeFromCart(
                                                        item.product.id,
                                                        item.selectedSize,
                                                        item.selectedColor.name
                                                    )
                                                }
                                                className="p-1.5 text-slate-400 hover:text-secondary transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer with totals */}
                        <div className="p-4 border-t border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Subtotal</span>
                                <span className="font-semibold text-primary">
                                    {formatPrice(total)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500">
                                Shipping and taxes calculated at checkout.
                            </p>
                            <div className="grid gap-2">
                                <Link href="/attire/checkout" onClick={closeCart}>
                                    <Button fullWidth variant="secondary">
                                        Checkout
                                    </Button>
                                </Link>
                                <Link href="/attire/cart" onClick={closeCart}>
                                    <Button fullWidth variant="outline">
                                        View Cart
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
