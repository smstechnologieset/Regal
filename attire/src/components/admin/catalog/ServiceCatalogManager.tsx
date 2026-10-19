'use client';

/**
 * ServiceCatalogManager Component
 *
 * Dedicated admin catalog manager for Regal's new services:
 * - 🌸 Pure Skincare & Body Care
 * - 🧸 Grounded Childhood Toys
 * - 📖 Mindful Journals & Reflection Tools
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
import { formatPrice } from '@/lib/utils';
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catalog/attire/products');
      if (res.ok) {
        const data = await res.json();
        const serverProducts = (data.products || []).filter(
          (p: any) => p.category === serviceId
        );

        if (serverProducts.length > 0) {
          setProducts(serverProducts);
        } else {
          // Fallback to initial seeds
          setProducts(initialSeedProducts);
        }
      } else {
        setProducts(initialSeedProducts);
      }
    } catch (err) {
      console.warn(`Error fetching ${serviceId} products, using seeds:`, err);
      setProducts(initialSeedProducts);
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
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        original_price: product.originalPrice?.toString() || '',
        subcategory: product.subcategory || subcategories[0]?.id || '',
        sizes: product.sizes || [],
        in_stock: product.inStock,
        stock_count: product.stockCount?.toString() || '0',
        images: product.images || [],
        badges: product.badges || [],
        allow_preorder: product.allowPreorder ?? true,
        estimated_restock_date: product.estimatedRestockDate
          ? new Date(product.estimatedRestockDate).toISOString().split('T')[0]
          : '',
        estimated_delivery_days: product.estimatedDeliveryDays?.toString() || '14',
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

      const payload = {
        name: formData.name,
        description: formData.description,
        price,
        original_price: originalPrice,
        category: serviceId,
        subcategory: formData.subcategory,
        sizes: parsedSizes,
        colors: [{ name: 'Standard', hex: '#4A5D4E' }],
        images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1608248597359-0091ff62a49f?w=800&h=800&fit=crop'],
        badges: formData.badges,
        in_stock: formData.in_stock,
        stock_count: parseInt(formData.stock_count) || 0,
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

      // Optimistically update local list
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? ({ ...p, ...payload, inStock: payload.in_stock } as any) : p
          )
        );
        addToast(`${formData.name} updated successfully`, 'success');
      } else {
        const newProductItem: any = {
          ...payload,
          id: payload.id,
          inStock: payload.in_stock,
          createdAt: new Date().toISOString(),
          rating: 5.0,
          reviewCount: 0,
          popularity: 50,
        };
        setProducts((prev) => [newProductItem, ...prev]);
        addToast(`${formData.name} created successfully`, 'success');
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
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Pre-Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-slate-100 shrink-0">
                          <Image
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1608248597359-0091ff62a49f?w=800&h=800&fit=crop'}
                            alt={p.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                        {p.subcategory || serviceId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatPrice(p.price)}
                    </td>
                    <td className="py-3 px-4">
                      {p.inStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          In Stock ({p.stockCount ?? 10})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.allowPreorder ? (
                        <div className="text-xs">
                          <span className="font-semibold text-[#8C6D28] bg-[#C5A059]/15 px-2 py-0.5 rounded-md">
                            Active
                          </span>
                          {p.estimatedRestockDate && (
                            <span className="block text-[11px] text-slate-400 mt-0.5">
                              Restock: {new Date(p.estimatedRestockDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Disabled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                      onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
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
                      value={formData.stock_count}
                      onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Image URLs
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formData.images[0] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        images: val ? [val] : [],
                      });
                    }}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4A5D4E] outline-none"
                  />
                  {formData.images[0] && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden relative border border-slate-200">
                      <Image
                        src={formData.images[0]}
                        alt="Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
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
