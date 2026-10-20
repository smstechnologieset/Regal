'use client';

/**
 * ServiceCatalogManager Component
 *
 * Dedicated admin catalog manager for Regal's new services:
 * -  Pure Skincare & Body Care
 * -  Grounded Childhood Toys
 * - Mindful Journals & Reflection Tools
 *
 * Provides complete CRUD, stock control, pre-order management, and image configuration.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Calendar,
  Sparkles,
  ShoppingBag,
  Clock,
  Eye,
} from 'lucide-react';
import { Product } from '@/types';
import { useApp } from '@/context/AppContext';
import { formatPrice, cn } from '@/lib/utils';
import ImageUpload from './ImageUpload';

interface SubcategoryOption {
  id: string;
  name: string;
}

interface ServiceCatalogManagerProps {
  serviceId: string;
  serviceTitle: string;
  serviceColor: string;
  subcategories: SubcategoryOption[];
  initialSeedProducts: Product[];
}

export default function ServiceCatalogManager({
  serviceId,
  serviceTitle,
  serviceColor,
  subcategories,
  initialSeedProducts,
}: ServiceCatalogManagerProps) {
  const { addToast, showApiError } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'preorder'>('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    subcategory: subcategories[0]?.id || '',
    sizes: [] as string[],
    in_stock: true,
    stock_count: '10',
    images: [] as string[],
    badges: [] as string[],
    allow_preorder: true,
    estimated_restock_date: '',
    estimated_delivery_days: '14',
  });

  const [sizeInput, setSizeInput] = useState('');

  // Normalization helper to bridge snake_case API with camelCase Product type
  const normalizeProduct = (p: any): Product => {
    const rawStock = p.stock_count !== undefined ? Number(p.stock_count) : (p.stockCount !== undefined ? Number(p.stockCount) : 0);
    const stock = isNaN(rawStock) ? 0 : rawStock;
    const rawInStock = p.in_stock !== undefined ? Boolean(p.in_stock) : (p.inStock !== undefined ? Boolean(p.inStock) : stock > 0);
    const inStock = stock > 0 ? rawInStock : false;

    return {
      id: p.id,
      name: p.name || '',
      description: p.description || '',
      price: Number(p.price) || 0,
      originalPrice: p.original_price != null ? Number(p.original_price) : (p.originalPrice != null ? Number(p.originalPrice) : undefined),
      category: p.category || serviceId,
      subcategory: p.subcategory || '',
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      colors: Array.isArray(p.colors) ? p.colors : [],
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop'],
      badges: Array.isArray(p.badges) ? p.badges : [],
      rating: Number(p.rating) || 5.0,
      reviewCount: Number(p.review_count ?? p.reviewCount) || 0,
      popularity: Number(p.popularity) || 50,
      createdAt: p.created_at || p.createdAt || new Date().toISOString(),
      inStock,
      stockCount: stock,
      allowPreorder: p.allow_preorder !== undefined ? Boolean(p.allow_preorder) : (p.allowPreorder !== undefined ? Boolean(p.allowPreorder) : true),
      estimatedRestockDate: p.estimated_restock_date || p.estimatedRestockDate || undefined,
      preorderCount: Number(p.preorder_count ?? p.preorderCount) || 0,
      estimatedDeliveryDays: Number(p.estimated_delivery_days ?? p.estimatedDeliveryDays) || 14,
    };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/catalog/attire/products?service=${serviceId}`);
      let serverProducts: Product[] = [];
      if (res.ok) {
        const data = await res.json();
        serverProducts = (data.products || [])
          .filter((p: any) => p.category === serviceId)
          .map(normalizeProduct);
      }

      let baseList = serverProducts.length > 0
        ? serverProducts
        : initialSeedProducts.map(normalizeProduct);

      // Merge local storage overrides if any exist
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('regal_storefront_overrides');
          if (raw) {
            const overrides = JSON.parse(raw);
            baseList = baseList.map((p) => {
              if (overrides[p.id]) {
                return normalizeProduct({ ...p, ...overrides[p.id] });
              }
              return p;
            });
          }
        } catch (e) {}
      }

      setProducts(baseList);
    } catch (err) {
      console.warn(`Error fetching ${serviceId} products, using seeds:`, err);
      let baseList = initialSeedProducts.map(normalizeProduct);
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('regal_storefront_overrides');
          if (raw) {
            const overrides = JSON.parse(raw);
            baseList = baseList.map((p) => {
              if (overrides[p.id]) {
                return normalizeProduct({ ...p, ...overrides[p.id] });
              }
              return p;
            });
          }
        } catch (e) {}
      }
      setProducts(baseList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [serviceId]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const stock = product.stockCount ?? (product as any).stock_count ?? 0;
      const rawInStock = product.inStock ?? (product as any).in_stock ?? (stock > 0);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        original_price: (product.originalPrice ?? (product as any).original_price)?.toString() || '',
        subcategory: product.subcategory || subcategories[0]?.id || '',
        sizes: product.sizes || [],
        in_stock: stock > 0 ? rawInStock : false,
        stock_count: stock.toString(),
        images: product.images || [],
        badges: product.badges || [],
        allow_preorder: product.allowPreorder ?? (product as any).allow_preorder ?? true,
        estimated_restock_date: (product.estimatedRestockDate || (product as any).estimated_restock_date)
          ? new Date(product.estimatedRestockDate || (product as any).estimated_restock_date).toISOString().split('T')[0]
          : '',
        estimated_delivery_days: (product.estimatedDeliveryDays ?? (product as any).estimated_delivery_days)?.toString() || '14',
      });
      setSizeInput((product.sizes || []).join(', '));
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        original_price: '',
        subcategory: subcategories[0]?.id || '',
        sizes: [],
        in_stock: true,
        stock_count: '15',
        images: [],
        badges: ['new'],
        allow_preorder: true,
        estimated_restock_date: '',
        estimated_delivery_days: '14',
      });
      setSizeInput('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      addToast('Please enter a product name and price', 'error');
      return;
    }

    const price = parseFloat(formData.price) || 0;
    const originalPrice = formData.original_price ? parseFloat(formData.original_price) : null;

    if (originalPrice !== null && originalPrice <= price) {
      addToast('Original Price must be greater than current Price to create a Sale', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const parsedSizes = sizeInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const stockNum = parseInt(formData.stock_count) || 0;
      // Auto-sync in_stock: if stock count > 0, the item is in stock!
      const effectiveInStock = stockNum > 0 ? (formData.in_stock ?? true) : false;

      const payload = {
        name: formData.name,
        description: formData.description,
        price,
        original_price: originalPrice,
        category: serviceId,
        subcategory: formData.subcategory,
        sizes: parsedSizes,
        colors: [{ name: 'Standard', hex: '#4A5D4E' }],
        images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop'],
        badges: formData.badges,
        in_stock: effectiveInStock,
        stock_count: stockNum,
        allow_preorder: formData.allow_preorder,
        estimated_restock_date: formData.estimated_restock_date
          ? new Date(formData.estimated_restock_date).toISOString()
          : null,
        estimated_delivery_days: formData.estimated_delivery_days
          ? parseInt(formData.estimated_delivery_days)
          : 14,
        id: editingProduct
          ? editingProduct.id
          : `${serviceId}-${Date.now()}`,
      };

      const url = editingProduct
        ? `/api/admin/catalog/attire/products/${editingProduct.id}`
        : '/api/admin/catalog/attire/products';

      const res = await fetch(url, {
        method: editingProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Optimistically update local list with normalized product
      let savedProduct: Product;
      if (editingProduct) {
        savedProduct = normalizeProduct({
          ...editingProduct,
          ...payload,
          inStock: effectiveInStock,
          stockCount: stockNum,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? savedProduct : p))
        );
        addToast(`${formData.name} updated successfully`, 'success');
      } else {
        savedProduct = normalizeProduct({
          ...payload,
          inStock: effectiveInStock,
          stockCount: stockNum,
          createdAt: new Date().toISOString(),
          rating: 5.0,
          reviewCount: 0,
          popularity: 50,
        });
        setProducts((prev) => [savedProduct, ...prev]);
        addToast(`${formData.name} created successfully`, 'success');
      }

      // Persist to local storage overrides immediately
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('regal_storefront_overrides');
          const overrides = raw ? JSON.parse(raw) : {};
          overrides[savedProduct.id] = savedProduct;
          localStorage.setItem('regal_storefront_overrides', JSON.stringify(overrides));
          window.dispatchEvent(new CustomEvent('regal_products_updated', { detail: savedProduct }));
        } catch (e) {}
      }

      setIsModalOpen(false);
      // Background re-fetch
      fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showApiError(err, 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      // Optimistic delete
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('regal_storefront_overrides');
          const overrides = raw ? JSON.parse(raw) : {};
          delete overrides[id];
          localStorage.setItem('regal_storefront_overrides', JSON.stringify(overrides));
          window.dispatchEvent(new CustomEvent('regal_products_updated', { detail: { id, deleted: true } }));
        } catch (e) {}
      }
      addToast(`Deleted ${name}`, 'success');

      await fetch(`/api/admin/catalog/attire/products/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showApiError(err, 'Failed to delete product');
      fetchProducts();
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSub = !subcategoryFilter || p.subcategory === subcategoryFilter;

      let matchStock = true;
      if (stockFilter === 'in_stock') matchStock = p.inStock;
      if (stockFilter === 'out_of_stock') matchStock = !p.inStock;
      if (stockFilter === 'preorder') matchStock = !p.inStock && !!p.allowPreorder;

      return matchSearch && matchSub && matchStock;
    });
  }, [products, searchTerm, subcategoryFilter, stockFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span>{serviceTitle}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {products.length} Products
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage product catalog, inventory stock, pre-order dates, and imagery.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Add {serviceTitle} Item</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${serviceTitle} products...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
          />
        </div>

        <select
          value={subcategoryFilter}
          onChange={(e) => setSubcategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
        >
          <option value="">All Categories</option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
        >
          <option value="all">All Inventory</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="preorder">Pre-Order Enabled</option>
        </select>
      </div>

      {/* Products Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#4A5D4E]" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust filters or create a new item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const hasStock = p.inStock && (p.stockCount ?? 0) > 0;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden group shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Image Container */}
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingBag size={40} />
                    </div>
                  )}

                  {/* Action Buttons on Hover */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-2 bg-white/95 rounded-xl shadow-sm text-slate-700 hover:text-emerald-700 hover:bg-white transition-all cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-2 bg-white/95 rounded-xl shadow-sm text-slate-700 hover:text-rose-600 hover:bg-white transition-all cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Badges on Top Left */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {p.badges?.includes('new') && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        NEW
                      </span>
                    )}
                    {p.badges?.includes('bestseller') && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        BEST SELLER
                      </span>
                    )}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        SALE
                      </span>
                    )}
                    {p.allowPreorder && (
                      <span className="bg-[#C5A059] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        PRE-ORDER
                      </span>
                    )}
                  </div>

                  {/* Out of Stock Overlay */}
                  {!hasStock && (
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
                      <span className="bg-white/95 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                        {p.allowPreorder ? 'Pre-Order Available' : 'Out of Stock'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="font-semibold text-slate-900 truncate flex-1 text-sm" title={p.name}>
                        {p.name}
                      </h3>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatPrice(p.price)}
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatPrice(p.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 truncate capitalize">
                      {subcategories.find((s) => s.id === p.subcategory)?.name || p.subcategory || serviceTitle}
                    </p>
                    {p.sizes && p.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.sizes.map((sz) => (
                          <span key={sz} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {sz}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span
                      className={cn(
                        'font-semibold px-2 py-0.5 rounded-full text-[10px]',
                        hasStock
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      )}
                    >
                      {hasStock ? `Stock: ${p.stockCount}` : `Out of Stock (${p.stockCount ?? 0})`}
                    </span>

                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                        p.allowPreorder
                          ? 'bg-[#C5A059]/15 text-[#8C6D28] border border-[#C5A059]/30'
                          : 'text-slate-400 bg-slate-100'
                      )}
                    >
                      {p.allowPreorder ? 'Pre-Order: ON' : 'Pre-Order: OFF'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-bold text-primary">
                {editingProduct ? `Edit ${editingProduct.name}` : `New ${serviceTitle} Item`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pure Nilotica Shea Butter"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4A5D4E] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Manifesto, botanical ingredients, craftsmanship..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4A5D4E] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (ETB) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1200"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4A5D4E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original Price (Optional, for Sale badge)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="1500"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4A5D4E] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subcategory
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4A5D4E] outline-none"
                  >
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sizes / Volumes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    placeholder="100ml, 250ml or A5, B5"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4A5D4E] outline-none"
                  />
                </div>
              </div>

              {/* Inventory & Stock */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Inventory Status</p>
                    <p className="text-[11px] text-slate-500">Is this product available for instant delivery?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.in_stock}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          in_stock: checked,
                          stock_count: checked && (parseInt(prev.stock_count) || 0) <= 0 ? '10' : (!checked ? '0' : prev.stock_count),
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A5D4E]" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Stock Count</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_count}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseInt(val) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          stock_count: val,
                          in_stock: num > 0 ? true : (num === 0 ? false : prev.in_stock),
                        }));
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-Order Settings */}
              <div className="bg-[#C5A059]/10 p-4 rounded-2xl border border-[#C5A059]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#8C6D28]">Pre-Order Settings</p>
                    <p className="text-[11px] text-slate-600">
                      Allow customers to pre-order when out of stock
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_preorder}
                      onChange={(e) =>
                        setFormData({ ...formData, allow_preorder: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]" />
                  </label>
                </div>

                {formData.allow_preorder && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Estimated Restock Date
                      </label>
                      <input
                        type="date"
                        value={formData.estimated_restock_date}
                        onChange={(e) =>
                          setFormData({ ...formData, estimated_restock_date: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Estimated Delivery Days
                      </label>
                      <input
                        type="number"
                        value={formData.estimated_delivery_days}
                        onChange={(e) =>
                          setFormData({ ...formData, estimated_delivery_days: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Images */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Images (Local Upload or URL)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.images.map((url, index) => (
                    <ImageUpload
                      key={index}
                      bucket={serviceId}
                      value={url}
                      onChange={(newUrl: string) => {
                        const newImages = [...formData.images];
                        if (newUrl) {
                          newImages[index] = newUrl;
                        } else {
                          newImages.splice(index, 1);
                        }
                        setFormData({ ...formData, images: newImages });
                      }}
                    />
                  ))}
                  {formData.images.length < 6 && (
                    <ImageUpload
                      bucket={serviceId}
                      onChange={(newUrl) => {
                        if (newUrl) {
                          setFormData({
                            ...formData,
                            images: [...formData.images, newUrl],
                          });
                        }
                      }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload directly from your device or paste an image URL below. Max 6 images. First image is the thumbnail.
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste an image URL (https://...)"
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] text-xs sm:text-sm bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const url = input.value.trim();
                        if (url && formData.images.length < 6) {
                          setFormData({
                            ...formData,
                            images: [...formData.images, url],
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                      const url = input?.value?.trim();
                      if (url && formData.images.length < 6) {
                        setFormData({
                          ...formData,
                          images: [...formData.images, url],
                        });
                        input.value = '';
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium border border-slate-200 text-xs sm:text-sm cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
