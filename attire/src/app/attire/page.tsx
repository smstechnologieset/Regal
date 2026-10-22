'use client';

/**
 * Attire Store Home Page
 * 
 * Landing page for Attire clothing store featuring:
 * - Hero banner with CTA
 * - Category grid
 * - Featured collections (New Arrivals, Bestsellers, On Sale)
 * - Bilingual localization (English / Amharic)
 * - Earth-tone brand styling
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, Sparkles, Shield, PhoneCall } from 'lucide-react';
import { Product } from '@/types';
import { getFeaturedProducts } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AttireHomePage() {
  const { t, isAmharic } = useLanguage();
  const { categories, categoriesLoading, addToast } = useApp();
  const [featuredProducts, setFeaturedProducts] = useState<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { addToCart, toggleCart } = useCart();

  // Dynamic bilingual slides
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop',
      title: t.attirePage.heroSlide1Title,
      subtitle: t.attirePage.heroSlide1Subtitle,
      cta: t.attirePage.heroSlide1Cta,
      link: '/attire/products?filter=new',
    },
    {
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop',
      title: t.attirePage.heroSlide2Title,
      subtitle: t.attirePage.heroSlide2Subtitle,
      cta: t.attirePage.heroSlide2Cta,
      link: '/attire/products',
    },
  ];

  // Features/USPs
  const features = [
    { icon: Truck, title: t.attirePage.feature1Title, desc: t.attirePage.feature1Desc },
    { icon: Sparkles, title: t.attirePage.feature2Title, desc: t.attirePage.feature2Desc },
    { icon: Shield, title: t.attirePage.feature3Title, desc: t.attirePage.feature3Desc },
    { icon: PhoneCall, title: t.attirePage.feature4Title, desc: t.attirePage.feature4Desc },
  ];

  // Fetch featured products
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      if (categoriesLoading) return;
      try {
        const productsData = await getFeaturedProducts(controller.signal);
        if (isMounted && !controller.signal.aborted) {
          setFeaturedProducts(productsData);
          setLoading(false);
        }
      } catch (error: any) {
        if (!isMounted || error.name === 'AbortError') return;
        console.error('[AttireHomePage] Fetch Error:', error);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [categoriesLoading]);

  // Auto-rotate hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleQuickAdd = (product: Product) => {
    if (product.sizes?.[0] && product.colors?.[0]) {
      addToCart(product, product.sizes[0], product.colors[0], 1);
      addToast(isAmharic ? `${product.name} ወደ ጋሪ ታክሏል!` : `${product.name} added to cart!`, 'success');
      toggleCart();
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Hero Slider */}
      <section className="relative h-[65vh] min-h-[500px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              unoptimized
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C]/90 via-[#0B192C]/50 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-xl text-[#F4F1EA]">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-[#D4AF37]/30 text-[#D4AF37] font-semibold text-xs uppercase tracking-wider mb-4 border border-[#D4AF37]/40">
                    Regal Attire
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4 tracking-tight leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg text-[#F4F1EA]/85 mb-8 font-light leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Link href={slide.link}>
                    <Button size="lg" className="bg-[#1E3A8A] hover:bg-[#172554] text-white">
                      {slide.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-[#D4AF37] w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y border-[#E5DFD7] bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A]">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#111827]">{feature.title}</h4>
                    <p className="text-xs text-[#111827]/65">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 md:py-20 bg-[#F9F8F6]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#111827] mb-3">
              {t.attirePage.shopByCategory}
            </h2>
            <div className="w-12 h-0.5 bg-[#D4AF37] mx-auto" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-[#E5DFD7]/40 animate-pulse" />
              ))
            ) : (
              categories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  href={`/attire/products?category=${category.slug}`}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all border border-[#E5DFD7]"
                >
                  <Image
                    src={category.image || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&fit=crop'}
                    alt={category.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/85 via-[#0B192C]/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <h3 className="text-lg sm:text-xl font-serif font-bold mb-1">{category.name}</h3>
                    <span className="text-xs text-[#D4AF37] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {isAmharic ? 'ይመልከቱ' : 'Explore'} <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-20 bg-white border-y border-[#E5DFD7]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827]">
                {t.attirePage.newArrivals}
              </h2>
            </div>
            <Link
              href="/attire/products?filter=new"
              className="text-xs sm:text-sm font-semibold text-[#1E3A8A] flex items-center gap-1 hover:text-[#D4AF37] transition-colors"
            >
              {t.attirePage.viewAll} <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts?.newArrivals.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-16 bg-[#F9F8F6]">
        <div className="container mx-auto px-4">
          <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-xl border border-[#E5DFD7]">
            <Image
              src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1920&h=600&fit=crop"
              alt="Sale Banner"
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C]/95 via-[#0B192C]/80 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 sm:px-12 max-w-lg text-[#F4F1EA]">
                <span className="inline-block px-3 py-1 bg-[#D4AF37] text-[#111827] text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                  {isAmharic ? 'ልዩ የቅናሽ ወቅት' : 'Limited Offer'}
                </span>
                <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white mb-3">
                  {isAmharic ? 'እስከ 30% ቅናሽ' : 'Seasonal Collection'}
                </h2>
                <p className="text-[#F4F1EA]/85 mb-6 text-sm leading-relaxed">
                  {isAmharic ? 'በተመረጡ ክላሲክ አልባሳት ላይ ልዩ ቅናሽ ያግኙ' : 'Pure, modest essentials crafted for everyday dignity.'}
                </p>
                <Link href="/attire/products?sale=true">
                  <Button className="bg-[#D4AF37] hover:bg-[#B4942E] text-[#111827] font-bold">
                    {t.attirePage.onSale}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-16 md:py-20 bg-white border-t border-[#E5DFD7]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827]">
              {t.attirePage.bestsellers}
            </h2>
            <Link
              href="/attire/products?sort=popularity"
              className="text-xs sm:text-sm font-semibold text-[#1E3A8A] flex items-center gap-1 hover:text-[#D4AF37] transition-colors"
            >
              {t.attirePage.viewAll} <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts?.bestsellers.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
