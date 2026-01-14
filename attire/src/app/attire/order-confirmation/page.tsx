'use client';

/**
 * Order Confirmation Page
 * 
 * Displays order success message and order details after checkout.
 */

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Truck, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId') || 'ORD-XXXXXX';
    const conversationId = searchParams.get('conversationId');

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-lg w-full text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={40} className="text-emerald-600" />
                </div>

                {/* Heading */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    Order Confirmed!
                </h1>
                <p className="text-slate-600 mb-6">
                    Thank you for your order. We&apos;ve received your order and will begin
                    processing it soon.
                </p>

                {/* Order ID */}
                <div className="bg-slate-50 rounded-xl p-6 mb-8">
                    <p className="text-sm text-slate-500 mb-1">Order Number</p>
                    <p className="text-xl font-bold text-slate-900 font-mono">{orderId}</p>
                </div>

                {/* Order Status */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <p className="text-xs text-slate-600">Order Placed</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-full flex items-center justify-center">
                            <Package size={20} className="text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400">Processing</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-full flex items-center justify-center">
                            <Truck size={20} className="text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400">Shipped</p>
                    </div>
                </div>

                {/* Info */}
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-8 bg-blue-50 p-4 rounded-lg">
                    <Mail size={18} className="text-blue-600" />
                    <span>A confirmation email has been sent to your email address.</span>
                </div>

                {/* What's Next */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 text-left">
                    <h2 className="font-semibold text-slate-900 mb-4">What&apos;s Next?</h2>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            <span>You&apos;ll receive an order confirmation email shortly.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            <span>We&apos;ll notify you when your order ships.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            <span>
                                You can chat with our admin directly about this order using the button below.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {conversationId && (
                        <Link href={`/attire/chat/${conversationId}`}>
                            <Button variant="secondary" className="bg-rose-600 hover:bg-rose-700">
                                Chat with Admin
                            </Button>
                        </Link>
                    )}
                    <Link href="/attire/products">
                        <Button variant="outline">Continue Shopping</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline">Back to Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Loading...</div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}
