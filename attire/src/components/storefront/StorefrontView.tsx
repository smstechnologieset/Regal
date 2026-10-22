'use client';

/**
 * StorefrontView Component
 *
 * Universal high-end storefront engine for Regal's specialized services:
 * -  Pure Skincare & Body Care (/skincare)
 * -  Grounded Childhood Toys (/toys)
 * - Mindful Journals & Reflection Tools (/journals)
 *
 * Features:
 * - Editorial hero with client manifesto and authenticity badges
 * - Category filter pills with bilingual support
 * - Search, sort, and stock filters (In Stock / Pre-Order)
 * - Product grid with quick view, add-to-cart, and pre-orders
 * - Route guard integration with ServiceDisabledCard
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Heart,
  Calendar,
  Clock,
  X,
  Check,
  Eye,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Product } from '@/types';
import { getProducts } from '@/lib/services/attire';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useServices } from '@/context/ServicesContext';
import ServiceDisabledCard from '@/components/common/ServiceDisabledCard';
import ProductCard from '@/components/product/ProductCard';
import { ALL_STOREFRONT_SEED_PRODUCTS } from '@/lib/data/seedStorefrontProducts';
import { formatPrice } from '@/lib/utils';

export interface SubcategoryFilter {
  id: string;
  name: string;
  nameAm: string;
}

export interface PurityBadgeItem {
  text: string;
  textAm: string;
}

interface StorefrontViewProps {
  serviceId: string;
  title: string;
  titleAm: string;
  tagline: string;
  taglineAm: string;
  manifesto: string;
  manifestoAm: string;
  heroImage: string;
  subcategories: SubcategoryFilter[];
  purityBadges: PurityBadgeItem[];
}

// Synchronize admin overrides instantaneously across storefront
function applyStorefrontOverrides(prods: Product[]): Product[] {
  if (typeof window === 'undefined' || !prods || prods.length === 0) return prods;
  try {
    const raw = localStorage.getItem('regal_storefront_overrides');
    if (!raw) return prods;
    const overrides: Record<string, any> = JSON.parse(raw);
    return prods.map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
  } catch {
    return prods;
  }
}

export default function StorefrontView({
  serviceId,
  title,
  titleAm,
  tagline,
  taglineAm,
  manifesto,
  manifestoAm,
  heroImage,
  subcategories,
  purityBadges,
}: StorefrontViewProps) {
  const { isAmharic, t } = useLanguage();
  const { isServiceEnabled } = useServices();
  const { addToCart, toggleCart } = useCart();
  const { addToast } = useApp();

  // Initialize with seed data + any admin local storage overrides for zero flicker
  const [products, setProducts] = useState<Product[]>(() =>
    applyStorefrontOverrides(ALL_STOREFRONT_SEED_PRODUCTS.filter((p) => p.category === serviceId))
  );
  const [loading, setLoading] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'preorder'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popularity'>('popularity');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Helper stock classification
  const isItemInStock = (p: Product) => Boolean(p.inStock && (p.stockCount ?? 0) > 0);
  const isItemPreorder = (p: Product) => !isItemInStock(p) && Boolean(p.allowPreorder);
  const isItemOutOfStock = (p: Product) => !isItemInStock(p) && !p.allowPreorder;

  // Real-time listener for admin catalog updates
  useEffect(() => {
    const handleSync = () => {
      setProducts((current) => applyStorefrontOverrides([...current]));
      if (quickViewProduct) {
        try {
          const raw = localStorage.getItem('regal_storefront_overrides');
          if (raw) {
            const overrides = JSON.parse(raw);
            if (overrides[quickViewProduct.id]) {
              setQuickViewProduct((prev) => (prev ? { ...prev, ...overrides[prev.id] } : null));
            }
          }
        } catch {}
      }
    };
    window.addEventListener('regal_products_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('regal_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [quickViewProduct]);

  // Check if service is disabled
  if (!isServiceEnabled(serviceId)) {
    return <ServiceDisabledCard serviceId={serviceId} serviceName={isAmharic ? titleAm : title} />;
  }

  useEffect(() => {
    let isCurrent = true;
    async function loadProducts() {
      setLoading(true);
      try {
        const filterOpts: any = { category: serviceId };
        if (selectedSubcategory !== 'all') {
          filterOpts.subcategory = selectedSubcategory;
        }

        const res = await getProducts(filterOpts, sortBy, 1, 50);
        const serverData = res?.data || [];
        if (isCurrent) {
          if (serverData.length > 0) {
            setProducts(applyStorefrontOverrides(serverData));
          } else {
            // Curated fallback
            let seeds = ALL_STOREFRONT_SEED_PRODUCTS.filter((p) => p.category === serviceId);
            if (selectedSubcategory !== 'all') {
              seeds = seeds.filter((p) => p.subcategory === selectedSubcategory);
            }
            setProducts(applyStorefrontOverrides(seeds));
          }
        }
      } catch (err) {
        console.warn(`[StorefrontView] Network issue for ${serviceId}, retaining catalog seeds:`, err);
        if (isCurrent) {
          let seeds = ALL_STOREFRONT_SEED_PRODUCTS.filter((p) => p.category === serviceId);
          if (selectedSubcategory !== 'all') {
            seeds = seeds.filter((p) => p.subcategory === selectedSubcategory);
          }
          setProducts(applyStorefrontOverrides(seeds));
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      isCurrent = false;
    };
  }, [serviceId, selectedSubcategory, sortBy]);

  // Filter products by stock & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery) {
        const matchName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchDesc = p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchName && !matchDesc) return false;
      }

      if (stockFilter === 'in_stock' && !isItemInStock(p)) return false;
      if (stockFilter === 'preorder' && !isItemPreorder(p)) return false;

      return true;
    });
  }, [products, searchQuery, stockFilter]);

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setActiveImageIdx(0);
    setSelectedSize(product.sizes?.[0] || '');
    setSelectedColor(product.colors?.[0] || null);
    setQuantity(1);
  };

  const handleAddToCart = (product: Product) => {
    if (isItemOutOfStock(product)) {
      addToast(
        isAmharic ? 'ይህ እቃ በአሁኑ ጊዜ አልቋል' : 'This product is currently out of stock',
        'error'
      );
      return;
    }
    const size = product.sizes?.[0] || 'Standard';
    const color = product.colors?.[0] || { name: 'Default', hex: '#000000' };
    const isPreorder = isItemPreorder(product);

    addToCart(product, size, color, 1, isPreorder);
    addToast(
      isPreorder
        ? (isAmharic ? `${product.name} ለቅድመ-ትዕዛዝ ታክሏል` : `Added ${product.name} to pre-orders`)
        : (isAmharic ? `${product.name} ወደ ቅርጫት ታክሏል` : `Added ${product.name} to cart`),
      'success'
    );
    toggleCart();
  };

  const handleModalAddToCart = () => {
    if (!quickViewProduct || isItemOutOfStock(quickViewProduct)) return;
    const size = selectedSize || quickViewProduct.sizes?.[0] || 'Standard';
    const color = selectedColor || quickViewProduct.colors?.[0] || { name: 'Default', hex: '#000000' };
    const isPreorder = isItemPreorder(quickViewProduct);

    addToCart(quickViewProduct, size, color, quantity, isPreorder);
    addToast(
      isPreorder
        ? (isAmharic ? `${quickViewProduct.name} ለቅድመ-ትዕዛዝ ታክሏል` : `Added ${quickViewProduct.name} to pre-orders`)
        : (isAmharic ? `${quickViewProduct.name} ወደ ቅርጫት ታክሏል` : `Added ${quickViewProduct.name} (${quantity}) to cart`),
      'success'
    );
    setQuickViewProduct(null);
    toggleCart();
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111827]">
      {/* Editorial Hero Banner */}
      <section className="relative min-h-[58vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F4EFEA] via-[#F9F8F6] to-[#F9F8F6] pt-28 pb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={title}
            fill
            priority
            unoptimized
            className="object-cover opacity-15 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F9F8F6] via-[#F9F8F6]/85 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E3A8A]/10 border border-[#1E3A8A]/20 text-[#1E3A8A] text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles size={14} />
            <span>{isAmharic ? taglineAm : tagline}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-[#111827] tracking-tight leading-tight mb-6">
            {isAmharic ? titleAm : title}
          </h1>

          {/* Client Manifesto Statement */}
          <div className="bg-white/70 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xs mb-8">
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-serif italic">
              &ldquo;{isAmharic ? manifestoAm : manifesto}&rdquo;
            </p>
          </div>

          {/* Purity Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {purityBadges.map((badge, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F9F8F6] border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37] shadow-2xs"
              >
                <Check size={13} className="text-[#1E3A8A]" />
                <span>{isAmharic ? badge.textAm : badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="py-12 bg-[#F9F8F6]">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Subcategory Filter Pills */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                selectedSubcategory === 'all'
                  ? 'bg-[#1E3A8A] text-[#F4F1EA] shadow-sm'
                  : 'bg-white border border-[#E5DFD7] text-slate-700 hover:bg-[#F4EFEA]'
              }`}
            >
              {isAmharic ? 'ሁሉም ስብስቦች' : 'All Collections'}
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.id)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedSubcategory === sub.id
                    ? 'bg-[#1E3A8A] text-[#F4F1EA] shadow-sm'
                    : 'bg-white border border-[#E5DFD7] text-slate-700 hover:bg-[#F4EFEA]'
                }`}
              >
                {isAmharic ? sub.nameAm : sub.name}
              </button>
            ))}
          </div>

          {/* Search, Stock, and Sort Bar */}
          <div className="bg-white rounded-2xl border border-[#E5DFD7] p-4 mb-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isAmharic ? 'በዚህ ስብስብ ውስጥ ፈልግ...' : `Search in ${title}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#F9F8F6] border border-[#E5DFD7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Stock Filter */}
              <div className="flex items-center gap-1 bg-[#F9F8F6] p-1 rounded-xl border border-[#E5DFD7] text-xs">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    stockFilter === 'all' ? 'bg-white text-[#1E3A8A] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {isAmharic ? 'ሁሉም' : 'All'}
                </button>
                <button
                  onClick={() => setStockFilter('in_stock')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    stockFilter === 'in_stock' ? 'bg-white text-[#1E3A8A] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {isAmharic ? 'ያሉ' : 'In Stock'}
                </button>
                <button
                  onClick={() => setStockFilter('preorder')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    stockFilter === 'preorder' ? 'bg-white text-[#1E3A8A] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {isAmharic ? 'ቅድመ-ትዕዛዝ' : 'Pre-Order'}
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-2 text-xs bg-[#F9F8F6] border border-[#E5DFD7] rounded-xl text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="popularity">{isAmharic ? 'በተወዳጅነት' : 'Most Popular'}</option>
                <option value="newest">{isAmharic ? 'አዳዲስ' : 'Newest'}</option>
                <option value="price-asc">{isAmharic ? 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ' : 'Price: Low to High'}</option>
                <option value="price-desc">{isAmharic ? 'ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-slate-200/60 rounded-2xl aspect-[3/4]" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E5DFD7] p-12 text-center max-w-md mx-auto shadow-xs">
              <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-serif font-bold text-slate-800 mb-2">
                {isAmharic ? 'ምንም እቃዎች አልተገኙም' : 'No Products Found'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {isAmharic
                  ? 'እባክዎ የተመረጡትን ማጣሪያዎች ይቀይሩ ወይም ጽሁፍዎን ያስተካክሉ።'
                  : 'Try adjusting your search query or filters to find what you are looking for.'}
              </p>
              <button
                onClick={() => {
                  setSelectedSubcategory('all');
                  setStockFilter('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2 rounded-xl bg-[#1E3A8A] text-[#F4F1EA] text-xs font-semibold"
              >
                {isAmharic ? 'ማጣሪያዎችን አጽዳ' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleOpenQuickView(product)}
                  className="group relative bg-white rounded-2xl border border-[#E5DFD7] hover:border-[#1E3A8A]/40 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="aspect-[4/5] relative overflow-hidden bg-[#F4EFEA]">
                    <Image
                      src={product.images[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop'}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                      {product.badges?.map((badge) => (
                        <span
                          key={badge}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#1E3A8A] shadow-2xs"
                        >
                          {badge}
                        </span>
                      ))}
                      {isItemPreorder(product) && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37] text-[#111827] shadow-2xs font-semibold">
                          {isAmharic ? 'ቅድመ-ትዕዛዝ' : 'Pre-Order'}
                        </span>
                      )}
                    </div>

                    {/* Out of Stock Overlay when Pre-Order is OFF */}
                    {isItemOutOfStock(product) && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white shadow-md">
                          {isAmharic ? 'ያለቀ' : 'Out of Stock'}
                        </span>
                      </div>
                    )}

                    {/* Quick View Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenQuickView(product);
                      }}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer z-10"
                      title="Quick View"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                        {product.subcategory || serviceId}
                      </div>
                      <h3 className="font-serif font-bold text-base text-[#111827] group-hover:text-[#1E3A8A] transition-colors line-clamp-1 mb-1.5">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-sans font-bold text-base text-[#111827]">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-slate-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </div>

                      {isItemInStock(product) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1E3A8A] hover:bg-[#172554] text-[#F4F1EA] transition-all shadow-2xs cursor-pointer"
                        >
                          <ShoppingBag size={14} />
                          <span>{isAmharic ? 'ይግዙ' : 'Add'}</span>
                        </button>
                      ) : isItemPreorder(product) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#D4AF37] hover:bg-[#B4942E] text-[#111827] transition-all shadow-2xs cursor-pointer"
                        >
                          <Clock size={14} />
                          <span>{isAmharic ? 'ቅድመ-ይዘዙ' : 'Pre-Order'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        >
                          <X size={14} />
                          <span>{isAmharic ? 'ያለቀ' : 'Out of Stock'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setQuickViewProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-8 relative shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky / Always-Visible Close Button for Mobile & Desktop */}
            <div className="sticky top-0 z-50 flex justify-end -mt-1 -mr-1 mb-2 pointer-events-none">
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="pointer-events-auto w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-black shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                aria-label="Close modal"
              >
                <X size={20} className="stroke-[2.5]" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Product Image Gallery with multi-photo switcher */}
              <div className="flex flex-col gap-3">
                <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-slate-100 group">
                  <Image
                    src={quickViewProduct.images[activeImageIdx] || quickViewProduct.images[0] || ''}
                    alt={quickViewProduct.name}
                    fill
                    unoptimized
                    className="object-cover transition-all duration-300"
                  />

                  {/* Previous / Next buttons if multiple images */}
                  {quickViewProduct.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : quickViewProduct.images.length - 1));
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all cursor-pointer opacity-95 sm:opacity-0 group-hover:opacity-100"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx((prev) => (prev < quickViewProduct.images.length - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all cursor-pointer opacity-95 sm:opacity-0 group-hover:opacity-100"
                        aria-label="Next photo"
                      >
                        <ChevronRight size={18} />
                      </button>
                      {/* Photo counter badge */}
                      <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        {activeImageIdx + 1} / {quickViewProduct.images.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Multiple Photos Thumbnail Strip */}
                {quickViewProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {quickViewProduct.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden relative shrink-0 border-2 transition-all cursor-pointer ${
                          activeImageIdx === idx
                            ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/30 scale-102'
                            : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                        }`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${quickViewProduct.name} - ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
                    {quickViewProduct.subcategory}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#111827] mt-1 mb-2">
                    {quickViewProduct.name}
                  </h2>
                  <div className="text-xl font-bold text-[#1E3A8A] mb-4">
                    {formatPrice(quickViewProduct.price)}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {quickViewProduct.description}
                  </p>

                  {/* Stock status indicator */}
                  <div className="mb-4">
                    {isItemInStock(quickViewProduct) ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                        <ShieldCheck size={14} />
                        <span>
                          {isAmharic
                            ? `በመጋዘን ውስጥ አለ (${quickViewProduct.stockCount})`
                            : `In Stock (${quickViewProduct.stockCount} available)`}
                        </span>
                      </div>
                    ) : isItemPreorder(quickViewProduct) ? (
                      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-3 text-xs text-[#8C6D28]">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <Clock size={14} />
                          <span>{isAmharic ? 'ለቅድመ-ትዕዛዝ ዝግጁ ነው' : 'Available for Pre-Order'}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {isAmharic
                            ? 'ይህ እቃ በአሁኑ ጊዜ በመጋዘን ያበቃ ሲሆን አስቀድመው በማዘዝ በቀጥታ ማግኘት ይችላሉ።'
                            : `Estimated delivery in ${quickViewProduct.estimatedDeliveryDays || 14} days.`}
                        </p>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                        <X size={14} />
                        <span>{isAmharic ? 'ይህ እቃ በአሁኑ ጊዜ አልቋል' : 'Currently Out of Stock'}</span>
                      </div>
                    )}
                  </div>

                  {/* Size options */}
                  {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        {isAmharic ? 'መጠን / ይዘት' : 'Size / Volume'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {quickViewProduct.sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                              selectedSize === s
                                ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                                : 'border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Add to cart CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  {!isItemOutOfStock(quickViewProduct) && (
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-2 text-xs font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleModalAddToCart}
                    disabled={isItemOutOfStock(quickViewProduct)}
                    className={`flex-1 py-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      isItemInStock(quickViewProduct)
                        ? 'bg-[#1E3A8A] hover:bg-[#172554] text-white cursor-pointer'
                        : isItemPreorder(quickViewProduct)
                        ? 'bg-[#D4AF37] hover:bg-[#B4942E] text-[#111827] font-semibold cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {isItemInStock(quickViewProduct) ? (
                      <>
                        <ShoppingBag size={16} />
                        <span>{isAmharic ? 'ወደ ቅርጫት ጨምር' : 'Add to Cart'}</span>
                      </>
                    ) : isItemPreorder(quickViewProduct) ? (
                      <>
                        <Clock size={16} />
                        <span>{isAmharic ? 'ቅድመ-ትዕዛዝ ያረጋግጡ' : 'Confirm Pre-Order'}</span>
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        <span>{isAmharic ? 'ያለቀ' : 'Out of Stock'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* View Full Product Details Link */}
                <div className="pt-3 text-center">
                  <Link
                    href={`/${serviceId}/products/${quickViewProduct.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:text-[#0B192C] transition-colors group cursor-pointer"
                  >
                    <span>{isAmharic ? 'ሙሉ ዝርዝሮችን ይመልከቱ' : 'View Full Product Details'}</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
