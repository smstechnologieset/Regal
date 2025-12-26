'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Utensils } from 'lucide-react';
import { cateringPackages } from '@/data/mock/catering';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';

function CateringQuoteForm() {
    const searchParams = useSearchParams();
    const { addToast } = useApp();

    const preselectedPkgId = searchParams.get('package');
    const [selectedPkg, setSelectedPkg] = useState(preselectedPkgId || '');
    const [guests, setGuests] = useState('');
    const [date, setDate] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        venue: '',
        dietary: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoading(false);
        setSuccess(true);
        addToast('Quote request sent!', 'success');
    };

    if (success) {
        return (
            <div className="text-center py-12 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2 font-serif">Request Received</h2>
                <p className="text-slate-600 mb-8">
                    We've received your catering inquiry. Our culinary team will review your requirements and send a customized proposal to your email within 24 hours.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/catering">
                        <Button variant="outline">Back to Catering</Button>
                    </Link>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="grid md:grid-cols-3">
                <div className="bg-slate-900 p-8 text-white">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Utensils size={20} /> Catering Details
                    </h3>
                    <div className="space-y-6 text-slate-300 text-sm">
                        <p>
                            Our catering services start at 10 guests for plated meals and 30 guests for buffets.
                        </p>
                        <div className="p-4 bg-slate-800 rounded-lg">
                            <p className="font-semibold text-white mb-1">Included in Quote:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Food & Beverage</li>
                                <li>Service Staff</li>
                                <li>Tableware & Linens</li>
                                <li>Setup & Cleanup</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 p-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Event Package</label>
                            <select
                                value={selectedPkg}
                                onChange={(e) => setSelectedPkg(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                                <option value="">Custom / No Package</option>
                                {cateringPackages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>{pkg.name} (${pkg.pricePerGuest}/guest)</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Input
                                label="Estimated Guests"
                                type="number"
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                required
                                min={10}
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Event Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-900 pt-4 border-t border-slate-100">Contact & Details</h3>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                required
                            />
                        </div>

                        <Input
                            label="Venue Location"
                            value={formData.venue}
                            onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                            placeholder="Address or Venue Name"
                            required
                        />

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Dietary Restrictions</label>
                            <input
                                type="text"
                                value={formData.dietary}
                                onChange={(e) => setFormData(prev => ({ ...prev, dietary: e.target.value }))}
                                placeholder="e.g. 2 Gluten Free, 1 Vegan"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Additional Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                            />
                        </div>

                        <Button type="submit" fullWidth size="lg" isLoading={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Request Quote
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}

export default function CateringQuotePage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto mb-8 text-center">
                    <Link href="/catering" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4">
                        <ArrowLeft size={20} />
                        Back to Catering
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-serif mb-2">Request a Quote</h1>
                    <p className="text-slate-600">Tell us about your event, and we'll craft the perfect menu.</p>
                </div>

                <Suspense fallback={<div className="text-center py-12">Loading form...</div>}>
                    <CateringQuoteForm />
                </Suspense>
            </div>
        </div>
    );
}
