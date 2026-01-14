'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, FileText, CheckCircle } from 'lucide-react';
import ChatInterface from '@/components/events/ChatInterface';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface RequestPageProps {
    params: Promise<{ id: string }>;
}

export default function EventRequestPage({ params }: RequestPageProps) {
    const { id } = use(params);

    // Mock request data
    const request = React.useMemo(() => getMockRequest(id), [id]);

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
                                {request.title}
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                                    Under Review
                                </span>
                            </h1>
                            <p className="text-slate-500 mt-1">Request ID: {request.id}</p>
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
                                    <span className="font-medium text-slate-900">{request.type}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Calendar size={16} /> Date
                                    </span>
                                    <span className="font-medium text-slate-900">{request.date}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Users size={16} /> Guests
                                    </span>
                                    <span className="font-medium text-slate-900">{request.guests}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <DollarSign size={16} /> Budget
                                    </span>
                                    <span className="font-medium text-slate-900">{formatPrice(request.budget)}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-slate-700 mb-2">Description</h3>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                    {request.description}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-rose-600" />
                                Timeline
                            </h2>
                            <div className="space-y-6 relative pl-4 border-l-2 border-slate-100">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-rose-600 border-2 border-white" />
                                    <p className="text-sm font-medium text-slate-900">Request Submitted</p>
                                    <p className="text-xs text-slate-500">Today, 10:30 AM</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
                                    <p className="text-sm font-medium text-slate-900">Review in Progress</p>
                                    <p className="text-xs text-slate-500">Current Status</p>
                                </div>
                                <div className="relative opacity-50">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white" />
                                    <p className="text-sm font-medium text-slate-900">Proposal Ready</p>
                                    <p className="text-xs text-slate-500">Estimated: Tomorrow</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Chat */}
                    <div className="lg:col-span-2">
                        <ChatInterface
                            requestId={request.id}
                            initialMessages={[
                                {
                                    id: '1',
                                    sender: 'admin',
                                    text: `Hello! I'm Sarah, your dedicated event planner at Regal. I've received your request for a ${request.type} event and am currently reviewing the details. I'll have a preliminary proposal ready for you shortly!`,
                                    timestamp: new Date('2025-01-14T09:30:00Z')
                                }
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mock request data creator to avoid impure render
function getMockRequest(id: string) {
    return {
        id,
        type: 'Wedding',
        status: 'reviewing',
        date: '2025-06-15',
        guests: 150,
        budget: 15000,
        title: 'Fairytale Garden Wedding',
        description: 'We want a romantic garden wedding with floral arches, live string quartet, and a gourmet plated dinner. Color palette: Sage green and blush pink.',
        createdAt: new Date('2025-01-01').toISOString(),
    };
}
