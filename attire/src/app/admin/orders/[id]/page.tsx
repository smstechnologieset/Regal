'use client';

/**
 * Admin Order Detail Page
 * 
 * Shows order details with status management.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Package, User, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';

interface Order {
    id: string;
    user_id: string;
    service_type: string;
    status: string;
    total: number;
    details: Record<string, unknown>;
    notes: string | null;
    created_at: string;
    updated_at: string;
    profiles?: { full_name: string | null; phone: string | null };
}

const statusOptions = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function AdminOrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;
    const { addToast } = useApp();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            if (!orderId) return;

            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('orders')
                .select('*, profiles(full_name, phone)')
                .eq('id', orderId)
                .single();

            if (!error && data) {
                setOrder(data);
            }
            setLoading(false);
        }

        fetchOrder();
    }, [orderId]);

    const updateStatus = async (newStatus: string) => {
        if (!order) return;
        setUpdating(true);

        const supabase = getSupabaseClient();
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

        setUpdating(false);
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
                                    {order.profiles?.full_name || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="font-medium text-slate-900">
                                    {order.profiles?.phone || 'Not provided'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">User ID</p>
                                <p className="font-mono text-sm text-slate-600">
                                    {order.user_id.slice(0, 8)}...
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Button variant="outline" fullWidth size="sm">
                                <MessageSquare size={16} className="mr-2" />
                                Message Customer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
