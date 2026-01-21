/**
 * Footer Component
 * 
 * Site footer for Regal platform with all services and navigation links.
 */

import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Youtube, Mail } from 'lucide-react';

const footerLinks = {
    services: [
        { label: 'Attire Store', href: '/attire' },
        { label: 'Event Planning', href: '/events' },
        { label: 'Bridal Services', href: '/bridal' },
        { label: 'Catering', href: '/catering' },
    ],
    shop: [
        { label: 'Women', href: '/attire/products?category=women' },
        { label: 'Kids', href: '/attire/products?category=kids' },
        { label: 'Accessories', href: '/attire/products?category=accessories' },
        { label: 'Sale', href: '/attire/products?sale=true' },
    ],
    help: [
        { label: 'Customer Service', href: '/help' },
        { label: 'Track Order', href: '/account/orders' },
        { label: 'Size Guide', href: '/size-guide' },
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
    ]
};

const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },

];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-primary text-white">
            {/* Newsletter section */}
            <div className="border-b border-white/10">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="text-2xl font-bold mb-2">Stay Connected with Regal</h3>
                        <p className="text-white/60 mb-6">
                            Subscribe to get updates on all our services, special offers, and exclusive deals.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <div className="flex-1 relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    suppressHydrationWarning
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-secondary transition-colors"
                                />
                                <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-secondary hover:opacity-90 text-white font-medium rounded-lg transition-colors"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main footer content */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand section */}
                    <div className="col-span-2 md:col-span-1 mb-6 lg:mb-0">
                        <Link href="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold text-secondary">
                                REGAL
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm mb-4">
                            Your destination for style, celebrations, and unforgettable experiences.
                        </p>
                        {/* Social links */}
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Services links */}
                    <div>
                        <h4 className="font-semibold mb-4">Services</h4>
                        <ul className="space-y-2">
                            {footerLinks.services.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-white text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Shop links */}
                    <div>
                        <h4 className="font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2">
                            {footerLinks.shop.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-white text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help links */}
                    <div>
                        <h4 className="font-semibold mb-4">Help</h4>
                        <ul className="space-y-2">
                            {footerLinks.help.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-slate-400 hover:text-white text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-800">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                        <p suppressHydrationWarning>© {currentYear} Regal. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="/terms" className="hover:text-white">Terms</Link>
                            <Link href="/privacy" className="hover:text-white">Privacy</Link>
                            <Link href="/cookies" className="hover:text-white">Cookies</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
