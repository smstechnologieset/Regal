'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ContactPage() {
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success'>('idle');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const contactInfo = [
        {
            icon: Phone,
            title: 'Call Us',
            details: '+1 (555) 123-4567',
            sub: 'Mon-Fri from 9am to 6pm'
        },
        {
            icon: Mail,
            title: 'Email Us',
            details: 'hello@regal.com',
            sub: 'We usually reply within 24 hours'
        },
        {
            icon: MapPin,
            title: 'Visit Us',
            details: '123 Fashion Ave, Suite 500',
            sub: 'New York, NY 10001'
        },
        {
            icon: Clock,
            title: 'Business Hours',
            details: 'Mon-Sat: 10am - 8pm',
            sub: 'Sunday: Closed'
        }
    ];

    const faqs = [
        {
            question: 'How early should I book a bridal appointment?',
            answer: 'We recommend booking at least 6-9 months in advance for custom gowns, and 2-3 months for off-the-rack fittings to ensures ample time for any desired alterations.'
        },
        {
            question: 'Do you offer international shipping for Attire?',
            answer: 'Yes! We ship to over 50 countries worldwide. Shipping times and costs vary depending on the destination, which will be calculated at checkout.'
        },
        {
            question: 'What is your event planning process like?',
            answer: 'It begins with a free initial consultation where we discuss your vision and budget. From there, we provide a custom proposal and manage everything from vendor selection to day-of coordination.'
        },
        {
            question: 'Can I customize the catering menu?',
            answer: 'Absolutely. Our chefs specialize in creating bespoke menus that cater to specific dietary requirements, themes, and cultural preferences.'
        }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('sending');
        // Simulate API call
        setTimeout(() => {
            setFormStatus('success');
            // Reset after some time
            setTimeout(() => setFormStatus('idle'), 5000);
        }, 1500);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary py-20 relative min-h-[70vh] overflow-hidden">
                <div className="absolute inset-0 bg-primary">
                    <div className="absolute inset-0 hero-gradient opacity-90" />
                    <img
                        src="https://www.coutts.com/content/dam/coutts/images/owned/the-coutts-experience/20250803_Coutts_Day_5_07_Coutts_24_042.jpg"
                        alt="About Regal"
                        className="w-full h-full object-cover mix-blend-overlay"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
                    <p className="text-white/60 max-w-xl mx-auto text-lg font-light">
                        Have a question about our collections or need help planning your next event? We're here to help you every step of the way.
                    </p>

                </div>
            </section>

            {/* Contact Grid */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-16">
                        {/* Info Column */}
                        <div className="lg:w-1/3">
                            <h2 className="text-2xl font-bold mb-8 text-primary">Contact Information</h2>
                            <div className="grid grid-cols-1 gap-8">
                                {contactInfo.map((info, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center shrink-0 border border-slate-100">
                                            <info.icon size={20} className="text-secondary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-primary">{info.title}</h3>
                                            <p className="text-slate-900 font-medium">{info.details}</p>
                                            <p className="text-slate-500 text-sm">{info.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social Placeholder */}
                            <div className="mt-12 p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="font-bold mb-4 text-primary">Follow Us</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    Join our community for daily inspiration and exclusive updates.
                                </p>
                                <div className="flex gap-4">
                                    {['Instagram', 'Facebook', 'Pinterest', 'Twitter'].map((platform) => (
                                        <div key={platform} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 cursor-pointer hover:border-secondary hover:text-secondary transition-all">
                                            <span className="text-[10px] font-bold uppercase">{platform[0]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Form Column */}
                        <div className="lg:w-2/3">
                            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/50">
                                {formStatus === 'success' ? (
                                    <div className="text-center py-12 animate-fade-in">
                                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <h2 className="text-3xl font-bold mb-4 text-primary">Message Sent!</h2>
                                        <p className="text-slate-500 mb-8">
                                            Thank you for reaching out. A member of the Regal team will get back to you shortly.
                                        </p>
                                        <Button onClick={() => setFormStatus('idle')}>
                                            Send Another Message
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold mb-8 text-primary">Send us a Message</h2>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="John Doe"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-secondary focus:bg-white transition-all text-slate-900"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                                    <input
                                                        required
                                                        type="email"
                                                        placeholder="john@example.com"
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-secondary focus:bg-white transition-all text-slate-900"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Service of Interest</label>
                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-secondary focus:bg-white transition-all text-slate-900">
                                                    <option>General Inquiry</option>
                                                    <option>Attire & Shopping</option>
                                                    <option>Event Planning</option>
                                                    <option>Bridal Services</option>
                                                    <option>Catering Packages</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Your Message</label>
                                                <textarea
                                                    required
                                                    rows={5}
                                                    placeholder="How can we help you today?"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-secondary focus:bg-white transition-all text-slate-900 resize-none"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                size="lg"
                                                className="w-full md:w-auto flex items-center gap-2"
                                                disabled={formStatus === 'sending'}
                                            >
                                                {formStatus === 'sending' ? 'Sending...' : (
                                                    <>Send Message <Send size={18} /></>
                                                )}
                                            </Button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-primary">Frequently Asked Questions</h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            Quick answers to the questions we get asked most often.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-primary">{faq.question}</span>
                                    {expandedFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-6 pb-5 text-slate-500 leading-relaxed border-t border-slate-100 pt-4 animate-fade-in">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Map Placeholder */}
            <section className="h-[400px] w-full bg-slate-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin size={48} className="text-secondary mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Interactive Map Loading...</p>
                        <p className="text-slate-400 text-sm">123 Fashion Ave, New York, NY</p>
                    </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-primary opacity-5 pointer-events-none" />
            </section>
        </div>
    );
}
