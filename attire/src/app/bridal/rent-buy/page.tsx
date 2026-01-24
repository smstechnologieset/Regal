'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Calendar, CheckCircle, Clock, ShoppingBag, Banknote } from 'lucide-react';
import { getBridalGownById, getBridalAccessoryById, submitBridalTransaction } from '@/lib/services/bridal';
import { BridalGown } from '@/types';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import Input from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';

function RentBuyForm() {
    const { addToast } = useApp();
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const gownId = searchParams.get('package');
    const accessoryId = searchParams.get('accessory');

    const [item, setItem] = useState<BridalGown | import('@/types').BridalAccessory | null>(null);
    const [itemType, setItemType] = useState<'gown' | 'accessory'>('gown');
    const [loadingItem, setLoadingItem] = useState(true);
    const [selectionType, setSelectionType] = useState<'rent' | 'buy'>('rent');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);

    // Fetch details
    useEffect(() => {
        async function fetchDetails() {
            if (!gownId && !accessoryId) {
                router.push('/bridal');
                return;
            }

            try {
                if (gownId) {
                    const data = await getBridalGownById(gownId);
                    if (!data) throw new Error('Gown not found');
                    setItem(data);
                    setItemType('gown');
                    // If no rent price, default to buy
                    if (data.priceRent === null || data.priceRent === 0) {
                        setSelectionType('buy');
                    }
                } else if (accessoryId) {
                    const data = await getBridalAccessoryById(accessoryId);
                    if (!data) throw new Error('Accessory not found');
                    setItem(data);
                    setItemType('accessory');
                    // If no rent price, default to buy
                    if (data.priceRent === null || data.priceRent === 0) {
                        setSelectionType('buy');
                    }
                }
            } catch (err: any) {
                addToast(err.message, 'error');
                router.push('/bridal');
                return;
            } finally {
                setLoadingItem(false);
            }
        }
        fetchDetails();
    }, [gownId, accessoryId, router, addToast]);

    // Fetch booked slots when date changes (only if renting)
    useEffect(() => {
        async function fetchBookedSlots() {
            if (!date || selectionType !== 'rent') {
                setBookedSlots([]);
                return;
            }

            setFetchingSlots(true);
            try {
                const res = await fetch(`/api/bridal/appointments/booked-slots?date=${date}`);
                const data = await res.json();
                if (data.bookedSlots) {
                    setBookedSlots(data.bookedSlots);
                }
            } catch (error) {
                console.error('Error fetching booked slots:', error);
            } finally {
                setFetchingSlots(false);
            }
        }
        fetchBookedSlots();
    }, [date, selectionType]);

    const timeSlots = ['10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '04:00 PM'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            addToast('Please log in to proceed', 'error');
            const redirectUrl = gownId ? `package=${gownId}` : `accessory=${accessoryId}`;
            router.push(`/login?redirect=/bridal/rent-buy?${redirectUrl}`);
            return;
        }

        if (!item) return;

        if (selectionType === 'rent' && (!date || !time)) {
            addToast('Please select a date and time', 'error');
            return;
        }

        setLoading(true);

        try {
            const result = await submitBridalTransaction({
                userId: user.id,
                itemId: item.id,
                itemName: item.name,
                itemType: itemType,
                transactionType: selectionType,
                price: selectionType === 'rent' ? (item.priceRent || 0) : (item.priceBuy || 0),
                appointmentDate: selectionType === 'rent' ? date : undefined,
                appointmentTime: selectionType === 'rent' ? time : undefined,
                contactName: formData.name,
                contactEmail: formData.email,
                contactPhone: formData.phone,
                notes: formData.notes,
            });

            if (result.success) {
                setSuccess(true);
                addToast(`${selectionType === 'rent' ? 'Rental request' : 'Purchase request'} submitted!`, 'success');
            } else {
                addToast('Failed to submit request. Slot might have been booked.', 'error');
            }
        } catch (error) {
            console.error('Submission failed:', error);
            addToast('An error occurred. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loadingItem) return <div className="py-20 text-center"><Loader /><p className="mt-4 text-slate-500">Loading details...</p></div>;
    if (!item) return null;

    const hasRentPrice = item.priceRent !== null && item.priceRent !== 0;

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary mb-2 font-serif">Request Submitted!</h2>
                    <p className="text-slate-600 mb-8">
                        Thank you, {formData.name}. Your {selectionType} request for <strong>{item.name}</strong> has been received.
                        {selectionType === 'rent' ? (
                            <span> We look forward to seeing you on {new Date(date).toLocaleDateString()} at {time}.</span>
                        ) : (
                            <span> Our team will contact you shortly to finalize your purchase and delivery.</span>
                        )}
                        <br /><br />
                        Check your <strong>Account Messages</strong> for updates.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href={itemType === 'gown' ? "/bridal/gallery" : "/bridal/accessories"}>
                            <Button variant="outline">Back to {itemType === 'gown' ? 'Gallery' : 'Accessories'}</Button>
                        </Link>
                        <Link href="/account/messages">
                            <Button>View Messages</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto mb-8">
                    <Link href={itemType === 'gown' ? "/bridal/gallery" : "/bridal/accessories"} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-4">
                        <ArrowLeft size={20} />
                        Back to {itemType === 'gown' ? 'Gallery' : 'Accessories'}
                    </Link>
                    <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-full md:w-32 h-40 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                                src={item.images[0]}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-primary font-serif mb-1">{item.name}</h1>
                            <p className="text-slate-500 mb-4">
                                {itemType === 'gown'
                                    ? `${(item as BridalGown).designer} • ${(item as BridalGown).style} • ${(item as BridalGown).silhouette}`
                                    : `${(item as import('@/types').BridalAccessory).category}`}
                            </p>
                            <div className="flex gap-6">
                                {hasRentPrice && (
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Rent Price</p>
                                        <p className="text-xl font-bold text-secondary">{formatPrice(item.priceRent || 0)}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Buy Price</p>
                                    <p className="text-xl font-bold text-primary">{formatPrice(item.priceBuy || 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="grid md:grid-cols-3">
                        {/* Option Selection Sidebar */}
                        <div className="bg-slate-50 p-8 border-r border-slate-100">
                            <h3 className="font-bold text-primary mb-6">Choose Your Option</h3>
                            <div className="space-y-4">
                                {hasRentPrice && (
                                    <button
                                        onClick={() => setSelectionType('rent')}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectionType === 'rent'
                                            ? 'border-secondary bg-white shadow-md'
                                            : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-1">
                                            <Calendar size={18} className={selectionType === 'rent' ? 'text-secondary' : 'text-slate-400'} />
                                            <span className={`font-bold ${selectionType === 'rent' ? 'text-primary' : 'text-slate-600'}`}>Rent</span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {itemType === 'gown'
                                                ? 'Includes a private fitting appointment and cleaning services.'
                                                : 'Rent this item for your special day at a fraction of the cost.'}
                                        </p>
                                    </button>
                                )}

                                <button
                                    onClick={() => setSelectionType('buy')}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectionType === 'buy'
                                        ? 'border-primary bg-white shadow-md'
                                        : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <ShoppingBag size={18} className={selectionType === 'buy' ? 'text-primary' : 'text-slate-400'} />
                                        <span className={`font-bold ${selectionType === 'buy' ? 'text-primary' : 'text-slate-600'}`}>Buy</span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {itemType === 'gown'
                                            ? 'Own your dream gown forever. New and tailored to your preference.'
                                            : 'Purchase this accessory to complete your forever look.'}
                                    </p>
                                </button>

                                {!hasRentPrice && (
                                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                        <p className="text-[10px] text-amber-700 font-medium">Rental is not available for this specific item.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 p-4 bg-emerald-50 rounded-lg">
                                <p className="text-xs text-emerald-800 font-bold mb-1 uppercase">Price Breakdown</p>
                                <div className="flex justify-between items-end">
                                    <span className="text-sm text-emerald-700">Total Due</span>
                                    <span className="text-2xl font-bold text-emerald-900">{formatPrice(selectionType === 'rent' ? (item.priceRent || 0) : (item.priceBuy || 0))}</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Form */}
                        <div className="md:col-span-2 p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {selectionType === 'rent' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <h3 className="font-bold text-primary flex items-center gap-2">
                                            <Clock size={20} className="text-secondary" />
                                            Schedule {itemType === 'gown' ? 'Your Fitting' : 'Pickup'}
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Date</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-secondary outline-none"
                                                    required={selectionType === 'rent'}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time</label>
                                                <div className="relative">
                                                    <select
                                                        value={time}
                                                        onChange={(e) => setTime(e.target.value)}
                                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-secondary outline-none appearance-none disabled:bg-slate-50"
                                                        required={selectionType === 'rent'}
                                                        disabled={!date || fetchingSlots}
                                                    >
                                                        <option value="">{fetchingSlots ? 'Checking slots...' : 'Select Time'}</option>
                                                        {timeSlots.map(t => {
                                                            const isBooked = bookedSlots.includes(t);
                                                            return (
                                                                <option key={t} value={t} disabled={isBooked}>
                                                                    {t} {isBooked ? '(Booked)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectionType === 'buy' && (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 animate-fade-in">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> Since you are purchasing this {itemType}, a fitting appointment is not required.
                                            Our bridal team will contact you to discuss details and delivery options via our secure chat.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Contact Information</h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Full Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Jane Doe"
                                            required
                                        />
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="jane@example.com"
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Phone Number"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+251 ..."
                                        required
                                    />
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">Special Instructions / Notes</label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-secondary outline-none resize-none"
                                            placeholder="Tell us about your preferences..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" fullWidth size="lg" isLoading={loading} variant={selectionType === 'rent' ? 'secondary' : 'primary'}>
                                        {selectionType === 'rent' ? (itemType === 'gown' ? 'Book Rental Fitting' : 'Book Rental Pickup') : 'Confirm Purchase Request'}
                                    </Button>
                                    <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                                        <Banknote size={14} />
                                        Secure Cash on Delivery / Bank Transfer options available
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RentBuyPage() {
    return (
        <Suspense fallback={<div className="py-20 text-center"><Loader /></div>}>
            <RentBuyForm />
        </Suspense>
    );
}
