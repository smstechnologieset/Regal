'use client';

/**
 * Admin Orders Management - Client Component
 * 
 * Lists all orders with filtering by service and status.
 * Uses secure API endpoints for data fetching.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, ChevronRight, Package, ShoppingBag, Calendar, Heart, UtensilsCrossed } from 'lucide-react';

interface Order {
    id: string;
    user_id: string;
    service_type: string;
    status: string;
    total: number;
    created_at: string;
    profiles?: { full_name: string | null };
}

export default function AdminOrdersClient() {
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [serviceFilter, setServiceFilter] = useState(searchParams.get('service') || 'all');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

    useEffect(() => {
        async function fetchOrders() {
            try {
                const params = new URLSearchParams();
                if (serviceFilter !== 'all') params.set('service', serviceFilter);
                if (statusFilter !== 'all') params.set('status', statusFilter);
                
                const response = await fetch(`/api/admin/orders?${params.toString()}`);
                
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to fetch orders');
                }
                
                const data = await response.json();
                setOrders(data.orders || []);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err instanceof Error ? err.message : 'Failed to load orders');
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [serviceFilter, statusFilter]);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = !search ||
            order.id.toLowerCase().includes(search.toLowerCase()) ||
            order.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
        const matchesService = serviceFilter === 'all' || order.service_type === serviceFilter;
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesService && matchesStatus;
    });

    const getServiceIcon = (type: string) => {
        switch (type) {
            case 'attire': return <ShoppingBag size={16} />;
            case 'events': return <Calendar size={16} />;
            case 'bridal': return <Heart size={16} />;
            case 'catering': return <UtensilsCrossed size={16} />;
            default: return <Package size={16} />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            confirmed: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-purple-100 text-purple-700',
            completed: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return styles[status] || styles.pending;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
                <p className="text-slate-600">Manage all customer orders</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Services</option>
                        <option value="attire">Attire</option>
                        <option value="events">Events</option>
                        <option value="bridal">Bridal</option>
                        <option value="catering">Catering</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
                        <p className="text-slate-500 mt-4">Loading orders...</p>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Order</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Customer</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Service</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Total</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Date</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">#{order.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {order.profiles?.full_name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 text-slate-600 capitalize">
                                                {getServiceIcon(order.service_type)}
                                                {order.service_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            ${order.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-rose-600 hover:text-rose-700"
                                            >
                                                <ChevronRight size={20} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No orders found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
