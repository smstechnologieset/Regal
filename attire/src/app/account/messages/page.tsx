"use client";

/**
 * User Messages Page
 *
 * Lists all user conversations with support.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, ChevronRight, Plus, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

interface Conversation {
  id: string;
  subject: string | null;
  service_type: string;
  status: string;
  last_message_at: string;
  created_at: string;
  unread_count?: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      if (!user) return;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });

      if (!error && data) {
        setConversations(data);
      }
      setLoading(false);
    }

    fetchConversations();
  }, [user]);

  const getServiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      attire: "Attire",
      events: "Events",
      bridal: "Bridal",
      catering: "Catering",
      general: "General",
    };
    return labels[type] || type;
  };

  const startNewConversation = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        service_type: "general",
        subject: "New Support Request",
        status: "open",
      })
      .select()
      .single();

    if (!error && data) {
      window.location.href = `/account/messages/${data.id}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Messages</h1>
          <p className="text-slate-600">Chat with our support team</p>
        </div>
        <Button onClick={startNewConversation}>
          <Plus size={18} className="mr-2" />
          New Message
        </Button>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading messages...</p>
          </div>
        ) : conversations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/account/messages/${conv.id}`}
                className="block p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        conv.status === "open" ? "bg-rose-100" : "bg-slate-100"
                      }`}
                    >
                      <MessageSquare
                        size={20}
                        className={
                          conv.status === "open"
                            ? "text-secondary"
                            : "text-slate-400"
                        }
                      />
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {conv.subject || "Support Request"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {getServiceLabel(conv.service_type)} •{" "}
                        {conv.status === "open" ? "Active" : "Closed"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="text-slate-400" size={20} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">
              No messages yet
            </h3>
            <p className="text-slate-500 mb-6">
              Start a conversation with our support team!
            </p>
            <Button onClick={startNewConversation}>
              <Plus size={18} className="mr-2" />
              Start a Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
