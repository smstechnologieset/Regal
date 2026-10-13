"use client";

/**
 * Header Component
 *
 * Main navigation header for Regal platform.
 * Features:
 * - Centered Regal logo & emblem
 * - Bilingual localization (English / Amharic) toggle
 * - Warm earth tones & editorial luxury styling
 * - Mobile responsive drawer with language switcher
 */

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  ChevronDown,
  Sparkles,
  Droplets,
  Leaf,
  Smile,
  BookOpen,
  LogOut,
  Calendar,
  Gift,
  UtensilsCrossed,
  Shirt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { getCartItemCount, toggleCart } = useCart();
  const {
    searchQuery,
    setSearchQuery,
    toggleMobileMenu,
    isMobileMenuOpen,
    closeMobileMenu,
    categories,
  } = useApp();
  const { t, locale, toggleLocale, isAmharic } = useLanguage();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { itemCount: wishlistCount } = useWishlist();
  const cartCount = getCartItemCount();

  const isAttireSection = pathname.startsWith("/attire");
  const isMainPage = pathname === "/";
  const isAdminPage = pathname.startsWith("/admin");

  // The 5 Premier Services for main navigation
  const servicesList = [
    {
      name: t.services.attireTitle,
      href: "/attire",
      icon: Shirt,
      description: t.services.attireTagline,
    },
    {
      name: t.services.eventsTitle,
      href: "/events",
      icon: Calendar,
      description: t.services.eventsTagline,
    },
    {
      name: t.services.bridalTitle,
      href: "/bridal",
      icon: Heart,
      description: t.services.bridalTagline,
    },
    {
      name: t.services.cateringTitle,
      href: "/catering",
      icon: UtensilsCrossed,
      description: t.services.cateringTagline,
    },
    {
      name: t.services.giftsTitle,
      href: "/gifts",
      icon: Gift,
      description: t.services.giftsTagline,
    },
  ];



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    router.push(`/attire/products?search=${encodeURIComponent(localSearch)}`);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    window.location.href = "/";
    closeMobileMenu();
  };

  if (isAdminPage) return null;

  return (
    <>
      <header
        className={cn(
          "z-50 transition-all duration-300 w-full",
          isMainPage ? "fixed top-0 left-0" : "sticky top-0",
          scrolled
            ? "bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E0D6C8] shadow-xs"
            : isMainPage
            ? "bg-transparent border-transparent pt-2"
            : "bg-[#FDFBF7] border-b border-[#E0D6C8]"
        )}
      >
        {/* Attire Free Shipping Notice */}
        {isAttireSection && (
          <div className="bg-[#4A5D4E] text-[#FDFBF7] text-center py-2 text-xs sm:text-sm border-b border-[#C5A059]/20 font-sans">
            <p className="px-4">
              ✨{" "}
              {isAmharic
                ? "ከ 500 ብር በላይ ለሆኑ ትዕዛዞች ነፃ ማድረስ | ኮድ ይጠቀሙ: "
                : "Free shipping on orders over ETB 500 | Use code: "}
              <span className="font-bold text-[#C5A059]">SAVE20</span>
            </p>
          </div>
        )}

        {/* Main Header Container with Centered Logo */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* LEFT SECTION: Desktop Navigation Links / Mobile Hamburger */}
            <div className="flex-1 flex items-center justify-start gap-4 lg:gap-6">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 -ml-2 text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1">
                {isAttireSection ? (
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
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                        >
                          {category.name}
                          {category.subcategories && (
                            <ChevronDown
                              size={13}
                              className={`transition-transform ${
                                activeDropdown === category.id ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </Link>
                        {category.subcategories && activeDropdown === category.id && (
                          <div
                            className="absolute top-full left-0 mt-0 w-48 bg-[#FDFBF7] rounded-xl shadow-lg border border-[#E0D6C8] py-2 animate-fade-in"
                            onMouseEnter={() => handleMouseEnter(category.id)}
                            onMouseLeave={handleMouseLeave}
                          >
                            {category.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/attire/products?category=${category.slug}&subcategory=${sub.slug}`}
                                className="block px-4 py-2 text-sm text-[#2B2D2F]/80 hover:text-[#4A5D4E] hover:bg-[#F4EFEA] transition-colors"
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
                      className="px-3 py-2 text-sm font-medium text-[#C5A059] hover:text-[#af8b45] transition-colors"
                    >
                      {isAmharic ? "ቅናሾች" : "Sale"}
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Services Dropdown */}
                    <div
                      className="relative"
                      onMouseEnter={() => setIsServicesOpen(true)}
                      onMouseLeave={() => setIsServicesOpen(false)}
                    >
                      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors">
                        <span>{t.nav.services}</span>
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${
                            isServicesOpen ? "rotate-180 text-[#4A5D4E]" : ""
                          }`}
                        />
                      </button>

                      {isServicesOpen && (
                        <div
                          className="absolute top-full left-0 mt-0 w-72 bg-[#FDFBF7] rounded-2xl shadow-xl border border-[#E0D6C8] py-2 animate-fade-in"
                          onMouseEnter={() => setIsServicesOpen(true)}
                          onMouseLeave={() => setIsServicesOpen(false)}
                        >
                          <div className="px-4 py-2 border-b border-[#E0D6C8]/60 text-[11px] font-semibold text-[#C5A059] uppercase tracking-wider">
                            {t.services.tagline}
                          </div>
                          {servicesList.map((service) => (
                            <Link
                              key={service.name}
                              href={service.href}
                              className="flex items-start gap-3 px-4 py-2.5 text-sm hover:bg-[#F4EFEA] transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#4A5D4E]/10 text-[#4A5D4E] group-hover:bg-[#4A5D4E] group-hover:text-[#FDFBF7] transition-colors flex items-center justify-center shrink-0 mt-0.5">
                                <service.icon size={16} />
                              </div>
                              <div>
                                <div className="font-serif font-bold text-[#2B2D2F] group-hover:text-[#4A5D4E]">
                                  {service.name}
                                </div>
                                <div className="text-xs text-[#2B2D2F]/60 line-clamp-1">
                                  {service.description}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/about"
                      className="px-3 py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                    >
                      {t.nav.about}
                    </Link>
                    <Link
                      href="/contact"
                      className="px-3 py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                    >
                      {t.nav.contact}
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* CENTER SECTION: Perfectly Centered Regal Logo */}
            <div className="shrink-0 flex items-center justify-center">
              <Link
                href="/"
                className="flex items-center gap-2.5 group py-1"
                onClick={closeMobileMenu}
              >
                <div className="relative flex items-center justify-center transition-transform group-hover:scale-105">
                  <Image
                    src="/Logo-bg.png"
                    alt="Regal Logo"
                    width={100}
                    height={100}
                    className="h-10 sm:h-12 md:h-14 w-auto object-contain filter drop-shadow-xs"
                    priority
                  />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold tracking-wider text-[#2B2D2F] group-hover:text-[#4A5D4E] transition-colors">
                    REGAL
                  </span>
                  {isAttireSection && (
                    <span className="text-[10px] tracking-widest text-[#C5A059] font-medium font-sans uppercase">
                      Attire
                    </span>
                  )}
                </div>
              </Link>
            </div>

            {/* RIGHT SECTION: User Actions & Language Switcher */}
            <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2 lg:gap-3">
              {/* Search (Attire section) */}
              {isAttireSection && (
                <>
                  <div className="hidden md:block relative">
                    <form onSubmit={handleSearch}>
                      <input
                        type="text"
                        placeholder={t.nav.searchPlaceholder}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-white border border-[#E0D6C8] rounded-full text-[#2B2D2F] placeholder:text-[#2B2D2F]/40 focus:outline-none focus:border-[#4A5D4E] transition-all"
                      />
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2D2F]/50"
                      />
                    </form>
                  </div>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="md:hidden p-2 text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                </>
              )}

              {/* Wishlist */}
              {user && (
                <Link
                  href="/attire/wishlist"
                  className="hidden sm:flex relative p-2 text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C5A059] text-[#2B2D2F] text-[10px] font-bold rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Notification Bell */}
              {user && (
                <div className="hidden sm:flex items-center">
                  <NotificationBell />
                </div>
              )}

              {/* User Account / Sign In */}
              {user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <Link
                    href="/account"
                    className="p-1.5 text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium"
                    aria-label="Account"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#4A5D4E]/10 text-[#4A5D4E] flex items-center justify-center">
                      <User size={16} />
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-[#2B2D2F]/60 hover:text-rose-600 transition-colors"
                    title={t.nav.signOut}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4A5D4E] text-[#4A5D4E] hover:bg-[#4A5D4E] hover:text-[#FDFBF7] transition-all text-xs sm:text-sm font-medium"
                  aria-label="Sign In"
                >
                  <User size={15} />
                  <span>{t.nav.signIn}</span>
                </Link>
              )}

              {/* Cart Drawer Toggle (Desktop & Tablet only, hidden on mobile) */}
              <button
                onClick={toggleCart}
                className="hidden sm:flex relative p-2 text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4A5D4E] text-[#FDFBF7] text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {/* Compact Language Toggle (Far Right) */}
              <button
                onClick={toggleLocale}
                className="px-2.5 py-1 rounded-full border border-[#E0D6C8] bg-white/90 hover:bg-[#F4EFEA] text-[#4A5D4E] hover:border-[#4A5D4E] transition-all text-xs font-bold shadow-2xs cursor-pointer min-w-[32px] text-center"
                title={isAmharic ? "Switch to English" : "ወደ አማርኛ ቀይር"}
              >
                {isAmharic ? "EN" : "አማ"}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 bg-[#FDFBF7] md:hidden">
            <div className="p-4 border-b border-[#E0D6C8]">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t.nav.searchPlaceholder}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base bg-white border border-[#E0D6C8] rounded-xl text-[#2B2D2F] focus:outline-none focus:border-[#4A5D4E]"
                  />
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2D2F]/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-[#2B2D2F] font-medium"
                >
                  {t.common.cancel}
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#2B2D2F]/60 backdrop-blur-xs"
            onClick={closeMobileMenu}
          />

          <div className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-[#FDFBF7] shadow-2xl overflow-y-auto animate-slide-in-left flex flex-col justify-between">
            <div>
              {/* Drawer Top Header */}
              <div className="p-4 border-b border-[#E0D6C8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/Logo-bg.png"
                    alt="Regal Logo"
                    width={36}
                    height={36}
                    className="h-8 w-auto object-contain"
                  />
                  <span className="text-xl font-serif font-bold text-[#2B2D2F]">
                    REGAL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleLocale}
                    className="px-2.5 py-0.5 rounded-full border border-[#E0D6C8] bg-white text-xs font-bold text-[#4A5D4E] cursor-pointer"
                    title={isAmharic ? "Switch to English" : "ወደ አማርኛ ቀይር"}
                  >
                    {isAmharic ? "EN" : "አማ"}
                  </button>
                  <button
                    onClick={closeMobileMenu}
                    className="p-1.5 text-[#2B2D2F]/70 hover:text-[#2B2D2F] rounded-lg hover:bg-[#F4EFEA] transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 space-y-3">
                {/* Services Collapsible Dropdown */}
                <div className="border border-[#E0D6C8]/70 rounded-xl overflow-hidden bg-white/60">
                  <button
                    onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                    className="flex items-center justify-between w-full p-3 text-sm font-semibold text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors cursor-pointer"
                    aria-expanded={isMobileServicesOpen}
                  >
                    <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider font-sans">
                      {t.nav.services}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 text-[#4A5D4E] ${
                        isMobileServicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isMobileServicesOpen && (
                    <div className="px-2 pb-2 space-y-1 border-t border-[#E0D6C8]/40 pt-2 animate-fade-in">
                      {servicesList.map((service) => (
                        <Link
                          key={service.name}
                          href={service.href}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-3 p-2 rounded-lg text-[#2B2D2F] hover:bg-[#F4EFEA] hover:text-[#4A5D4E] transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#4A5D4E]/10 text-[#4A5D4E] flex items-center justify-center shrink-0">
                            <service.icon size={14} />
                          </div>
                          <div>
                            <div className="font-serif font-bold text-xs">
                              {service.name}
                            </div>
                            <div className="text-[11px] text-[#2B2D2F]/60 line-clamp-1">
                              {service.description}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Company Links */}
                <div className="pt-2 border-t border-[#E0D6C8]">
                  <p className="text-xs font-semibold text-[#C5A059] uppercase tracking-wider mb-2 font-sans">
                    {t.footer.colPhilosophy}
                  </p>
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className="block py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                  >
                    {t.nav.about}
                  </Link>
                  <Link
                    href="/contact"
                    onClick={closeMobileMenu}
                    className="block py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                  >
                    {t.nav.contact}
                  </Link>
                </div>
              </nav>
            </div>

            {/* Drawer Bottom Account Section */}
            <div className="p-4 border-t border-[#E0D6C8] bg-white">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#E0D6C8]/60">
                    <div className="w-9 h-9 rounded-full bg-[#4A5D4E]/10 text-[#4A5D4E] flex items-center justify-center font-bold text-sm shrink-0">
                      <User size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] text-[#2B2D2F]/60 font-sans leading-tight">{t.nav.account}</p>
                      <p className="text-sm font-semibold text-[#2B2D2F] truncate leading-tight mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {/* Cart inside Drawer */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      toggleCart();
                    }}
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag size={16} className="text-[#4A5D4E]" />
                      {t.nav.cart || "Cart"}
                    </span>
                    {cartCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#4A5D4E] text-[#FDFBF7]">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </button>

                  {/* Wishlist inside Drawer */}
                  <Link
                    href="/attire/wishlist"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Heart size={16} className="text-[#C5A059]" />
                      {t.nav.wishlist || "Wishlist"}
                    </span>
                    {wishlistCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#C5A059] text-[#2B2D2F]">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  {/* My Account */}
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors"
                  >
                    <User size={16} className="text-[#4A5D4E]" />
                    {t.nav.account}
                  </Link>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleSignOut();
                    }}
                    className="flex items-center gap-2.5 w-full text-left py-2 text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    {t.nav.signOut}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Cart for guest */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      toggleCart();
                    }}
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-[#2B2D2F] hover:text-[#4A5D4E] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag size={16} className="text-[#4A5D4E]" />
                      {t.nav.cart || "Cart"}
                    </span>
                    {cartCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#4A5D4E] text-[#FDFBF7]">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </button>

                  <div className="flex gap-2 pt-1 border-t border-[#E0D6C8]/60">
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="flex-1 py-2 text-center text-sm font-medium rounded-lg border border-[#4A5D4E] text-[#4A5D4E]"
                    >
                      {t.nav.signIn}
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobileMenu}
                      className="flex-1 py-2 text-center text-sm font-medium rounded-lg bg-[#4A5D4E] text-[#FDFBF7]"
                    >
                      {isAmharic ? "ይመዝገቡ" : "Register"}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
