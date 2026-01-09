'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    sizes: string[];
    colors: any[];
    images: string[];
    in_stock: boolean;
    subcategory: string | null;
    categories?: { name: string };
}

interface Subcategory {
    id: string;
    name: string;
    slug: string;
}

interface Category {
    id: string;
    name: string;
    subcategories?: Subcategory[];
}

export default function AttireManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [subcategoryFilter, setSubcategoryFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        subcategory: '',
        sizes: [] as string[],
        in_stock: true,
        images: [] as string[]
    });

    // Local input states for comma-separated fields
    const [sizeInput, setSizeInput] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        // ... existing fetchData logic
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                fetch('/api/admin/catalog/attire/products'),
                fetch('/api/admin/catalog/attire/categories')
            ]);
            
            const pData = await pRes.json();
            const cData = await cRes.json();
            
            setProducts(pData.products || []);
            setCategories(cData.categories || []);
        } catch (error) {
            console.error('Error fetching attire data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            const initialSizes = product.sizes || [];
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price.toString(),
                category: product.category || '',
                subcategory: product.subcategory || '',
                sizes: initialSizes,
                in_stock: product.in_stock,
                images: product.images || []
            });
            setSizeInput(initialSizes.join(', '));
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: categories[0]?.id || '',
                subcategory: '',
                sizes: [],
                in_stock: true,
                images: []
            });
            setSizeInput('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingProduct 
                ? `/api/admin/catalog/attire/products/${editingProduct.id}` 
                : '/api/admin/catalog/attire/products';
            
            const response = await fetch(url, {
                method: editingProduct ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    id: editingProduct ? undefined : formData.name.toLowerCase().replace(/\s+/g, '-')
                })
            });

            if (!response.ok) throw new Error('Failed to save product');
            
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const response = await fetch(`/api/admin/catalog/attire/products/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete');
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesSubcategory = !subcategoryFilter || product.subcategory === subcategoryFilter;
        return matchesSearch && matchesCategory && matchesSubcategory;
    });

    const activeCategory = categories.find(c => c.id === formData.category);
    const availableSubcategories = activeCategory?.subcategories || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setSubcategoryFilter('');
                        }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {categoryFilter && categories.find(c => c.id === categoryFilter)?.subcategories?.length ? (
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                            value={subcategoryFilter}
                            onChange={(e) => setSubcategoryFilter(e.target.value)}
                        >
                            <option value="">All Subcategories</option>
                            {categories.find(c => c.id === categoryFilter)?.subcategories?.map((s: any) => (
                                <option key={s.slug} value={s.slug}>{s.name}</option>
                            ))}
                        </select>
                    ) : null}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-300" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden group shadow-sm hover:shadow-md transition-all">
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ImageIcon size={40} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(product)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-rose-600">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {!product.in_stock && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                        <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full px-2">OUT OF STOCK</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-slate-900 truncate flex-1">{product.name}</h3>
                                    <span className="font-bold text-rose-600">${product.price}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2 truncate capitalize">{product.categories?.name || 'General'}</p>
                                <div className="flex flex-wrap gap-1">
                                    {product.sizes?.map(size => (
                                        <span key={size} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{size}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Price ($)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Category</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value, subcategory: ''})}
                                    >
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Subcategory</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:opacity-50"
                                        value={formData.subcategory}
                                        onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                                        disabled={!availableSubcategories.length}
                                    >
                                        <option value="">None</option>
                                        {availableSubcategories.map(s => (
                                            <option key={s.slug} value={s.slug}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Sizes (Comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="S, M, L, XL"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        value={sizeInput}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSizeInput(val);
                                            setFormData({
                                                ...formData,
                                                sizes: val.split(',').map(s => s.trim()).filter(Boolean)
                                            });
                                        }}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Product Images</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {formData.images.map((url, index) => (
                                            <ImageUpload
                                                key={index}
                                                bucket="attire"
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
                                                bucket="attire"
                                                onChange={(newUrl) => {
                                                    if (newUrl) {
                                                        setFormData({ ...formData, images: [...formData.images, newUrl] });
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400">First image will be used as the thumbnail. Max 6 images.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="in_stock"
                                    checked={formData.in_stock}
                                    onChange={(e) => setFormData({...formData, in_stock: e.target.checked})}
                                />
                                <label htmlFor="in_stock" className="text-sm text-slate-700">Currently in stock</label>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
