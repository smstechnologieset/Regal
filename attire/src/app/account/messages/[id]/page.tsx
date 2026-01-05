'use client';

/**
 * User Message Detail Page
 * 
 * Shows conversation with admin support.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import ChatWindow from '@/components/chat/ChatWindow';

interface Conversation {
    id: string;
    subject: string | null;
    service_type: string;
    status: string;
    created_at: string;
}

export default function UserMessagePage() {
    const params = useParams();
    const conversationId = params.id as string;
    const { user } = useAuth();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConversation() {
            if (!conversationId) return;

            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (!error && data) {
                setConversation(data);
            }
            setLoading(false);
        }

        fetchConversation();
    }, [conversationId]);

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
                <Link href="/account/messages" className="text-rose-600 hover:underline mt-2 inline-block">
                    Back to Messages
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/account/messages" className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        {conversation.subject || 'Support Request'}
                    </h1>
                    <p className="text-sm text-slate-500 capitalize">
                        {conversation.service_type} • {conversation.status}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <ChatWindow conversationId={conversationId} />
            </div>
        </div>
    );
}
