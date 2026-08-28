'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, FileText, CheckCircle, Loader2 } from 'lucide-react';
import ChatInterface from '@/components/events/ChatInterface';
import { formatPrice } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface RequestPageProps {
    params: Promise<{ id: string }>;
}

interface EventOrder {
    id: string;
    status: string;
    total: number;
    created_at: string;
    details: {
        eventType?: string;
        guestCount?: number;
        budget?: number;
        date?: string;
        features?: string[];
        description?: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        packageId?: string;
    };
}

const STATUS_TIMELINE: Record<string, { label: string; step: number }> = {
    pending:     { label: 'Under Review',    step: 1 },
    confirmed:   { label: 'Confirmed',       step: 2 },
    in_progress: { label: 'In Progress',     step: 3 },
    completed:   { label: 'Completed',       step: 4 },
    cancelled:   { label: 'Cancelled',       step: -1 },
};

const STATUS_COLORS: Record<string, string> = {
    pending:     'bg-amber-100 text-amber-700',
    confirmed:   'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed:   'bg-emerald-100 text-emerald-700',
    cancelled:   'bg-red-100 text-red-700',
};

export default function EventRequestPage({ params }: RequestPageProps) {
    const { id } = use(params);
    const { user } = useAuth();
    const [order, setOrder] = useState<EventOrder | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        async function fetchData() {
            setLoading(true);
            const supabase = getSupabaseClient();

            // Fetch the order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('id, status, total, created_at, details')
                .eq('id', id)
                .single();

            if (orderError || !orderData) {
                setError('Event request not found.');
                setLoading(false);
                return;
            }

            setOrder(orderData as EventOrder);

            // Fetch the associated conversation
            const { data: conv } = await supabase
                .from('conversations')
                .select('id')
                .eq('order_id', id)
                .maybeSingle();

            if (conv) setConversationId(conv.id);

            setLoading(false);
        }

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50 py-8">
                <div className="container mx-auto px-4 text-center py-20">
                    <p className="text-slate-600 text-lg mb-4">{error || 'Request not found.'}</p>
                    <Link href="/events" className="text-rose-600 hover:underline">
                        Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    const details = order.details || {};
    const statusInfo = STATUS_TIMELINE[order.status] || STATUS_TIMELINE.pending;
    const isCancelled = order.status === 'cancelled';
    const formattedDate = details.date
        ? new Date(details.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Flexible';
    const submittedAt = new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const timelineSteps = [
        { label: 'Request Submitted', note: submittedAt, done: true },
        { label: 'Under Review', note: order.status === 'pending' ? 'Current Status' : 'Completed', done: statusInfo.step >= 1, active: order.status === 'pending' },
        { label: 'Confirmed', note: order.status === 'confirmed' ? 'Current Status' : statusInfo.step >= 2 ? 'Completed' : 'Pending', done: statusInfo.step >= 2, active: order.status === 'confirmed' },
        { label: 'In Progress', note: order.status === 'in_progress' ? 'Current Status' : statusInfo.step >= 3 ? 'Completed' : 'Pending', done: statusInfo.step >= 3, active: order.status === 'in_progress' },
        { label: 'Completed', note: order.status === 'completed' ? 'Event complete!' : 'Upcoming', done: order.status === 'completed', active: order.status === 'completed' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/events" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4">
                        <ArrowLeft size={20} />
                        Back to Events
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                {details.eventType
                                    ? `${details.eventType.charAt(0).toUpperCase() + details.eventType.slice(1)} Event Request`
                                    : 'Event Request'}
                                <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </h1>
                            <p className="text-slate-500 mt-1">Request ID: {order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Request Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-rose-600" />
                                Event Details
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <CheckCircle size={16} /> Type
                                    </span>
                                    <span className="font-medium text-slate-900 capitalize">
                                        {details.eventType || '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Calendar size={16} /> Date
                                    </span>
                                    <span className="font-medium text-slate-900 text-right max-w-[170px]">
                                        {formattedDate}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Users size={16} /> Guests
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        {details.guestCount ?? '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <DollarSign size={16} /> Budget
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        {details.budget ? formatPrice(details.budget) : '—'}
                                    </span>
                                </div>
                            </div>

                            {details.features && details.features.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-slate-700 mb-2">Selected Services</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {details.features.map((f, i) => (
                                            <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 text-xs rounded-full font-medium">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {details.description && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium text-slate-700 mb-2">Your Vision</h3>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                        {details.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-rose-600" />
                                Timeline
                            </h2>
                            {isCancelled ? (
                                <div className="text-center py-4">
                                    <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                        This request was cancelled
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-6 relative pl-4 border-l-2 border-slate-100">
                                    {timelineSteps.map((step, i) => (
                                        <div key={i} className={`relative ${!step.done && !step.active ? 'opacity-40' : ''}`}>
                                            <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${step.active ? 'bg-amber-400' : step.done ? 'bg-rose-600' : 'bg-slate-300'}`} />
                                            <p className="text-sm font-medium text-slate-900">{step.label}</p>
                                            <p className="text-xs text-slate-500">{step.note}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat */}
                    <div className="lg:col-span-2">
                        {conversationId ? (
                            <ChatInterface conversationId={conversationId} />
                        ) : (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
                                <p className="text-slate-500">
                                    Your request is being reviewed. A conversation thread will appear here once our team gets in touch.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
