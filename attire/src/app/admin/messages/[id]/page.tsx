'use client';

/**
 * Admin Message Detail Page
 * 
 * Shows conversation with customer for admin to respond.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, User, Package, XCircle, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import ChatWindow from '@/components/chat/ChatWindow';
import Button from '@/components/ui/Button';

interface Conversation {
    id: string;
    user_id: string;
    subject: string | null;
    service_type: string;
    status: string;
    order_id: string | null;
    created_at: string;
    profiles?: { full_name: string | null };
}

export default function AdminMessagePage() {
    const params = useParams();
    const conversationId = params.id as string;
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConversation() {
            if (!conversationId) return;

            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('conversations')
                .select('*, profiles(full_name)')
                .eq('id', conversationId)
                .single();

            if (!error && data) {
                setConversation(data);
            }
            setLoading(false);
        }

        fetchConversation();
    }, [conversationId]);

    const toggleStatus = async () => {
        if (!conversation) return;

        const newStatus = conversation.status === 'open' ? 'closed' : 'open';
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('conversations')
            .update({ status: newStatus })
            .eq('id', conversationId);

        if (!error) {
            setConversation({ ...conversation, status: newStatus });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Conversation not found.</p>
                <Link href="/admin/messages" className="text-rose-600 hover:underline mt-2 inline-block">
                    Back to Messages
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/messages" className="text-slate-500 hover:text-slate-900">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {conversation.subject || 'Support Request'}
                        </h1>
                        <p className="text-sm text-slate-500 capitalize">
                            {conversation.service_type}
                        </p>
                    </div>
                </div>
                <Button
                    variant={conversation.status === 'open' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={toggleStatus}
                >
                    {conversation.status === 'open' ? (
                        <>
                            <XCircle size={16} className="mr-2" />
                            Close Ticket
                        </>
                    ) : (
                        <>
                            <CheckCircle size={16} className="mr-2" />
                            Reopen Ticket
                        </>
                    )}
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Chat */}
                <div className="lg:col-span-2">
                    <ChatWindow conversationId={conversationId} isAdmin />
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
                                    {conversation.profiles?.full_name || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">User ID</p>
                                <p className="font-mono text-sm text-slate-600">
                                    {conversation.user_id.slice(0, 8)}...
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conversation Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Package size={18} />
                            Details
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${conversation.status === 'open'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {conversation.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Created</p>
                                <p className="text-sm text-slate-600">
                                    {new Date(conversation.created_at).toLocaleString()}
                                </p>
                            </div>
                            {conversation.order_id && (
                                <div>
                                    <p className="text-xs text-slate-500">Related Order</p>
                                    <Link
                                        href={`/admin/orders/${conversation.order_id}`}
                                        className="text-sm text-rose-600 hover:underline"
                                    >
                                        View Order →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
