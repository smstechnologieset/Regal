'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';

function ResetPasswordContent() {
    const router = useRouter();
    const { addToast } = useApp();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const hasRequestedRef = React.useRef(false);

    // Handle password update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[ResetPassword] Attempting password update...');

        if (isLoading || isSuccess || hasRequestedRef.current) {
            console.log('[ResetPassword] Blocked: already loading, success, or requested.');
            return;
        }

        if (!password || password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');
        hasRequestedRef.current = true;

        try {
            const supabase = getSupabaseClient();
            console.log('[ResetPassword] Calling supabase.auth.updateUser...');

            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            console.log('[ResetPassword] updateResponse received:', { error: updateError?.message || 'none' });

            if (updateError) {
                console.error('[ResetPassword] Update error:', updateError);
                setError(updateError.message);
                setIsLoading(false);
                hasRequestedRef.current = false;
                return;
            }

            console.log('[ResetPassword] Success! Updating state and showing toast.');
            setIsSuccess(true);
            setIsLoading(false);
            addToast('Password updated successfully!', 'success');

            // Redirect to login after a short delay
            setTimeout(() => {
                console.log('[ResetPassword] Redirection timer fired.');
                router.push('/login');
            }, 3000);

        } catch (err: any) {
            console.error('[ResetPassword] Unexpected error during update:', err);
            setError('An unexpected error occurred. Please try again.');
            setIsLoading(false);
            hasRequestedRef.current = false;
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">Password Reset!</h1>
                    <p className="text-slate-600 mb-8">
                        Your password has been successfully updated. You will be redirected to the login page in a few seconds.
                    </p>
                    <Link href="/login">
                        <Button variant="primary" fullWidth>
                            Go to Login
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
                    <h1 className="text-2xl font-bold text-primary mb-2">Set New Password</h1>
                    <p className="text-slate-600">Enter your new secure password below</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="New Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            leftIcon={<Lock size={18} />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />

                        <Input
                            label="Confirm New Password"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            leftIcon={<Lock size={18} />}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isLoading}
                        >
                            Update Password
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
