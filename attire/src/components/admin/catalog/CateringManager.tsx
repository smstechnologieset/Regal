'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Utensils, Loader2, Info } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useApp } from '@/context/AppContext';

interface CateringPackage {
    id: string;
    name: string;
    description: string | null;
    price_per_guest: number | null;
    min_guests: number | null;
    includes: string[];
    image: string | null;
}

interface MenuItem {
    id: string;
    name: string;
    category: string | null;
    price: number | null;
    description: string | null;
    dietary: string[];
    image: string | null;
}

export default function CateringManager() {
    const { addToast, showApiError } = useApp();
    const [activeTab, setActiveTab] = useState<'packages' | 'items'>('packages');
    const [packages, setPackages] = useState<CateringPackage[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CateringPackage | MenuItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [dietaryInput, setDietaryInput] = useState('');
    const [inclusionsInput, setInclusionsInput] = useState('');
    const [search, setSearch] = useState('');

    // Form states
    const [packageForm, setPackageForm] = useState({
        name: '', description: '', price_per_guest: '',
        min_guests: '', includes: [] as string[], image: ''
    });

    const [itemForm, setItemForm] = useState({
        name: '', category: 'appetizer', price: '',
        description: '', dietary: [] as string[], image: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    async function fetchData() {
        setLoading(true);
        try {
            const url = activeTab === 'packages'
                ? '/api/admin/catalog/catering/packages'
                : '/api/admin/catalog/catering/items';
            const res = await fetch(url);
            const data = await res.json();
            if (activeTab === 'packages') setPackages(data.packages || []);
            else setItems(data.items || []);
        } catch (error) {
            console.error('Error fetching catering data:', error);
            showApiError(error, 'Failed to fetch catering data');
        } finally {
            setLoading(false);
        }
    }
    const handleOpenModal = (item?: CateringPackage | MenuItem) => {
        if (activeTab === 'packages') {
            const pkg = item as CateringPackage;
            if (item) {
                setEditingItem(pkg);
                setPackageForm({
                    name: pkg.name,
                    description: pkg.description || '',
                    price_per_guest: pkg.price_per_guest?.toString() || '',
                    min_guests: pkg.min_guests?.toString() || '',
                    includes: pkg.includes || [],
                    image: pkg.image || ''
                });
            } else {
                setEditingItem(null);
                setPackageForm({
                    name: '', description: '', price_per_guest: '',
                    min_guests: '', includes: [], image: ''
                });
            }
            setInclusionsInput('');
        } else {
            const menuItem = item as MenuItem;
            if (item) {
                setEditingItem(menuItem);
                setItemForm({
                    name: menuItem.name,
                    category: menuItem.category || 'appetizer',
                    price: menuItem.price?.toString() || '',
                    description: menuItem.description || '',
                    dietary: menuItem.dietary || [],
                    image: menuItem.image || ''
                });
            } else {
                setEditingItem(null);
                setItemForm({
                    name: '', category: 'appetizer', price: '',
                    description: '', dietary: [], image: ''
                });
            }
            setDietaryInput('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const baseUrl = activeTab === 'packages' ? '/api/admin/catalog/catering/packages' : '/api/admin/catalog/catering/items';
            const url = editingItem ? `${baseUrl}/${editingItem.id}` : baseUrl;

            const payload = activeTab === 'packages'
                ? { ...packageForm, price_per_guest: packageForm.price_per_guest ? parseFloat(packageForm.price_per_guest) : null, min_guests: packageForm.min_guests ? parseInt(packageForm.min_guests) : null }
                : { ...itemForm, price: itemForm.price ? parseFloat(itemForm.price) : null };

            const response = await fetch(url, {
                method: editingItem ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    id: editingItem ? undefined : (activeTab === 'packages' ? packageForm.name : itemForm.name).toLowerCase().replace(/\s+/g, '-')
                })
            });

            if (!response.ok) throw response;
            setIsModalOpen(false);
            fetchData();
            addToast(`${activeTab === 'packages' ? 'Package' : 'Item'} saved successfully`, 'success');
        } catch (error) {
            console.error('Error saving catering item:', error);
            showApiError(error, 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    // Inclusions management
    const addInclusion = () => {
        if (!inclusionsInput.trim()) return;
        if (packageForm.includes.includes(inclusionsInput.trim())) {
            setInclusionsInput('');
            return;
        }
        setPackageForm({
            ...packageForm,
            includes: [...packageForm.includes, inclusionsInput.trim()]
        });
        setInclusionsInput('');
    };

    const removeInclusion = (inclusion: string) => {
        setPackageForm({
            ...packageForm,
            includes: packageForm.includes.filter(i => i !== inclusion)
        });
    };

    const handleInclusionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addInclusion();
        }
    };

    // Dietary info management
    const addDietary = () => {
        if (!dietaryInput.trim()) return;
        if (itemForm.dietary.includes(dietaryInput.trim())) {
            setDietaryInput('');
            return;
        }
        setItemForm({
            ...itemForm,
            dietary: [...itemForm.dietary, dietaryInput.trim()]
        });
        setDietaryInput('');
    };

    const removeDietary = (item: string) => {
        setItemForm({
            ...itemForm,
            dietary: itemForm.dietary.filter(d => d !== item)
        });
    };

    const handleDietaryKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addDietary();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            const baseUrl = activeTab === 'packages' ? '/api/admin/catalog/catering/packages' : '/api/admin/catalog/catering/items';
            const response = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw response;
            addToast('Deleted successfully', 'success');
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
            showApiError(error, 'Failed to delete');
        }
    };

    const categories = [
        { label: 'Appetizer', value: 'appetizer' },
        { label: 'Main Course', value: 'main' },
        { label: 'Dessert', value: 'dessert' },
        { label: 'Beverage', value: 'drink' },
        { label: 'Live Station', value: 'station' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-1 rounded-xl border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveTab('packages')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'packages' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                >
                    Dining Packages
                </button>
                <button
                    onClick={() => setActiveTab('items')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'items' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                >
                    Menu Items
                </button>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus size={18} />
                    Add {activeTab === 'packages' ? 'Package' : 'Item'}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-300" size={40} />
                </div>
            ) : activeTab === 'packages' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages
                        .filter((pkg) => !search.trim() || pkg.name.toLowerCase().includes(search.toLowerCase()))
                        .map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                            <div className="aspect-video bg-emerald-50 relative">
                                {pkg.image ? (
                                    <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-emerald-200">
                                        <Utensils size={40} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(pkg)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-emerald-600">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-primary truncate">{pkg.name}</h3>
                                    <span className="text-emerald-600 font-bold">ETB {pkg.price_per_guest}<span className="text-[10px] text-slate-400 font-normal">/pp</span></span>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{pkg.description}</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Info size={12} />
                                        Includes
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {pkg.includes?.map(inc => (
                                            <span key={inc} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{inc}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dietary</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items
                                .filter((item) => !search.trim() || item.name.toLowerCase().includes(search.toLowerCase()))
                                .map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-primary">{item.name}</p>
                                        <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium capitalize">{item.category}</span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">ETB {item.price}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {item.dietary?.map((d: string) => (
                                                <span key={d} className="text-[10px] px-1.5 py-0.5 border border-slate-200 text-slate-500 rounded uppercase font-bold">{d}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} {activeTab === 'packages' ? 'Dining Package' : 'Menu Item'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {activeTab === 'packages' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Package Name</label>
                                        <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={packageForm.name} onChange={e => setPackageForm({ ...packageForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Price per Guest ($)</label>
                                        <input required type="number" step="0.01" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={packageForm.price_per_guest} onChange={e => setPackageForm({ ...packageForm, price_per_guest: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Min Guests</label>
                                        <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={packageForm.min_guests} onChange={e => setPackageForm({ ...packageForm, min_guests: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Description</label>
                                        <textarea rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={packageForm.description} onChange={e => setPackageForm({ ...packageForm, description: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Inclusions</label>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add an inclusion (e.g. Open Bar)"
                                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    value={inclusionsInput}
                                                    onChange={(e) => setInclusionsInput(e.target.value)}
                                                    onKeyDown={handleInclusionKeyDown}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addInclusion}
                                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-200"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                                {packageForm.includes.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic py-1">No inclusions added yet...</span>
                                                ) : (
                                                    packageForm.includes.map((inc, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-200"
                                                        >
                                                            {inc}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeInclusion(inc)}
                                                                className="hover:text-emerald-900 transition-colors"
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
                                            bucket="catering"
                                            value={packageForm.image}
                                            onChange={(url) => setPackageForm({ ...packageForm, image: url })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Or paste an image URL..."
                                            className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                                            value={packageForm.image}
                                            onChange={(e) => setPackageForm({ ...packageForm, image: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Item Name</label>
                                        <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Category</label>
                                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })}>
                                            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Price ($)</label>
                                        <input required type="number" step="0.01" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Description</label>
                                        <textarea rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Dietary Info</label>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add dietary info (e.g. Vegan)"
                                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    value={dietaryInput}
                                                    onChange={(e) => setDietaryInput(e.target.value)}
                                                    onKeyDown={handleDietaryKeyDown}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addDietary}
                                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-200"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                                {itemForm.dietary.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic py-1">No dietary added yet...</span>
                                                ) : (
                                                    itemForm.dietary.map((diet, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-200"
                                                        >
                                                            {diet}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDietary(diet)}
                                                                className="hover:text-emerald-900 transition-colors"
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
                                        <label className="text-sm font-medium text-slate-700">Item Image</label>
                                        <ImageUpload
                                            bucket="catering"
                                            value={itemForm.image}
                                            onChange={(url) => setItemForm({ ...itemForm, image: url })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Or paste an image URL..."
                                            className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                                            value={itemForm.image}
                                            onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancel</button>
                                <button disabled={submitting} type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium">
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
