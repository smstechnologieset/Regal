'use client';

/**
 * Newsletter subscription form (client component embedded in the footer).
 */

import React, { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === 'loading') return;

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                setMessage('Thanks for subscribing!');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong. Please try again.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (status !== 'idle') setStatus('idle');
                        }}
                        placeholder="Enter your email"
                        suppressHydrationWarning
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-secondary transition-colors"
                    />
                    <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                </div>
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-3 bg-secondary hover:opacity-90 disabled:opacity-60 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                >
                    {status === 'loading' ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : status === 'success' ? (
                        <Check size={18} />
                    ) : null}
                    Subscribe
                </button>
            </form>
            {message && (
                <p
                    className={`mt-3 text-sm ${status === 'success' ? 'text-sky-300' : 'text-rose-400'}`}
                    role="status"
                >
                    {message}
                </p>
            )}
        </div>
    );
}
