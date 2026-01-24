'use client';

/**
 * Attire Store Home Page
 * 
 * Landing page for Attire clothing store featuring:
 * - Hero banner with CTA
 * - Category grid
 * - Featured collections (New Arrivals, Bestsellers, On Sale)
 * - Promotional banners
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, RefreshCw, Shield, Clock } from 'lucide-react';
import { Product, Category } from '@/types';
import { getFeaturedProducts, getCategories } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';

// Hero banner images
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop',
    title: 'New Season Arrivals',
    subtitle: 'Discover the latest trends in fashion',
    cta: 'Shop Now',
    link: '/attire/products?filter=new',
  },
  {
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop',
    title: 'Winter Collection',
    subtitle: 'Stay warm in style',
    cta: 'Explore',
    link: '/attire/products?category=women',
  },
];

// Features/USPs
const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over ETB 500' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: Clock, title: '24/7 Support', desc: 'Here to help anytime' },
];

export default function AttireHomePage() {
  const { categories, categoriesLoading, addToast } = useApp();
  const [featuredProducts, setFeaturedProducts] = useState<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { addToCart, toggleCart } = useCart();

  // Fetch featured products and categories
  useEffect(() => {
    const controller = new AbortController();
    console.log('AttireHomePage: Mount Effect Triggered');

    const fetchData = async () => {
      console.log('AttireHomePage: Starting fetchData...');
      try {
        const productsData = await getFeaturedProducts(controller.signal);

        if (!controller.signal.aborted) {
          console.log('AttireHomePage: fetchData Success', !!productsData);
          setFeaturedProducts(productsData);
          setLoading(false);
          console.log('AttireHomePage: fetchData Complete (loading state set to false)');
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('AttireHomePage: fetchData aborted');
          return;
        }
        console.error('AttireHomePage: fetchData Error:', error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      console.log('AttireHomePage: Unmounting (aborting fetch)...');
      controller.abort();
    };
  }, []);

  // Auto-rotate hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Quick add handler
  const handleQuickAdd = (product: Product) => {
    // Add with first available size and color
    if (product.sizes[0] && product.colors[0]) {
      addToCart(product, product.sizes[0], product.colors[0], 1);
      addToast(`${product.name} added to cart!`, 'success');
      toggleCart();
    }
  };


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              unoptimized
              priority={index === 0}
              className="object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-xl">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in-up">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl text-white/80 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {slide.subtitle}
                  </p>
                  <Link href={slide.link}>
                    <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} />}>
                      {slide.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <feature.icon size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-white/60">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl bg-slate-100 animate-pulse" />
              ))
            ) : (
              categories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  href={`/attire/products?category=${category.slug}`}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden"
                >
                  <Image
                    src={category.image || ''}
                    alt={category.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                    <span className="text-sm text-white/80 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Shop Now <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              New Arrivals
            </h2>
            <Link
              href="/attire/products?filter=new"
              className="text-sm font-medium text-primary flex items-center gap-1 hover:text-secondary transition-colors"
            >
              View All <ArrowRight size={14} />
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
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1920&h=600&fit=crop"
              alt="Sale Banner"
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-600/90 to-rose-600/50" />
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div>
                <span className="inline-block px-4 py-1 bg-white/20 text-white text-sm font-medium rounded-full mb-4">
                  Limited Time Offer
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Up to 50% Off
                </h2>
                <p className="text-white/90 mb-6 text-lg">
                  Shop our biggest sale of the season
                </p>
                <Link href="/attire/products?sale=true">
                  <Button variant="primary" size="lg">
                    Shop Sale
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Bestsellers
            </h2>
            <Link
              href="/attire/products?sort=popularity"
              className="text-sm font-medium text-primary flex items-center gap-1 hover:text-secondary transition-colors"
            >
              View All <ArrowRight size={14} />
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

      {/* On Sale */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              On Sale
            </h2>
            <Link
              href="/attire/products?sale=true"
              className="text-sm font-medium text-primary flex items-center gap-1 hover:text-secondary transition-colors"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts?.onSale.slice(0, 4).map((product) => (
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

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Join the Attire Community
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Subscribe to our newsletter for exclusive deals, early access to new arrivals, and style inspiration.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-rose-500"
            />
            <Button variant="secondary" type="submit">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
