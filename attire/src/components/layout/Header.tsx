'use client';

/**
 * Header Component
 * 
 * Main navigation header for Regal platform.
 * Shows different navigation based on current section (main site vs Attire store).
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    Search,
    ShoppingBag,
    User,
    Menu,
    X,
    Heart,
    ChevronDown,
    Shirt,
    PartyPopper,
    Heart as HeartIcon,
    UtensilsCrossed,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

// Services for main navigation
const services = [
    { name: 'Attire', href: '/attire', icon: Shirt, description: 'Fashion & Clothing' },
    { name: 'Events', href: '/events', icon: PartyPopper, description: 'Event Planning' },
    { name: 'Bridal', href: '/bridal', icon: HeartIcon, description: 'Bridal Services' },
    { name: 'Catering', href: '/catering', icon: UtensilsCrossed, description: 'Catering' },
];

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { getCartItemCount, toggleCart } = useCart();
    const { searchQuery, setSearchQuery, toggleMobileMenu, isMobileMenuOpen, closeMobileMenu, categories } = useApp();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { itemCount: wishlistCount } = useWishlist();
    const cartCount = getCartItemCount();

    // Check if we're in the Attire section
    const isAttireSection = pathname.startsWith('/attire');
    const isMainPage = pathname === '/';
    const isAdminPage = pathname.startsWith('/admin');

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(localSearch);
        router.push(`/attire/products?search=${encodeURIComponent(localSearch)}`);
        setIsSearchOpen(false);
    };

    // Focus search input when opened
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Handle scroll for transparent header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isTransparent = isMainPage && !scrolled;

    // Handle dropdown hover
    const handleMouseEnter = (categoryId: string) => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setActiveDropdown(categoryId);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 150);
    };

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
        closeMobileMenu();
    };

    if (isAdminPage) return null;

    return (
        <>
            <header className={cn(
                "z-50 transition-all duration-300 w-full",
                isMainPage ? "fixed top-0 left-0" : "sticky top-0",
                isTransparent
                    ? "bg-transparent border-transparent pt-2"
                    : "bg-white/50 backdrop-blur-md border-b border-slate-200 shadow-sm"
            )}>
                {/* Top promotional banner - only show in Attire section */}
                {isAttireSection && (
                    <div className="bg-primary text-white text-center py-2 text-sm border-b border-white/10">
                        <p className="px-4">
                            🎉 Free shipping on orders over $500 | Use code <span className="font-semibold">SAVE20</span> for 20% off
                        </p>
                    </div>
                )}

                {/* Main header */}
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Mobile menu button */}
                        <button
                            onClick={toggleMobileMenu}
                            className={cn(
                                "lg:hidden p-2 -ml-2 transition-colors",
                                isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                            )}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
                            <span className={cn(
                                "text-2xl lg:text-3xl font-bold tracking-tight transition-colors",
                                isTransparent ? "text-white" : "text-secondary"
                            )}>
                                REGAL
                            </span>
                            {isAttireSection && (
                                <span className={cn(
                                    "hidden sm:inline text-lg ml-2 font-light transition-colors",
                                    isTransparent ? "text-white/60" : "text-slate-400"
                                )}>| Attire</span>
                            )}
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {isAttireSection ? (
                                // Attire-specific navigation
                                <>
                                    {categories.slice(0, 4).map((category) => (
                                        <div
                                            key={category.id}
                                            className="relative"
                                            onMouseEnter={() => handleMouseEnter(category.id)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <Link
                                                href={`/attire/products?category=${category.slug}`}
                                                className={cn(
                                                    "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors",
                                                    isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                                )}
                                            >
                                                {category.name}
                                                {category.subcategories && (
                                                    <ChevronDown size={14} className={`transition-transform ${activeDropdown === category.id ? 'rotate-180' : ''}`} />
                                                )}
                                            </Link>

                                            {/* Dropdown menu */}
                                            {category.subcategories && activeDropdown === category.id && (
                                                <div
                                                    className="absolute top-full left-0 mt-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 animate-fade-in"
                                                    onMouseEnter={() => handleMouseEnter(category.id)}
                                                    onMouseLeave={handleMouseLeave}
                                                >
                                                    {category.subcategories.map((sub) => (
                                                        <Link
                                                            key={sub.id}
                                                            href={`/attire/products?category=${category.slug}&subcategory=${sub.slug}`}
                                                            className="block px-4 py-2 text-sm text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                                                        >
                                                            {sub.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <Link
                                        href="/attire/products?sale=true"
                                        className={cn(
                                            "px-4 py-2 text-sm font-medium transition-colors",
                                            isTransparent ? "text-white hover:text-white/80" : "text-secondary hover:text-secondary/80"
                                        )}
                                    >
                                        Sale
                                    </Link>
                                </>
                            ) : (
                                // Main site navigation
                                <>
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setIsServicesOpen(true)}
                                        onMouseLeave={() => setIsServicesOpen(false)}
                                    >
                                        <button
                                            className={cn(
                                                "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors",
                                                isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                            )}
                                        >
                                            Services
                                            <ChevronDown size={14} className={`transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Services Dropdown */}
                                        {isServicesOpen && (
                                            <div
                                                className="absolute top-full left-0 mt-0 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 animate-fade-in"
                                                onMouseEnter={() => setIsServicesOpen(true)}
                                                onMouseLeave={() => setIsServicesOpen(false)}
                                            >
                                                {services.map((service) => (
                                                    <Link
                                                        key={service.name}
                                                        href={service.href}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                                                    >
                                                        <service.icon size={18} className="text-secondary" />
                                                        <div>
                                                            <div className="font-medium text-slate-900">{service.name}</div>
                                                            <div className="text-xs text-slate-500 line-clamp-1">{service.description}</div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        href="/about"
                                        className={cn(
                                            "px-4 py-2 text-sm font-medium transition-colors",
                                            isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                        )}
                                    >
                                        About Us
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className={cn(
                                            "px-4 py-2 text-sm font-medium transition-colors",
                                            isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                        )}
                                    >
                                        Contact Us
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* Right side actions */}
                        <div className="flex items-center gap-2">
                            {/* Search (Only in Attire section) */}
                            {isAttireSection && (
                                <>
                                    <div className="hidden md:block relative">
                                        <form onSubmit={handleSearch}>
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={localSearch}
                                                onChange={(e) => setLocalSearch(e.target.value)}
                                                className={cn(
                                                    "w-64 lg:w-80 pl-10 pr-4 py-2 text-sm border border-transparent rounded-full focus:bg-white focus:border-slate-300 focus:outline-none transition-all",
                                                    isTransparent ? "bg-white/10 text-white placeholder:text-white/60" : "bg-slate-100 text-slate-900"
                                                )}
                                            />
                                            <Search size={18} className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", isTransparent ? "text-white/60" : "text-slate-400")} />
                                        </form>
                                    </div>

                                    {/* Search (Mobile) */}
                                    <button
                                        onClick={() => setIsSearchOpen(true)}
                                        className={cn(
                                            "md:hidden p-2 transition-colors",
                                            isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                        )}
                                        aria-label="Search"
                                    >
                                        <Search size={22} />
                                    </button>

                                    {/* Wishlist */}
                                    <Link
                                        href="/attire/wishlist"
                                        className={cn(
                                            "relative p-2 transition-colors",
                                            isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                        )}
                                        aria-label="Wishlist"
                                    >
                                        <Heart size={22} />
                                        {wishlistCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                                                {wishlistCount}
                                            </span>
                                        )}
                                    </Link>
                                </>
                            )}

                            {/* User account */}
                            {user ? (
                                <div className="flex items-center gap-1">
                                    <Link
                                        href="/account"
                                        className={cn(
                                            "p-2 transition-colors flex items-center gap-1",
                                            isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                        )}
                                        aria-label="Account"
                                    >
                                        <User size={22} />
                                        <span className="hidden md:inline text-sm font-medium">Account</span>
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className={cn(
                                            "p-2 transition-colors",
                                            isTransparent ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-red-600"
                                        )}
                                        title="Sign Out"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className={cn(
                                        "p-2 transition-colors",
                                        isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                    )}
                                    aria-label="Account"
                                >
                                    <User size={22} />
                                </Link>
                            )}

                            {/* Cart - Only in Attire section */}
                            {isAttireSection && (
                                <button
                                    onClick={toggleCart}
                                    className={cn(
                                        "relative p-2 transition-colors",
                                        isTransparent ? "text-white hover:text-white/80" : "text-slate-700 hover:text-primary"
                                    )}
                                    aria-label="Cart"
                                >
                                    <ShoppingBag size={22} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-medium rounded-full flex items-center justify-center">
                                            {cartCount > 99 ? '99+' : cartCount}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Search Overlay */}
                {isSearchOpen && (
                    <div className="fixed inset-0 z-50 bg-white md:hidden">
                        <div className="p-4">
                            <form onSubmit={handleSearch} className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search products..."
                                        value={localSearch}
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 text-base bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-slate-300 focus:outline-none transition-all"
                                    />
                                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(false)}
                                    className="p-2 text-slate-600"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={closeMobileMenu}
                    />

                    {/* Menu panel */}
                    <div className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-xl overflow-y-auto animate-slide-in-left">
                        <div className="p-4 border-b border-slate-200">
                            <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                                REGAL
                            </span>
                        </div>

                        <nav className="p-4">
                            {/* Services Section */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Services</p>
                                {services.map((service) => (
                                    <Link
                                        key={service.name}
                                        href={service.href}
                                        onClick={closeMobileMenu}
                                        className="flex items-center gap-3 py-3 text-primary hover:text-secondary"
                                    >
                                        <service.icon size={20} />
                                        <div>
                                            <div className="font-medium">{service.name}</div>
                                            <div className="text-xs text-slate-500">
                                                {service.description}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Attire Categories */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Shop Attire</p>
                                {categories.map((category) => (
                                    <div key={category.id} className="mb-4">
                                        <Link
                                            href={`/attire/products?category=${category.slug}`}
                                            onClick={closeMobileMenu}
                                            className="block text-lg font-medium text-primary mb-2 hover:text-secondary transition-colors"
                                        >
                                            {category.name}
                                        </Link>
                                        {category.subcategories && (
                                            <div className="pl-4 space-y-1">
                                                {category.subcategories.map((sub) => (
                                                    <Link
                                                        key={sub.id}
                                                        href={`/attire/products?category=${category.slug}&subcategory=${sub.slug}`}
                                                        onClick={closeMobileMenu}
                                                        className="block py-1 text-slate-600 hover:text-primary transition-colors"
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Company Links */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Company</p>
                                <Link
                                    href="/about"
                                    onClick={closeMobileMenu}
                                    className="block py-3 text-primary font-medium hover:text-secondary transition-colors"
                                >
                                    About Us
                                </Link>
                                <Link
                                    href="/contact"
                                    onClick={closeMobileMenu}
                                    className="block py-3 text-primary font-medium hover:text-secondary transition-colors"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </nav>

                        <div className="p-4 border-t border-slate-200">
                            {user ? (
                                <>
                                    <Link
                                        href="/account"
                                        onClick={closeMobileMenu}
                                        className="block py-2 text-slate-700 hover:text-primary font-medium"
                                    >
                                        My Account
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="block w-full text-left py-2 text-secondary hover:text-secondary/80 font-medium"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={closeMobileMenu}
                                        className="block py-2 text-slate-700 hover:text-primary"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={closeMobileMenu}
                                        className="block py-2 text-slate-700 hover:text-primary"
                                    >
                                        Create Account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
