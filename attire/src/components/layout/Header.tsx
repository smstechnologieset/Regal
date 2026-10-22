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
import { useServices } from "@/context/ServicesContext";
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

  const { isServiceEnabled } = useServices();

  // All Premier Services for navigation, dynamically filtered by Admin Toggles
  const allServicesList = [
    {
      id: "attire",
      name: t.services.attireTitle,
      href: "/attire",
      icon: Shirt,
      description: t.services.attireTagline,
    },
    {
      id: "skincare",
      name: t.services.skincareTitle,
      href: "/skincare",
      icon: Droplets,
      description: t.services.skincareTagline,
    },
    {
      id: "toys",
      name: t.services.toysTitle,
      href: "/toys",
      icon: Smile,
      description: t.services.toysTagline,
    },
    {
      id: "journals",
      name: t.services.journalsTitle,
      href: "/journals",
      icon: BookOpen,
      description: t.services.journalsTagline,
    },
    {
      id: "catering",
      name: t.services.cateringTitle,
      href: "/catering",
      icon: UtensilsCrossed,
      description: t.services.cateringTagline,
    },
    {
      id: "gifts",
      name: t.services.giftsTitle,
      href: "/gifts",
      icon: Gift,
      description: t.services.giftsTagline,
    },
    {
      id: "bridal",
      name: t.services.bridalTitle,
      href: "/bridal",
      icon: Heart,
      description: t.services.bridalTagline,
    },
    {
      id: "events",
      name: t.services.eventsTitle,
      href: "/events",
      icon: Calendar,
      description: t.services.eventsTagline,
    },
  ];

  const servicesList = allServicesList.filter((s) => isServiceEnabled(s.id));



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
            ? "bg-[#F9F8F6]/90 backdrop-blur-md border-b border-[#E5DFD7] shadow-xs"
            : isMainPage
            ? "bg-transparent border-transparent pt-2"
            : "bg-[#F9F8F6] border-b border-[#E5DFD7]"
        )}
      >
        {/* Attire Free Shipping Notice */}
        {isAttireSection && (
          <div className="bg-[#0B192C] text-[#F4F1EA] text-center py-2 text-xs sm:text-sm border-b border-[#D4AF37]/30 font-sans">
            <p className="px-4">
              ✨{" "}
              {isAmharic
                ? "ከ 500 ብር በላይ ለሆኑ ትዕዛዞች ነፃ ማድረስ | ኮድ ይጠቀሙ: "
                : "Free shipping on orders over ETB 500 | Use code: "}
              <span className="font-bold text-[#D4AF37]">SAVE20</span>
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
                className="lg:hidden p-2 -ml-2 text-[#111827] hover:text-[#1E3A8A] transition-colors"
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
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors"
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
                            className="absolute top-full left-0 mt-0 w-48 bg-[#F9F8F6] rounded-xl shadow-lg border border-[#E5DFD7] py-2 animate-fade-in"
                            onMouseEnter={() => handleMouseEnter(category.id)}
                            onMouseLeave={handleMouseLeave}
                          >
                            {category.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/attire/products?category=${category.slug}&subcategory=${sub.slug}`}
                                className="block px-4 py-2 text-sm text-[#111827]/80 hover:text-[#1E3A8A] hover:bg-[#F4EFEA] transition-colors"
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
                      className="px-3 py-2 text-sm font-medium text-[#D4AF37] hover:text-[#B4942E] transition-colors"
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
                      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors">
                        <span>{t.nav.services}</span>
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${
                            isServicesOpen ? "rotate-180 text-[#1E3A8A]" : ""
                          }`}
                        />
                      </button>

                      {isServicesOpen && (
                        <div
                          className="absolute top-full left-0 mt-0 w-72 bg-[#F9F8F6] rounded-2xl shadow-xl border border-[#E5DFD7] py-2 animate-fade-in"
                          onMouseEnter={() => setIsServicesOpen(true)}
                          onMouseLeave={() => setIsServicesOpen(false)}
                        >
                          <div className="px-4 py-2 border-b border-[#E5DFD7]/60 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">
                            {t.services.tagline}
                          </div>
                          {servicesList.map((service) => (
                            <Link
                              key={service.name}
                              href={service.href}
                              className="flex items-start gap-3 px-4 py-2.5 text-sm hover:bg-[#F4EFEA] transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A] group-hover:bg-[#1E3A8A] group-hover:text-[#F4F1EA] transition-colors flex items-center justify-center shrink-0 mt-0.5">
                                <service.icon size={16} />
                              </div>
                              <div>
                                <div className="font-serif font-bold text-[#111827] group-hover:text-[#1E3A8A]">
                                  {service.name}
                                </div>
                                <div className="text-xs text-[#111827]/60 line-clamp-1">
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
                      className="px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors"
                    >
                      {t.nav.about}
                    </Link>
                    <Link
                      href="/contact"
                      className="px-3 py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors"
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
                  <span className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold tracking-wider text-[#111827] group-hover:text-[#1E3A8A] transition-colors">
                    REGAL
                  </span>
                  {isAttireSection && (
                    <span className="text-[10px] tracking-widest text-[#D4AF37] font-medium font-sans uppercase">
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
                        className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-white border border-[#E5DFD7] rounded-full text-[#111827] placeholder:text-[#111827]/40 focus:outline-none focus:border-[#1E3A8A] transition-all"
                      />
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111827]/50"
                      />
                    </form>
                  </div>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="md:hidden p-2 text-[#111827] hover:text-[#1E3A8A] transition-colors"
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
                  className="hidden sm:flex relative p-2 text-[#111827] hover:text-[#1E3A8A] transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-[#111827] text-[10px] font-bold rounded-full flex items-center justify-center">
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
                    className="p-1.5 text-[#111827] hover:text-[#1E3A8A] transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium"
                    aria-label="Account"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center">
                      <User size={16} />
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-[#111827]/60 hover:text-rose-600 transition-colors"
                    title={t.nav.signOut}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-[#F4F1EA] transition-all text-xs sm:text-sm font-medium"
                  aria-label="Sign In"
                >
                  <User size={15} />
                  <span>{t.nav.signIn}</span>
                </Link>
              )}

              {/* Cart Drawer Toggle (Desktop & Tablet only, hidden on mobile) */}
              <button
                onClick={toggleCart}
                className="hidden sm:flex relative p-2 text-[#111827] hover:text-[#1E3A8A] transition-colors cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1E3A8A] text-[#F4F1EA] text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {/* Compact Language Toggle (Far Right) */}
              <button
                onClick={toggleLocale}
                className="px-2.5 py-1 rounded-full border border-[#E5DFD7] bg-white/90 hover:bg-[#F4EFEA] text-[#1E3A8A] hover:border-[#1E3A8A] transition-all text-xs font-bold shadow-2xs cursor-pointer min-w-[32px] text-center"
                title={isAmharic ? "Switch to English" : "ወደ አማርኛ ቀይር"}
              >
                {isAmharic ? "EN" : "አማ"}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 bg-[#F9F8F6] md:hidden">
            <div className="p-4 border-b border-[#E5DFD7]">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t.nav.searchPlaceholder}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base bg-white border border-[#E5DFD7] rounded-xl text-[#111827] focus:outline-none focus:border-[#1E3A8A]"
                  />
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#111827]/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-[#111827] font-medium"
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
            className="absolute inset-0 bg-[#0B192C]/70 backdrop-blur-xs"
            onClick={closeMobileMenu}
          />

          <div className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-[#F9F8F6] shadow-2xl overflow-y-auto animate-slide-in-left flex flex-col justify-between">
            <div>
              {/* Drawer Top Header */}
              <div className="p-4 border-b border-[#E5DFD7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src="/Logo-bg.png"
                    alt="Regal Logo"
                    width={36}
                    height={36}
                    className="h-8 w-auto object-contain"
                  />
                  <span className="text-xl font-serif font-bold text-[#111827]">
                    REGAL
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleLocale}
                    className="px-2.5 py-0.5 rounded-full border border-[#E5DFD7] bg-white text-xs font-bold text-[#1E3A8A] cursor-pointer"
                    title={isAmharic ? "Switch to English" : "ወደ አማርኛ ቀይር"}
                  >
                    {isAmharic ? "EN" : "አማ"}
                  </button>
                  <button
                    onClick={closeMobileMenu}
                    className="p-1.5 text-[#111827]/70 hover:text-[#111827] rounded-lg hover:bg-[#F4EFEA] transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 space-y-3">
                {/* Services Collapsible Dropdown */}
                <div className="border border-[#E5DFD7]/70 rounded-xl overflow-hidden bg-white/60">
                  <button
                    onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                    className="flex items-center justify-between w-full p-3 text-sm font-semibold text-[#111827] hover:text-[#1E3A8A] transition-colors cursor-pointer"
                    aria-expanded={isMobileServicesOpen}
                  >
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans">
                      {t.nav.services}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 text-[#1E3A8A] ${
                        isMobileServicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isMobileServicesOpen && (
                    <div className="px-2 pb-2 space-y-1 border-t border-[#E5DFD7]/40 pt-2 animate-fade-in">
                      {servicesList.map((service) => (
                        <Link
                          key={service.name}
                          href={service.href}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-3 p-2 rounded-lg text-[#111827] hover:bg-[#F4EFEA] hover:text-[#1E3A8A] transition-colors"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center shrink-0">
                            <service.icon size={14} />
                          </div>
                          <div>
                            <div className="font-serif font-bold text-xs">
                              {service.name}
                            </div>
                            <div className="text-[11px] text-[#111827]/60 line-clamp-1">
                              {service.description}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Company Links */}
                <div className="pt-2 border-t border-[#E5DFD7]">
                  <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-2 font-sans">
                    {t.footer.colPhilosophy}
                  </p>
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className="block py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors"
                  >
                    {t.nav.about}
                  </Link>
                  <Link
                    href="/contact"
                    onClick={closeMobileMenu}
                    className="block py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors"
                  >
                    {t.nav.contact}
                  </Link>
                </div>
              </nav>
            </div>

            {/* Drawer Bottom Account Section */}
            <div className="p-4 border-t border-[#E5DFD7] bg-white">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#E5DFD7]/60">
                    <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold text-sm shrink-0">
                      <User size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] text-[#111827]/60 font-sans leading-tight">{t.nav.account}</p>
                      <p className="text-sm font-semibold text-[#111827] truncate leading-tight mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {/* Cart inside Drawer */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      toggleCart();
                    }}
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag size={16} className="text-[#1E3A8A]" />
                      {t.nav.cart || "Cart"}
                    </span>
                    {cartCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1E3A8A] text-[#F4F1EA]">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </button>

                  {/* Wishlist inside Drawer */}
                  <Link
                    href="/attire/wishlist"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Heart size={16} className="text-[#D4AF37]" />
                      {t.nav.wishlist || "Wishlist"}
                    </span>
                    {wishlistCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D4AF37] text-[#111827]">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  {/* My Account */}
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors"
                  >
                    <User size={16} className="text-[#1E3A8A]" />
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
                    className="flex items-center justify-between w-full py-2 text-sm font-medium text-[#111827] hover:text-[#1E3A8A] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag size={16} className="text-[#1E3A8A]" />
                      {t.nav.cart || "Cart"}
                    </span>
                    {cartCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1E3A8A] text-[#F4F1EA]">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </button>

                  <div className="flex gap-2 pt-1 border-t border-[#E5DFD7]/60">
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="flex-1 py-2 text-center text-sm font-medium rounded-lg border border-[#1E3A8A] text-[#1E3A8A]"
                    >
                      {t.nav.signIn}
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobileMenu}
                      className="flex-1 py-2 text-center text-sm font-medium rounded-lg bg-[#1E3A8A] text-[#F4F1EA]"
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
