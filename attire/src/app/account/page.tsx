'use client';

/**
 * Account Overview Page
 * 
 * Main dashboard for user account.
 * Shows profile summary, recent orders, and quick actions.
 */

import React from 'react';
import Link from 'next/link';
import { Package, MessageSquare, Settings, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function AccountPage() {
    const { profile, user } = useAuth();

    // Mock recent orders (will be replaced with real data)
    const recentOrders = [
        { id: 'ORD-001', service: 'Attire', status: 'completed', date: '2024-01-15', total: 299.99 },
        { id: 'ORD-002', service: 'Events', status: 'in_progress', date: '2024-01-20', total: 1500 },
    ];

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700',
            confirmed: 'bg-blue-100 text-blue-700',
            in_progress: 'bg-purple-100 text-purple-700',
            completed: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return styles[status as keyof typeof styles] || styles.pending;
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-slate-600">
                    Manage your orders, messages, and account settings from here.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Link href="/account/orders" className="group">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-rose-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <Package className="text-rose-600" size={24} />
                            <ChevronRight className="text-slate-400 group-hover:text-rose-600 transition-colors" size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-900">My Orders</h3>
                        <p className="text-sm text-slate-500">View order history</p>
                    </div>
                </Link>

                <Link href="/account/messages" className="group">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-rose-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <MessageSquare className="text-rose-600" size={24} />
                            <ChevronRight className="text-slate-400 group-hover:text-rose-600 transition-colors" size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-900">Messages</h3>
                        <p className="text-sm text-slate-500">Chat with support</p>
                    </div>
                </Link>

                <Link href="/account/settings" className="group">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-rose-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <Settings className="text-rose-600" size={24} />
                            <ChevronRight className="text-slate-400 group-hover:text-rose-600 transition-colors" size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-900">Settings</h3>
                        <p className="text-sm text-slate-500">Manage your account</p>
                    </div>
                </Link>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
                    <Link href="/account/orders" className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                        View All
                    </Link>
                </div>

                {recentOrders.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {recentOrders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/account/orders/${order.id}`}
                                className="block p-5 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            {order.status === 'completed' ? (
                                                <CheckCircle size={20} className="text-emerald-600" />
                                            ) : (
                                                <Clock size={20} className="text-amber-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{order.id}</p>
                                            <p className="text-sm text-slate-500">{order.service} • {order.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-slate-900">${order.total.toFixed(2)}</p>
                                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadge(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <Package size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
                        <p className="text-slate-500 mb-4">Start exploring our services!</p>
                        <Link href="/">
                            <Button>Browse Services</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Profile Completion */}
            {(!profile?.phone || !profile?.avatar_url) && (
                <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-2xl border border-rose-100 p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Complete Your Profile</h3>
                    <p className="text-slate-600 mb-4">
                        Add your phone number and profile photo for a better experience.
                    </p>
                    <Link href="/account/settings">
                        <Button size="sm" variant="outline">
                            Update Profile
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
