'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle, Clock } from 'lucide-react';
import { getBridalServices, bookBridalAppointment } from '@/lib/services/bridal';
import { BridalService } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export default function BridalAppointmentPage() {
    const { addToast } = useApp();
    const { user } = useAuth();
    const router = useRouter();

    const [services, setServices] = useState<BridalService[]>([]);
    const [selectedService, setSelectedService] = useState('');
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
    const [loadingServices, setLoadingServices] = useState(true);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);

    // Fetch services from database
    useEffect(() => {
        async function fetchServices() {
            const data = await getBridalServices();
            setServices(data);
            setLoadingServices(false);
        }
        fetchServices();
    }, []);

    // Fetch booked slots when date changes
    useEffect(() => {
        async function fetchBookedSlots() {
            if (!date) {
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
    }, [date]);

    // Mock time slots
    const timeSlots = ['10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '04:00 PM'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            addToast('Please log in to book an appointment', 'error');
            router.push('/login?redirect=/bridal/appointments');
            return;
        }

        const service = services.find(s => s.id === selectedService);
        if (!service) {
            addToast('Please select a service', 'error');
            return;
        }

        setLoading(true);

        try {
            const result = await bookBridalAppointment({
                userId: user.id,
                serviceId: selectedService,
                serviceTitle: service.title,
                appointmentDate: date,
                appointmentTime: time,
                contactName: formData.name,
                contactEmail: formData.email,
                contactPhone: formData.phone,
                notes: formData.notes,
            });

            if (result.success) {
                setSuccess(true);
                addToast('Appointment booked successfully!', 'success');
            } else {
                addToast('Failed to book appointment. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Booking failed:', error);
            addToast('Failed to book appointment. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-secondary" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary mb-2 font-serif">Appointment Confirmed!</h2>
                    <p className="text-slate-600 mb-8">
                        Thank you, {formData.name}. We look forward to seeing you on {new Date(date).toLocaleDateString()} at {time}.
                        A confirmation email has been sent to {formData.email}.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/bridal">
                            <Button variant="outline">Return to Bridal</Button>
                        </Link>
                        <Link href="/">
                            <Button>Go Home</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto mb-8">
                    <Link href="/bridal" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-4">
                        <ArrowLeft size={20} />
                        Back to Bridal
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary font-serif mb-2">Book an Appointment</h1>
                    <p className="text-slate-600">Schedule your private consultation with our bridal experts.</p>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="grid md:grid-cols-3">
                        {/* Sidebar / Info */}
                        <div className="bg-rose-50 p-8">
                            <h3 className="font-bold text-rose-900 mb-4">Why Book With Us?</h3>
                            <ul className="space-y-3 text-sm text-rose-800">
                                <li className="flex gap-2"><CheckCircle size={16} /> Private styling suites</li>
                                <li className="flex gap-2"><CheckCircle size={16} /> Expert consultants</li>
                                <li className="flex gap-2"><CheckCircle size={16} /> Complimentary champagne</li>
                                <li className="flex gap-2"><CheckCircle size={16} /> Full collection access</li>
                            </ul>
                            <div className="mt-8 p-4 bg-white/50 rounded-lg">
                                <p className="text-xs text-rose-900 font-semibold mb-1">OPENING HOURS</p>
                                <p className="text-sm text-rose-800">Mon-Sun: 10AM - 7PM</p>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="md:col-span-2 p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Service Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Select Service</label>
                                    <div className="grid gap-3">
                                        {loadingServices ? (
                                            <div className="text-center py-4 text-slate-500">Loading services...</div>
                                        ) : services.map((service: BridalService) => (
                                            <label
                                                key={service.id}
                                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedService === service.id
                                                    ? 'border-rose-600 bg-rose-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="service"
                                                    value={service.id}
                                                    checked={selectedService === service.id}
                                                    onChange={(e) => setSelectedService(e.target.value)}
                                                    className="mt-1 w-4 h-4 text-secondary border-slate-300 focus:ring-rose-500"
                                                    required
                                                />
                                                <div>
                                                    <div className="font-medium text-primary">{service.title}</div>
                                                    <div className="text-xs text-slate-500">{service.duration} • Starts at ${service.priceStart}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Date</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time</label>
                                        <div className="relative">
                                            <select
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none appearance-none disabled:bg-slate-50 disabled:text-slate-400"
                                                required
                                                disabled={!date || fetchingSlots}
                                            >
                                                <option value="">{fetchingSlots ? 'Loading slots...' : 'Select Time'}</option>
                                                {timeSlots.map(t => {
                                                    const isBooked = bookedSlots.includes(t);
                                                    return (
                                                        <option key={t} value={t} disabled={isBooked}>
                                                            {t} {isBooked ? '(Already Booked)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-primary pt-4 border-t border-slate-100">Contact Information</h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Full Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            required
                                        />
                                        <Input
                                            label="Email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Phone Number"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">Special Requests / Notes</label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" fullWidth size="lg" isLoading={loading}>
                                        Confirm Booking
                                    </Button>
                                    <p className="text-center text-xs text-slate-500 mt-4">
                                        By booking, you agree to our cancellation policy (24h notice required).
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
