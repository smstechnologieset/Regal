'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Gift, Loader2, Info } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useApp } from '@/context/AppContext';

interface GiftPackage {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    category: string;
    contents: string[];
    image: string | null;
}

export default function GiftPackagesManager() {
    const { addToast, showApiError } = useApp();
    const [packages, setPackages] = useState<GiftPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GiftPackage | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [contentInput, setContentInput] = useState('');
    const [search, setSearch] = useState('');

    // Form state
    const [form, setForm] = useState({
        name: '', 
        description: '', 
        price: '',
        category: 'birthday', 
        contents: [] as string[], 
        image: ''
    });

    const categories = [
        { label: 'Birthday', value: 'birthday' },
        { label: 'Graduation', value: 'graduation' },
        { label: 'Partner/Anniversary', value: 'partner' },
        { label: 'Corporate', value: 'corporate' },
        { label: 'Wedding Gift', value: 'wedding' },
        { label: 'Other', value: 'other' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/catalog/gifts');
            const data = await res.json();
            setPackages(data.packages || []);
        } catch (error) {
            console.error('Error fetching gift packages:', error);
            showApiError(error, 'Failed to fetch gift packages');
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (item?: GiftPackage) => {
        if (item) {
            setEditingItem(item);
            setForm({
                name: item.name,
                description: item.description || '',
                price: item.price?.toString() || '',
                category: item.category,
                contents: item.contents || [],
                image: item.image || ''
            });
        } else {
            setEditingItem(null);
            setForm({
                name: '', 
                description: '', 
                price: '',
                category: 'birthday', 
                contents: [], 
                image: ''
            });
        }
        setContentInput('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const baseUrl = '/api/admin/catalog/gifts';
            const url = editingItem ? `${baseUrl}/${editingItem.id}` : baseUrl;

            const payload = { 
                ...form, 
                price: form.price ? parseFloat(form.price) : 0 
            };

            const response = await fetch(url, {
                method: editingItem ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    id: editingItem ? undefined : form.name.toLowerCase().replace(/\s+/g, '-')
                })
            });

            if (!response.ok) throw response;
            setIsModalOpen(false);
            fetchData();
            addToast(`Package saved successfully`, 'success');
        } catch (error) {
            console.error('Error saving gift package:', error);
            showApiError(error, 'Failed to save package');
        } finally {
            setSubmitting(false);
        }
    };

    const addContentItem = () => {
        if (!contentInput.trim()) return;
        if (form.contents.includes(contentInput.trim())) {
            setContentInput('');
            return;
        }
        setForm({
            ...form,
            contents: [...form.contents, contentInput.trim()]
        });
        setContentInput('');
    };

    const removeContentItem = (item: string) => {
        setForm({
            ...form,
            contents: form.contents.filter(i => i !== item)
        });
    };

    const handleContentKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addContentItem();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        try {
            const response = await fetch(`/api/admin/catalog/gifts/${id}`, { method: 'DELETE' });
            if (!response.ok) throw response;
            addToast('Deleted successfully', 'success');
            fetchData();
        } catch (error) {
            console.error('Error deleting gift package:', error);
            showApiError(error, 'Failed to delete package');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search gift packages..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus size={18} />
                    Add Gift Package
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-300" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages
                        .filter((pkg) =>
                            !search.trim() ||
                            pkg.name.toLowerCase().includes(search.toLowerCase()) ||
                            (pkg.category || '').toLowerCase().includes(search.toLowerCase())
                        )
                        .map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            <div className="aspect-video bg-purple-50 relative">
                                {pkg.image ? (
                                    <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-purple-200">
                                        <Gift size={40} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(pkg)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-purple-600">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                    <span className="text-[10px] px-2 py-0.5 bg-white/90 text-purple-700 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">{pkg.category}</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-primary truncate pr-2">{pkg.name}</h3>
                                    <span className="text-purple-600 font-bold">ETB {pkg.price}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{pkg.description}</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Info size={12} />
                                        Contents
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {pkg.contents?.map((item, idx) => (
                                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{item}</span>
                                        ))}
                                        {(!pkg.contents || pkg.contents.length === 0) && <span className="text-[10px] text-slate-400 italic">No contents listed</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {packages.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                            <Gift className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500">No gift packages found. Click "Add Gift Package" to create one.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} Gift Package</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Package Name</label>
                                    <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Category</label>
                                    <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Price ($)</label>
                                    <input required type="number" step="0.01" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Description</label>
                                    <textarea rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">What's Inside (Contents)</label>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Add an item (e.g. Personalized Card)"
                                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                                value={contentInput}
                                                onChange={(e) => setContentInput(e.target.value)}
                                                onKeyDown={handleContentKeyDown}
                                            />
                                            <button
                                                type="button"
                                                onClick={addContentItem}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-200"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                            {form.contents.length === 0 ? (
                                                <span className="text-xs text-slate-400 italic py-1">No items added yet...</span>
                                            ) : (
                                                form.contents.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-200"
                                                    >
                                                        {item}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeContentItem(item)}
                                                            className="hover:text-purple-900 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Package Image</label>
                                    <ImageUpload
                                        bucket="gifts"
                                        value={form.image}
                                        onChange={(url) => setForm({ ...form, image: url })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Or paste an image URL..."
                                        className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                        value={form.image}
                                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancel</button>
                                <button disabled={submitting} type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium">
                                    {submitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
