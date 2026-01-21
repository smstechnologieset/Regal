'use client';

/**
 * Admin Order Detail Page
 * 
 * Shows order details with status management.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Package, User, Calendar, DollarSign, MessageSquare, ShoppingBag, Truck } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';

interface Order {
    id: string;
    user_id: string;
    service_type: string;
    status: string;
    total: number;
    details: any;
    shipping_address?: any;
    notes: string | null;
    created_at: string;
    updated_at: string;
    profiles?: { full_name: string | null; phone: string | null };
}

const statusOptions = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const { addToast } = useApp();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [messaging, setMessaging] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, profiles(full_name, phone)')
                    .eq('id', orderId)
                    .single();

                if (error) {
                    console.error('Error fetching order:', error);
                    addToast(`Failed to load order: ${error.message}`, 'error');
                } else if (data) {
                    setOrder(data);
                }
            } catch (err: any) {
                console.error('Unexpected error in fetchOrder:', err);
                addToast('An unexpected error occurred while loading the order', 'error');
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [orderId, addToast]);

    const updateStatus = async (newStatus: string) => {
        if (!order || order.status === newStatus) return;
        setUpdating(true);

        const activeStatuses = ['confirmed', 'in_progress', 'completed'];
        const wasActive = activeStatuses.includes(order.status);
        const isActive = activeStatuses.includes(newStatus);

        const supabase = getSupabaseClient();

        try {
            // 1. Handle Stock Adjustments
            if (!wasActive && isActive) {
                // Transitioning from Inactive to Active: Decrease Stock
                for (const item of order.details || []) {
                    const productId = item.productId || item.id;
                    if (!productId) continue;

                    const { data: product } = await supabase
                        .from('products')
                        .select('stock_count')
                        .eq('id', productId)
                        .single();

                    if (product) {
                        const newCount = Math.max(0, (product.stock_count || 0) - (item.quantity || 1));
                        await supabase
                            .from('products')
                            .update({
                                stock_count: newCount,
                                in_stock: newCount > 0
                            })
                            .eq('id', productId);
                    }
                }
            } else if (wasActive && !isActive) {
                // Transitioning from Active to Inactive (Cancelled/Pending): Restore Stock
                for (const item of order.details || []) {
                    const productId = item.productId || item.id;
                    if (!productId) continue;

                    const { data: product } = await supabase
                        .from('products')
                        .select('stock_count')
                        .eq('id', productId)
                        .single();

                    if (product) {
                        const newCount = (product.stock_count || 0) + (item.quantity || 1);
                        await supabase
                            .from('products')
                            .update({
                                stock_count: newCount,
                                in_stock: true
                            })
                            .eq('id', productId);
                    }
                }
            }

            // 2. Update Order Status
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (!error) {
                setOrder({ ...order, status: newStatus });
                addToast(`Order status updated to ${newStatus}`, 'success');
            } else {
                addToast('Failed to update status', 'error');
            }
        } catch (err: any) {
            console.error('Error in updateStatus:', err);
            addToast('An error occurred while updating the order', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleMessageCustomer = async () => {
        if (!order) return;
        setMessaging(true);

        try {
            const supabase = getSupabaseClient();

            // 1. Check for existing conversation for this order
            const { data: existingConv } = await supabase
                .from('conversations')
                .select('id')
                .eq('order_id', orderId)
                .maybeSingle();

            if (existingConv) {
                router.push(`/admin/messages/${existingConv.id}`);
                return;
            }

            // 2. If no conversation exists, create a new one
            const items = Array.isArray(order.details) ? order.details : [];
            const firstItemName = items[0]?.productName || items[0]?.product?.name || items[0]?.name || 'Attire Order';
            const displaySubject = items.length > 1
                ? `${firstItemName} +${items.length - 1} more`
                : firstItemName;

            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    user_id: order.user_id,
                    order_id: orderId,
                    service_type: order.service_type,
                    subject: displaySubject,
                    status: 'open'
                })
                .select()
                .single();

            if (createError) throw createError;

            if (newConv) {
                router.push(`/admin/messages/${newConv.id}`);
            }
        } catch (err: any) {
            console.error('Error starting conversation:', err);
            addToast('Failed to start conversation', 'error');
        } finally {
            setMessaging(false);
        }
    };

    const getServiceLabel = (type: string) => {
        const labels: Record<string, string> = {
            attire: 'Attire Shop',
            events: 'Event Planning',
            bridal: 'Bridal Services',
            catering: 'Catering',
        };
        return labels[type] || type;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
            in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200',
        };
        return colors[status] || colors.pending;
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
                <Link href="/admin/orders" className="text-rose-600 hover:underline mt-2 inline-block">
                    Back to Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders" className="text-slate-500 hover:text-slate-900">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Order #{order.id.slice(0, 8)}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {getServiceLabel(order.service_type)}
                        </p>
                    </div>
                </div>
                <span className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <Package size={20} />
                            Order Summary
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500">Service Type</p>
                                    <p className="font-medium text-slate-900">{getServiceLabel(order.service_type)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Order Date</p>
                                    <p className="font-medium text-slate-900">
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500">Last Updated</p>
                                    <p className="font-medium text-slate-900">
                                        {new Date(order.updated_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Amount</p>
                                    <p className="text-2xl font-bold text-slate-900">${order.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <ShoppingBag size={20} />
                            Order Items
                        </h2>
                        <div className="space-y-4">
                            {Array.isArray(order.details) ? (
                                order.details.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-16 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                                                {/* Image would go here if available */}
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <ShoppingBag size={20} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{item.productName || 'Unknown Product'}</p>
                                                <p className="text-sm text-slate-500">
                                                    {item.size && <span>Size: {item.size}</span>}
                                                    {item.color && <span className="ml-3">Color: {item.color}</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-900">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                            <p className="text-sm text-slate-500">{item.quantity || 1} x ${item.price?.toFixed(2) || '0.00'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm">No items found in this order.</p>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shipping_address && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Truck size={20} />
                                Shipping Address
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500">Recipient</p>
                                    <p className="font-medium text-slate-900">{order.shipping_address.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Contact</p>
                                    <p className="font-medium text-slate-900">{order.shipping_address.phone}</p>
                                    <p className="text-slate-500">{order.shipping_address.email}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-slate-500">Address</p>
                                    <p className="font-medium text-slate-900">
                                        {order.shipping_address.address}<br />
                                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}<br />
                                        {order.shipping_address.country}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Update */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-900 mb-4">Update Status</h2>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => updateStatus(status)}
                                    disabled={updating || order.status === status}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${order.status === status
                                        ? getStatusColor(status)
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        } disabled:opacity-50`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <User size={18} />
                            Customer
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Name</p>
                                <p className="font-medium text-slate-900">
                                    {order.profiles?.full_name || order.shipping_address?.fullName || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="font-medium text-slate-900">
                                    {order.profiles?.phone || order.shipping_address?.phone || 'Not provided'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                fullWidth
                                size="sm"
                                onClick={handleMessageCustomer}
                                disabled={messaging}
                            >
                                {messaging ? (
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                ) : (
                                    <MessageSquare size={16} className="mr-2" />
                                )}
                                Message Customer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
