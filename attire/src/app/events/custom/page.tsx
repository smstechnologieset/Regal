'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { eventTypes, commonFeatures } from '@/data/mock/events';
import { getEventPackages, submitEventRequest } from '@/lib/services/events';
import { EventPackage } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

function CustomEventForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useApp();
    const { user } = useAuth();

    const packageId = searchParams.get('package');
    const [packages, setPackages] = useState<EventPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<EventPackage | null>(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        eventType: '',
        guestCount: '' as string | number,
        budget: '' as string | number,
        date: '',
        description: '',
        features: [] as string[],
        name: '',
        email: '',
        phone: '',
    });

    // Fetch packages and set selected if packageId exists
    useEffect(() => {
        async function fetchPackages() {
            const data = await getEventPackages();
            setPackages(data);
            if (packageId) {
                const pkg = data.find(p => p.id === packageId);
                if (pkg) {
                    setSelectedPackage(pkg);
                    setFormData(prev => ({
                        ...prev,
                        eventType: pkg.type,
                        guestCount: pkg.capacity ? parseInt(pkg.capacity.match(/\d+/)?.[0] || '50') : '',
                        budget: pkg.priceStart,
                        features: [...pkg.features],
                    }));
                }
            }
        }
        fetchPackages();
    }, [packageId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleFeature = (feature: string) => {
        setFormData(prev => {
            const features = prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature];
            return { ...prev, features };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        if (!user) {
            addToast('Please log in to submit a request', 'error');
            router.push('/login?redirect=/events/custom');
            return;
        }

        setLoading(true);

        try {
            const result = await submitEventRequest({
                userId: user.id,
                packageId: selectedPackage?.id,
                eventType: formData.eventType,
                guestCount: Number(formData.guestCount) || 0,
                budget: Number(formData.budget) || 0,
                date: formData.date,
                features: formData.features,
                description: formData.description,
                contactName: formData.name,
                contactEmail: formData.email,
                contactPhone: formData.phone,
            });

            if (result.success) {
                addToast('Request submitted successfully!', 'success');
                router.push(`/dashboard/orders`);
            } else {
                addToast('Failed to submit request. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Event request failed:', error);
            addToast('Failed to submit request. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            {/* Progress Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-500 mb-2">
                    <span className={step >= 1 ? 'text-rose-600' : ''}>Event Details</span>
                    <span className={step >= 2 ? 'text-rose-600' : ''}>Preferences</span>
                    <span className={step >= 3 ? 'text-rose-600' : ''}>Contact Info</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-rose-600 transition-all duration-300 ease-out"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-900">Tell us about your event</h2>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Event Type</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {eventTypes.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, eventType: type.value }))}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${formData.eventType === type.value
                                            ? 'border-rose-600 bg-rose-50 text-rose-700'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, eventType: 'custom' }))}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${formData.eventType === 'custom'
                                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    Custom / Other
                                </button>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Approx. Guest Count</label>
                                <input
                                    type="number"
                                    name="guestCount"
                                    value={formData.guestCount}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 100"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Budget Range ($)</label>
                                <input
                                    type="number"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 5000"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Preferred Date (Optional)</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-900">Customize your experience</h2>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700">Select Services Needed</label>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {commonFeatures.map(feature => (
                                    <label
                                        key={feature.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.features.includes(feature.label)
                                            ? 'border-rose-600 bg-rose-50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.features.includes(feature.label)}
                                            onChange={() => toggleFeature(feature.label)}
                                            className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Additional Details & Vision</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Describe your dream event... (theme, colors, mood)"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-900">Contact Information</h2>

                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="John Doe"
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="john@example.com"
                            />
                            <Input
                                label="Phone Number"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                            <p>
                                By submitting this form, you agree to our terms of service. Our team will contact you within 24 hours to discuss your proposal.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex gap-3 pt-6 border-t border-slate-100">
                    {step > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                            disabled={loading}
                            className="px-8"
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={loading}
                    >
                        {step === 3 ? 'Submit Request' : 'Continue'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function CustomEventPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 md:py-20">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <Link href="/events" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4">
                        <ArrowLeft size={20} />
                        Back to Events
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">
                        Plan Your Custom Event
                    </h1>
                    <p className="text-center text-slate-600 mt-2">
                        Tell us your vision, and we&apos;ll make it happen.
                    </p>
                </div>

                <Suspense fallback={<div className="text-center py-10">Loading form...</div>}>
                    <CustomEventForm />
                </Suspense>
            </div>
        </div>
    );
}
