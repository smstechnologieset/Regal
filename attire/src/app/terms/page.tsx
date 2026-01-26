'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function TermsPage() {
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
                <h1 className="text-4xl font-bold text-primary mb-2">Terms of Service</h1>
                <p className="text-slate-500 mb-12">Last Updated: January 26, 2026</p>

                <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using the Regal platform ("Service"), which includes our e-commerce store, event planning services, bridal boutique, and catering, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">2. Account Responsibility</h2>
                        <p>
                            When you create an account with us, you must provide accurate and complete information. You are solely responsible for the activity that occurs on your account and for keeping your account password secure. You must notify Regal immediately of any breach of security or unauthorized use of your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">3. E-Commerce & Payments</h2>
                        <p>
                            All prices for attire and accessories are listed in ETB. We reserve the right to change prices or discontinue products at any time without notice. Payments are processed securely, and you agree to provide valid payment information for all purchases.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">4. Rental Policy (Bridal & Special Items)</h2>
                        <p>
                            Items rented through our Bridal or Special Events service are subject to specific rental periods and condition requirements. Late returns or damage to rented goods will result in additional charges as specified at the time of transaction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">5. Event & Catering Bookings</h2>
                        <p>
                            Inquiries for event planning and catering are subject to availability and formal contract signing. Initial inquiries do not constitute a confirmed booking until a deposit is received and confirmed by our administration.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">6. Intellectual Property</h2>
                        <p>
                            The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Regal and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Regal.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary mb-4">7. Limitation of Liability</h2>
                        <p>
                            In no event shall Regal, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>
                    </section>
                </div>

                {/* Contact Section */}
                <div className="mt-16 p-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-xl font-bold text-primary mb-2">Questions about our Terms?</h3>
                    <p className="text-slate-600 mb-6 font-light">
                        If you have any questions regarding these Terms of Service, please contact our legal team.
                    </p>
                    <Link href="/contact">
                        <Button variant="primary">Contact Legal Support</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
