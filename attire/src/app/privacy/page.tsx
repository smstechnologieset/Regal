'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="py-8 border-b border-slate-100 mb-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold tracking-tight text-secondary">
                            REGAL
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <ChevronLeft size={16} /> Back to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 pb-20 max-w-4xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <Lock size={20} className="text-secondary" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary">Privacy Policy</h1>
                </div>
                <p className="text-slate-500 mb-12">Last Updated: January 26, 2026</p>

                <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">1. Information We Collect</h2>
                        <p>
                            We collect information that you provide directly to us when you create an account, make a purchase, schedule an appointment, or contact our support team. This may include:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-500">
                            <li>Name, email address, and phone number</li>
                            <li>Shipping and billing addresses</li>
                            <li>Payment information (processed securely via third-party providers)</li>
                            <li>Appointment dates and event preferences</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">2. How We Use Your Information</h2>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-500">
                            <li>Process and fulfill your attire orders</li>
                            <li>Manage your bridal appointments and event inquiries</li>
                            <li>Communicate about your account or orders</li>
                            <li>Send promotional emails (only if you opt-in)</li>
                            <li>Improve our platform security and performance</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">3. Information Sharing</h2>
                        <p>
                            Regal does not sell or rent your personal information to third parties. We only share information with partners essential to providing our services, such as:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-500">
                            <li>Payment processors (to securely handle transactions)</li>
                            <li>Shipping carriers (to deliver your products)</li>
                            <li>Supabase (our secure database provider)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">4. Data Security</h2>
                        <p>
                            We implement a variety of security measures to maintain the safety of your personal information. Your data is stored in secure databases protected by Row-Level Security (RLS), ensuring that only you (and authorized administrators) can access your specific data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">5. Your Rights</h2>
                        <p>
                            You have the right to request access to the personal data we hold about you, to request that we correct any inaccuracies, and to request the deletion of your account and associated data. You can manage most of this directly through your Account Settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">6. Cookies</h2>
                        <p>
                            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                        </p>
                    </section>
                </div>

                {/* Footer Section */}
                <div className="mt-16 p-8 bg-slate-50 rounded-2xl border border-slate-100 italic">
                    <p className="text-slate-600 font-light">
                        This privacy policy is subject to change as our platform evolves. We will notify registered users of any significant changes via email or platform notifications.
                    </p>
                </div>
            </main>
        </div>
    );
}
