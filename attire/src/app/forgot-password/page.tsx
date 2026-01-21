'use client';

/**
 * Forgot Password Page
 * 
 * Sends password reset email via Supabase Auth.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Email is required');
            return;
        }

        setIsLoading(true);
        setError('');

        const supabase = getSupabaseClient();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
            setIsLoading(false);
            return;
        }

        setSuccess(true);
        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">Check Your Email</h1>
                    <p className="text-slate-600 mb-8">
                        We&apos;ve sent a password reset link to <strong>{email}</strong>.
                        Please check your inbox and follow the instructions.
                    </p>
                    <Link href="/login">
                        <Button variant="outline">
                            <ArrowLeft size={18} className="mr-2" />
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-2">
                        <span className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                            REGAL
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-primary mb-2">Reset Password</h1>
                    <p className="text-slate-600">Enter your email and we&apos;ll send you a reset link</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            error={error}
                            placeholder="you@example.com"
                            leftIcon={<Mail size={18} />}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isLoading}
                        >
                            Send Reset Link
                        </Button>
                    </form>
                </div>

                {/* Back to Login */}
                <p className="text-center mt-6">
                    <Link href="/login" className="text-slate-600 hover:text-primary flex items-center justify-center gap-2">
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
