'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Loader2, Gift, CheckCircle2 } from 'lucide-react';
import { GiftPackage } from '@/lib/services/gifts';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface OrderModalProps {
    pkg: GiftPackage;
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderModal({ pkg, isOpen, onClose }: OrderModalProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { addToast } = useApp();
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            addToast('Please login to place an order', 'warning');
            router.push(`/login?redirect=/gifts/${pkg.id}`);
            return;
        }

        setSubmitting(true);
        try {
            const supabase = createClient();

            // 1. Create the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    service_type: 'gifts',
                    status: 'pending',
                    total: pkg.price,
                    notes: notes,
                    details: {
                        package_id: pkg.id,
                        package_name: pkg.name,
                        package_category: pkg.category,
                        price: pkg.price
                    }
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create the conversation
            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    user_id: user.id,
                    service_type: 'gifts',
                    order_id: order.id,
                    subject: `Order for ${pkg.name}`,
                    status: 'open'
                })
                .select()
                .single();

            if (convError) throw convError;

            // 3. Send the initial message
            const initialMessage = `Hello! I would like to order the ${pkg.name} package. \n\nNotes: ${notes || 'No extra notes provided.'}`;
            
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversation.id,
                    sender_id: user.id,
                    content: initialMessage
                });

            if (msgError) throw msgError;

            setSuccess(true);
            addToast('Order placed successfully!', 'success');
            
            // Redirect to chat after a brief delay
            setTimeout(() => {
                router.push(`/account/messages/${conversation.id}`);
            }, 2000);

        } catch (error: any) {
            console.error('Error placing gift order:', error);
            addToast(error.message || 'Failed to place order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                {success ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Confirmed!</h2>
                        <p className="text-slate-500 mb-8">
                            We've received your request for the <strong>{pkg.name}</strong>. 
                            Redirecting you to our chat where a specialist will assist you...
                        </p>
                        <Loader2 className="mx-auto text-emerald-500 animate-spin" size={32} />
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-purple-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                    <Gift size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Complete Your Order</h2>
                                    <p className="text-xs text-slate-500">A specialist will contact you shortly</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Summary */}
                            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={pkg.image || ''} alt={pkg.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{pkg.name}</h4>
                                        <p className="text-xs text-slate-500">{pkg.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</p>
                                    <p className="text-xl font-black text-purple-600">{formatPrice(pkg.price)}</p>
                                </div>
                            </div>

                            {/* Message/Notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <span>Special Requests or Notes</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-normal uppercase">Optional</span>
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Tell us about the recipient, delivery preferences, or any custom additions you'd like..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Footer */}
                            <div className="pt-2 flex flex-col gap-3">
                                <Button 
                                    type="submit" 
                                    fullWidth 
                                    size="lg" 
                                    className="bg-purple-600 hover:bg-purple-700 h-14 text-base rounded-2xl shadow-xl shadow-purple-200"
                                    disabled={submitting}
                                    leftIcon={submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                >
                                    {submitting ? 'Placing Order...' : 'Confirm & Start Chat'}
                                </Button>
                                <p className="text-[11px] text-center text-slate-400 px-4">
                                    By clicking confirm, you agree to start a conversation with our gift specialists. 
                                    Final payment details will be discussed in the chat.
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
