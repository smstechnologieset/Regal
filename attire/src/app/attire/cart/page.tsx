"use client";

/**
 * Cart Page
 *
 * Full-page cart view with item list, quantity controls, and checkout button.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import PreOrderBadge from "@/components/attire/PreOrderBadge";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart();
  const { user } = useAuth();

  const subtotal = getCartTotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">
          Your cart is empty
        </h1>
        <p className="text-slate-500 mb-8 text-center">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link href="/attire/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Shopping Cart ({items.length}{" "}
            {items.length === 1 ? "item" : "items"})
          </h1>
          <button
            onClick={clearCart}
            className="text-sm text-slate-500 hover:text-secondary transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                className="bg-white rounded-xl p-4 md:p-6 flex gap-4 md:gap-6"
              >
                {/* Product Image */}
                <Link
                  href={`/products/${item.product.id}`}
                  className="flex-shrink-0 w-24 h-32 md:w-32 md:h-40 rounded-lg overflow-hidden bg-slate-100"
                >
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    width={128}
                    height={160}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="text-lg font-medium text-primary hover:text-secondary transition-colors line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-slate-500 mt-1">
                      Size: {item.selectedSize} | Color:{" "}
                      {item.selectedColor.name}
                    </p>

                    {/* Pre-Order Badge */}
                    {item.isPreorder && (
                      <div className="mt-2">
                        <PreOrderBadge
                          product={item.product}
                          variant="compact"
                        />
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-semibold text-primary">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.originalPrice && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(item.product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.selectedSize,
                            item.selectedColor.name,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-medium">
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
                        className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Line Total & Remove */}
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                      <button
                        onClick={() =>
                          removeFromCart(
                            item.product.id,
                            item.selectedSize,
                            item.selectedColor.name
                          )
                        }
                        className="p-2 text-slate-400 hover:text-secondary transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <Link
              href="/attire/products"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-primary mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 pb-4 border-b border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                {subtotal < 50 && (
                  <p className="text-xs text-emerald-600">
                    Add {formatPrice(50 - subtotal)} more for free shipping!
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-4 mb-6">
                <span className="text-lg font-semibold text-primary">
                  Total
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Button variant="outline" size="md">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={() => {
                  if (!user) {
                    window.location.href = "/login?redirect=/attire/checkout";
                  } else {
                    router.push("/attire/checkout");
                  }
                }}
              >
                Proceed to Checkout
              </Button>

              {/* Payment Methods */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500 mb-3">
                  Secure Payment with
                </p>
                <div className="flex justify-center gap-4 text-slate-400">
                  <span className="text-xs font-medium">VISA</span>
                  <span className="text-xs font-medium">Mastercard</span>
                  <span className="text-xs font-medium">PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
