'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Calendar, Loader2, Users, Upload } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useApp } from '@/context/AppContext';

interface EventPackage {
    id: string;
    title: string;
    description: string | null;
    type: string;
    price_start: number;
    features: string[];
    image: string | null;
    capacity: string | null;
    popular: boolean;
}

export default function EventManager() {
    const { addToast, showApiError } = useApp();
    const [packages, setPackages] = useState<EventPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<EventPackage | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [featureInput, setFeatureInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'wedding',
        price_start: '',
        features: [] as string[],
        capacity: '',
        popular: false,
        image: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/catalog/events');
            const data = await res.json();
            setPackages(data.packages || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            showApiError(error, 'Failed to fetch event data');
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (pkg?: EventPackage) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                title: pkg.title,
                description: pkg.description || '',
                type: pkg.type,
                price_start: pkg.price_start.toString(),
                features: pkg.features || [],
                capacity: pkg.capacity || '',
                popular: pkg.popular,
                image: pkg.image || ''
            });
            setFeatureInput('');
        } else {
            setEditingPackage(null);
            setFormData({
                title: '',
                description: '',
                type: 'wedding',
                price_start: '',
                features: [],
                capacity: '',
                popular: false,
                image: ''
            });
            setFeatureInput('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingPackage
                ? `/api/admin/catalog/events/${editingPackage.id}`
                : '/api/admin/catalog/events';

            const response = await fetch(url, {
                method: editingPackage ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price_start: parseFloat(formData.price_start),
                    id: editingPackage ? undefined : formData.title.toLowerCase().replace(/\s+/g, '-')
                })
            });

            if (!response.ok) throw response;
            setIsModalOpen(false);
            fetchData();
            addToast('Package saved successfully', 'success');
        } catch (error) {
            console.error('Error saving event:', error);
            showApiError(error, 'Failed to save package');
        } finally {
            setSubmitting(false);
        }
    };

    const addFeature = () => {
        if (!featureInput.trim()) return;
        if (formData.features.includes(featureInput.trim())) {
            setFeatureInput('');
            return;
        }
        setFormData({
            ...formData,
            features: [...formData.features, featureInput.trim()]
        });
        setFeatureInput('');
    };

    const removeFeature = (feature: string) => {
        setFormData({
            ...formData,
            features: formData.features.filter(f => f !== feature)
        });
    };

    const handleFeatureKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addFeature();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        try {
            const response = await fetch(`/api/admin/catalog/events/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw response;
            addToast('Package deleted successfully', 'success');
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
            showApiError(error, 'Failed to delete package');
        }
    };

    const types = ['wedding', 'birthday', 'corporate', 'graduation', 'social'];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search event packages..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus size={18} />
                    Add Package
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-300" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {packages.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-all">
                            <div className="w-full sm:w-48 bg-slate-100 relative overflow-hidden">
                                {pkg.image ? (
                                    <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-amber-50">
                                        <Calendar size={40} />
                                    </div>
                                )}
                                {pkg.popular && (
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 block">{pkg.type}</span>
                                            <h3 className="text-xl font-bold text-slate-900">{pkg.title}</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm text-slate-500 block">Starts from</span>
                                            <span className="text-xl font-bold text-amber-600">${pkg.price_start}</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">{pkg.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Users size={14} />
                                            {pkg.capacity || 'Flexible'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {pkg.features?.slice(0, 3).map(f => (
                                            <span key={f} className="text-xs px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-md truncate max-w-[150px]">{f}</span>
                                        ))}
                                        {pkg.features?.length > 3 && (
                                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">+{pkg.features.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-4 border-t border-slate-50">
                                    <button onClick={() => handleOpenModal(pkg)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingPackage ? 'Edit Package' : 'Add Event Package'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Package Title</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Package Image</label>
                                    <ImageUpload
                                        bucket="events"
                                        value={formData.image}
                                        onChange={(url) => setFormData({ ...formData, image: url })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Event Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 capitalize"
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    >
                                        {types.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Price Start ($)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        value={formData.price_start}
                                        onChange={(e) => setFormData({...formData, price_start: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Capacity (e.g. 100-200 Guests)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Image URL</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        value={formData.image}
                                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Features</label>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Add a feature (e.g. Full catering)"
                                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                value={featureInput}
                                                onChange={(e) => setFeatureInput(e.target.value)}
                                                onKeyDown={handleFeatureKeyDown}
                                            />
                                            <button
                                                type="button"
                                                onClick={addFeature}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-200"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                            {formData.features.length === 0 ? (
                                                <span className="text-xs text-slate-400 italic py-1">No features added yet...</span>
                                            ) : (
                                                formData.features.map((feature, index) => (
                                                    <div 
                                                        key={index}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-200"
                                                    >
                                                        {feature}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFeature(feature)}
                                                            className="hover:text-amber-900 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="popular"
                                    checked={formData.popular}
                                    onChange={(e) => setFormData({...formData, popular: e.target.checked})}
                                />
                                <label htmlFor="popular" className="text-sm text-slate-700 font-medium">Mark as Popular</label>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-md shadow-amber-500/20"
                                >
                                    {submitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingPackage ? 'Update Package' : 'Create Package'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
