/**
 * Footer Component
 * 
 * Site footer for Regal platform with all services and navigation links.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import NewsletterForm from './NewsletterForm';

const footerLinks = {
    services: [
        { label: 'Attire Store', href: '/attire' },
        { label: 'Event Planning', href: '/events' },
        { label: 'Bridal Services', href: '/bridal' },
        { label: 'Catering', href: '/catering' },
        { label: 'Gift Packages', href: '/gifts' },
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
                        <NewsletterForm />
                    </div>
                </div>
            </div>

            {/* Main footer content */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand section */}
                    <div className="col-span-2 md:col-span-1 mb-6 lg:mb-0">
                        <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
                            <div className="p-1.5 bg-white/10 rounded-xl backdrop-blur-sm group-hover:scale-105 transition-transform">
                                <Image 
                                    src="/Logo-bg.png" 
                                    alt="Regal Logo" 
                                    width={100} 
                                    height={100} 
                                    className="h-14 w-auto object-contain"
                                />
                            </div>
                            <div>
                                <span className="text-2xl font-extrabold tracking-wider font-organo text-white block">
                                    REGAL
                                </span>
                                <span className="text-[10px] tracking-widest text-slate-300 font-semibold uppercase block">
                                    Curated. Crafted. Crowned.
                                </span>
                            </div>
                        </Link>
                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
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
