'use client';

/**
 * Attire Order Chat Page
 * 
 * Shows the chat window for a specific attire order conversation.
 */

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import ChatWindow from '@/components/chat/ChatWindow';

export default function AttireChatPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                            <MessageCircle size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Order Chat</h1>
                            <p className="text-xs text-slate-500">Real-time support</p>
                        </div>
                    </div>
                </div>

                {/* Chat Window */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 h-[700px]">
                    <ChatWindow conversationId={conversationId} />
                </div>

                {/* Footer Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                        Our admin will respond to your messages as soon as possible.
                    </p>
                </div>
            </div>
        </div>
    );
}
