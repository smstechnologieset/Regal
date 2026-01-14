'use client';

/**
 * Admin Messages Client Component
 * 
 * Lists all customer conversations for admin to manage.
 * Uses secure API endpoints for data fetching.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, ChevronRight, Search, Clock, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Conversation {
    id: string;
    user_id: string;
    subject: string | null;
    service_type: string;
    status: string;
    last_message_at: string;
    created_at: string;
    profiles?: { full_name: string | null };
}

export default function AdminMessagesClient() {
    const { showApiError } = useApp();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        async function fetchConversations() {
            try {
                const params = new URLSearchParams();
                if (statusFilter !== 'all') params.set('status', statusFilter);
                
                const response = await fetch(`/api/admin/conversations?${params.toString()}`);
                
                if (!response.ok) throw response;
                
                const data = await response.json();
                setConversations(data.conversations || []);
            } catch (err) {
                console.error('Error fetching conversations:', err);
                showApiError(err, 'Failed to load conversations');
            } finally {
                setLoading(false);
            }
        }

        fetchConversations();
    }, [statusFilter]);

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = !search ||
            conv.subject?.toLowerCase().includes(search.toLowerCase()) ||
            conv.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getServiceLabel = (type: string) => {
        const labels: Record<string, string> = {
            attire: 'Attire',
            events: 'Events',
            bridal: 'Bridal',
            catering: 'Catering',
            general: 'General',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-slate-600">Manage customer conversations</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by subject or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* Conversations List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
                        <p className="text-slate-500 mt-4">Loading conversations...</p>
                    </div>
                ) : filteredConversations.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredConversations.map((conv) => (
                            <Link
                                key={conv.id}
                                href={`/admin/messages/${conv.id}`}
                                className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${conv.status === 'open' ? 'bg-rose-100' : 'bg-slate-100'
                                        }`}>
                                        <MessageSquare size={20} className={
                                            conv.status === 'open' ? 'text-rose-600' : 'text-slate-400'
                                        } />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {conv.subject || 'Support Request'}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <User size={14} />
                                            {conv.profiles?.full_name || 'Unknown User'}
                                            <span className="text-slate-300">•</span>
                                            {getServiceLabel(conv.service_type)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${conv.status === 'open'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {conv.status}
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(conv.last_message_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <ChevronRight className="text-slate-400" size={20} />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No conversations found.
                    </div>
                )}
            </div>
        </div>
    );
}
