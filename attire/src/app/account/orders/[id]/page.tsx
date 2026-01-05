'use client';

/**
 * User Order Detail Page
 * 
 * Shows order details and status timeline.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, Clock, Package, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface Order {
    id: string;
    service_type: string;
    status: string;
    total: number;
    details: Record<string, unknown>;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

const statusSteps = ['pending', 'confirmed', 'in_progress', 'completed'];

export default function UserOrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;
    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            if (!orderId) return;

            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (!error && data) {
                setOrder(data);
            }
            setLoading(false);
        }

        fetchOrder();
    }, [orderId]);

    const getServiceLabel = (type: string) => {
        const labels: Record<string, string> = {
            attire: 'Attire Shop',
            events: 'Event Planning',
            bridal: 'Bridal Services',
            catering: 'Catering',
        };
        return labels[type] || type;
    };

    const getCurrentStep = (status: string) => {
        if (status === 'cancelled') return -1;
        return statusSteps.indexOf(status);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Order not found.</p>
                <Link href="/account/orders" className="text-rose-600 hover:underline mt-2 inline-block">
                    Back to Orders
                </Link>
            </div>
        );
    }

    const currentStep = getCurrentStep(order.status);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/account/orders" className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        Order #{order.id.slice(0, 8)}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {getServiceLabel(order.service_type)} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-6">Order Status</h2>

                {order.status === 'cancelled' ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-red-600" size={32} />
                        </div>
                        <p className="text-lg font-medium text-red-600">Order Cancelled</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200">
                            <div
                                className="h-full bg-rose-600 transition-all duration-500"
                                style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                            />
                        </div>
                        <div className="relative flex justify-between">
                            {statusSteps.map((step, index) => {
                                const isCompleted = index <= currentStep;
                                const isCurrent = index === currentStep;
                                return (
                                    <div key={step} className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${isCompleted
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-slate-200 text-slate-400'
                                            } ${isCurrent ? 'ring-4 ring-rose-100' : ''}`}>
                                            {isCompleted ? <CheckCircle size={20} /> : <Clock size={20} />}
                                        </div>
                                        <p className={`mt-2 text-sm font-medium capitalize ${isCompleted ? 'text-slate-900' : 'text-slate-400'
                                            }`}>
                                            {step.replace('_', ' ')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Order Details */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">Order Details</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">Service</span>
                            <span className="font-medium text-slate-900">{getServiceLabel(order.service_type)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">Order Date</span>
                            <span className="font-medium text-slate-900">
                                {new Date(order.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-600">Last Updated</span>
                            <span className="font-medium text-slate-900">
                                {new Date(order.updated_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-slate-600 text-lg">Total</span>
                            <span className="font-bold text-slate-900 text-lg">${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">Need Help?</h2>
                    <p className="text-slate-600 mb-4">
                        Have questions about your order? Our support team is here to help.
                    </p>
                    <Link href="/account/messages">
                        <Button variant="outline" fullWidth>
                            <MessageSquare size={18} className="mr-2" />
                            Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
