'use client';

/**
 * StorefrontView Component
 *
 * Universal high-end storefront engine for Regal's specialized services:
 * - 🌸 Pure Skincare & Body Care (/skincare)
 * - 🧸 Grounded Childhood Toys (/toys)
 * - 📖 Mindful Journals & Reflection Tools (/journals)
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
  X,
  Check,
  Eye,
} from 'lucide-react';
import { Product } from '@/types';
import { getProducts } from '@/lib/services/attire';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useServices } from '@/context/ServicesContext';
import ServiceDisabledCard from '@/components/common/ServiceDisabledCard';
import ProductCard from '@/components/product/ProductCard';
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

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'preorder'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popularity'>('popularity');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

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
        if (isCurrent) {
          setProducts(res.data || []);
        }
      } catch (err) {
        console.error(`Error loading ${serviceId} products:`, err);
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

      if (stockFilter === 'in_stock' && !p.inStock) return false;
      if (stockFilter === 'preorder' && (!p.allowPreorder || p.inStock)) return false;

      return true;
    });
  }, [products, searchQuery, stockFilter]);

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setSelectedSize(product.sizes?.[0] || '');
    setSelectedColor(product.colors?.[0] || null);
    setQuantity(1);
  };

  const handleAddToCart = (product: Product) => {
    const size = product.sizes?.[0] || 'Standard';
    const color = product.colors?.[0] || { name: 'Default', hex: '#000000' };
    const isPreorder = !product.inStock && !!product.allowPreorder;

    addToCart(product, size, color, 1, isPreorder);
    addToast(
      isAmharic ? `${product.name} ወደ ቅርጫት ታክሏል` : `Added ${product.name} to cart`,
      'success'
    );
    toggleCart();
  };

  const handleModalAddToCart = () => {
    if (!quickViewProduct) return;
    const size = selectedSize || quickViewProduct.sizes?.[0] || 'Standard';
    const color = selectedColor || quickViewProduct.colors?.[0] || { name: 'Default', hex: '#000000' };
    const isPreorder = !quickViewProduct.inStock && !!quickViewProduct.allowPreorder;

    addToCart(quickViewProduct, size, color, quantity, isPreorder);
    addToast(
      isAmharic
        ? `${quickViewProduct.name} ወደ ቅርጫት ታክሏል`
        : `Added ${quickViewProduct.name} (${quantity}) to cart`,
      'success'
    );
    setQuickViewProduct(null);
    toggleCart();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2B2D2F]">
      {/* Editorial Hero Banner */}
      <section className="relative min-h-[58vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F4EFEA] via-[#FDFBF7] to-[#FDFBF7] pt-28 pb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={title}
            fill
            priority
            unoptimized
            className="object-cover opacity-15 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/85 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 text-[#4A5D4E] text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles size={14} />
            <span>{isAmharic ? taglineAm : tagline}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-[#2B2D2F] tracking-tight leading-tight mb-6">
            {isAmharic ? titleAm : title}
          </h1>

          {/* Client Manifesto Statement */}
          <div className="bg-white/70 backdrop-blur-md border border-[#C5A059]/25 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xs mb-8">
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-serif italic">
              &ldquo;{isAmharic ? manifestoAm : manifesto}&rdquo;
            </p>
          </div>

          {/* Purity Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {purityBadges.map((badge, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FDFBF7] border border-[#C5A059]/40 text-xs font-semibold text-[#8C6D28] shadow-2xs"
              >
                <Check size={13} className="text-[#4A5D4E]" />
                <span>{isAmharic ? badge.textAm : badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="py-12 bg-[#FDFBF7]">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Subcategory Filter Pills */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                selectedSubcategory === 'all'
                  ? 'bg-[#4A5D4E] text-white shadow-sm'
                  : 'bg-white border border-[#E0D6C8] text-slate-700 hover:bg-[#F4EFEA]'
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
                    ? 'bg-[#4A5D4E] text-white shadow-sm'
                    : 'bg-white border border-[#E0D6C8] text-slate-700 hover:bg-[#F4EFEA]'
                }`}
              >
                {isAmharic ? sub.nameAm : sub.name}
              </button>
            ))}
          </div>

          {/* Search, Stock, and Sort Bar */}
          <div className="bg-white rounded-2xl border border-[#E0D6C8] p-4 mb-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isAmharic ? 'በዚህ ስብስብ ውስጥ ፈልግ...' : `Search in ${title}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#FDFBF7] border border-[#E0D6C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Stock Filter */}
              <div className="flex items-center gap-1 bg-[#FDFBF7] p-1 rounded-xl border border-[#E0D6C8] text-xs">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    stockFilter === 'all' ? 'bg-white text-[#4A5D4E] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {isAmharic ? 'ሁሉም' : 'All'}
                </button>
                <button
                  onClick={() => setStockFilter('in_stock')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    stockFilter === 'in_stock' ? 'bg-white text-[#4A5D4E] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {isAmharic ? 'ያሉ' : 'In Stock'}
                </button>
                <button
                  onClick={() => setStockFilter('preorder')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    stockFilter === 'preorder' ? 'bg-white text-[#4A5D4E] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  {isAmharic ? 'ቅድመ-ትዕዛዝ' : 'Pre-Order'}
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-2 text-xs bg-[#FDFBF7] border border-[#E0D6C8] rounded-xl text-slate-700 font-medium focus:outline-none cursor-pointer"
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
            <div className="bg-white rounded-3xl border border-[#E0D6C8] p-12 text-center max-w-md mx-auto shadow-xs">
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
                className="px-5 py-2 rounded-xl bg-[#4A5D4E] text-white text-xs font-semibold"
              >
                {isAmharic ? 'ማጣሪያዎችን አጽዳ' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-2xl border border-[#E0D6C8] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Image Container */}
                  <div className="aspect-[4/5] relative overflow-hidden bg-[#F4EFEA]">
                    <Image
                      src={product.images[0] || 'https://images.unsplash.com/photo-1608248597359-0091ff62a49f?w=800&h=800&fit=crop'}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.badges?.map((badge) => (
                        <span
                          key={badge}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#4A5D4E] shadow-2xs"
                        >
                          {badge}
                        </span>
                      ))}
                      {!product.inStock && product.allowPreorder && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C5A059] text-white shadow-2xs">
                          {isAmharic ? 'ቅድመ-ትዕዛዝ' : 'Pre-Order'}
                        </span>
                      )}
                    </div>

                    {/* Quick View Button */}
                    <button
                      onClick={() => handleOpenQuickView(product)}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Quick View"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-[#C5A059] uppercase tracking-wider mb-1">
                        {product.subcategory || serviceId}
                      </div>
                      <h3 className="font-serif font-bold text-base text-[#2B2D2F] group-hover:text-[#4A5D4E] transition-colors line-clamp-1 mb-1.5">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-sans font-bold text-base text-[#2B2D2F]">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-slate-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          !product.inStock && product.allowPreorder
                            ? 'bg-[#C5A059] hover:bg-[#b08b45] text-white'
                            : 'bg-[#4A5D4E] hover:bg-[#3d4d40] text-white'
                        }`}
                      >
                        <ShoppingBag size={14} />
                        <span>
                          {!product.inStock && product.allowPreorder
                            ? isAmharic
                              ? 'ቅድመ-ይዘዙ'
                              : 'Pre-Order'
                            : isAmharic
                            ? 'ይግዙ'
                            : 'Add'}
                        </span>
                      </button>
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setQuickViewProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-slate-100">
                <Image
                  src={quickViewProduct.images[0] || ''}
                  alt={quickViewProduct.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#C5A059] uppercase tracking-wider">
                    {quickViewProduct.subcategory}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#2B2D2F] mt-1 mb-2">
                    {quickViewProduct.name}
                  </h2>
                  <div className="text-xl font-bold text-[#4A5D4E] mb-4">
                    {formatPrice(quickViewProduct.price)}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {quickViewProduct.description}
                  </p>

                  {/* Pre-order notification badge */}
                  {!quickViewProduct.inStock && quickViewProduct.allowPreorder && (
                    <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-3 mb-4 text-xs text-[#8C6D28]">
                      <span className="font-bold">
                        {isAmharic ? 'የቅድመ-ትዕዛዝ ማስታወሻ፡' : 'Pre-Order Item:'}
                      </span>{' '}
                      {isAmharic
                        ? 'ይህ እቃ በአሁኑ ጊዜ በመዘጋጀት ላይ ሲሆን በቅርቡ ይደርሰዎታል።'
                        : `Estimated delivery in ${quickViewProduct.estimatedDeliveryDays || 14} days.`}
                    </div>
                  )}

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
                                ? 'border-[#4A5D4E] bg-[#4A5D4E] text-white'
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
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-xs font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleModalAddToCart}
                    className="flex-1 py-3 rounded-xl bg-[#4A5D4E] hover:bg-[#3d4d40] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <ShoppingBag size={16} />
                    <span>
                      {!quickViewProduct.inStock && quickViewProduct.allowPreorder
                        ? isAmharic
                          ? 'ቅድመ-ትዕዛዝ ያረጋግጡ'
                          : 'Confirm Pre-Order'
                        : isAmharic
                        ? 'ወደ ቅርጫት ጨምር'
                        : 'Add to Cart'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
