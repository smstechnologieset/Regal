'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Heart, Loader2, Sparkles, Scissors, Upload } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { BRIDAL_SILHOUETTES } from '@/lib/constants';
import { useApp } from '@/context/AppContext';

interface Gown {
    id: string;
    name: string;
    designer: string | null;
    style: string | null;
    silhouette: string | null;
    price_rent: number | null;
    price_buy: number | null;
    sizes: string[];
    images: string[];
    description: string | null;
    is_new: boolean;
}

interface Service {
    id: string;
    title: string;
    description: string | null;
    price_start: number | null;
    duration: string | null;
    type: string | null;
    image: string | null;
}

export default function BridalManager() {
    const { addToast, showApiError } = useApp();
    const [activeTab, setActiveTab] = useState<'gowns' | 'services'>('gowns');
    const [gowns, setGowns] = useState<Gown[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Gown | Service | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [sizeInput, setSizeInput] = useState('');

    // Form states
    const [gownForm, setGownForm] = useState({
        name: '', designer: '', style: '', silhouette: '',
        price_rent: '', price_buy: '', sizes: [] as string[],
        images: [] as string[], description: '', is_new: false
    });

    const [serviceForm, setServiceForm] = useState({
        title: '', description: '', price_start: '',
        duration: '', type: 'makeup', image: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    async function fetchData() {
        setLoading(true);
        try {
            const url = activeTab === 'gowns'
                ? '/api/admin/catalog/bridal/gowns'
                : '/api/admin/catalog/bridal/services';
            const res = await fetch(url);
            const data = await res.json();
            if (activeTab === 'gowns') setGowns(data.gowns || []);
            else setServices(data.services || []);
        } catch (error) {
            console.error('Error fetching bridal data:', error);
            showApiError(error, 'Failed to fetch bridal data');
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (item?: Gown | Service) => {
        if (activeTab === 'gowns') {
            const gown = item as Gown;
            if (item) {
                setEditingItem(gown);
                setGownForm({
                    name: gown.name,
                    designer: gown.designer || '',
                    style: gown.style || '',
                    silhouette: gown.silhouette || '',
                    price_rent: gown.price_rent?.toString() || '',
                    price_buy: gown.price_buy?.toString() || '',
                    sizes: gown.sizes || [],
                    images: gown.images || [],
                    description: gown.description || '',
                    is_new: gown.is_new
                });
                setSizeInput((gown.sizes || []).join(', '));
            } else {
                setEditingItem(null);
                setGownForm({
                    name: '', designer: '', style: '', silhouette: '',
                    price_rent: '', price_buy: '', sizes: [],
                    images: [], description: '', is_new: true
                });
                setSizeInput('');
            }
        } else {
            const service = item as Service;
            if (item) {
                setEditingItem(service);
                setServiceForm({
                    title: service.title,
                    description: service.description || '',
                    price_start: service.price_start?.toString() || '',
                    duration: service.duration || '',
                    type: service.type || 'makeup',
                    image: service.image || ''
                });
            } else {
                setEditingItem(null);
                setServiceForm({
                    title: '', description: '', price_start: '',
                    duration: '', type: 'makeup', image: ''
                });
            }
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const baseUrl = activeTab === 'gowns' ? '/api/admin/catalog/bridal/gowns' : '/api/admin/catalog/bridal/services';
            const url = editingItem ? `${baseUrl}/${editingItem.id}` : baseUrl;

            const payload = activeTab === 'gowns'
                ? { ...gownForm, price_rent: gownForm.price_rent ? parseFloat(gownForm.price_rent) : null, price_buy: gownForm.price_buy ? parseFloat(gownForm.price_buy) : null }
                : { ...serviceForm, price_start: serviceForm.price_start ? parseFloat(serviceForm.price_start) : null };

            const response = await fetch(url, {
                method: editingItem ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    id: editingItem ? undefined : (activeTab === 'gowns' ? gownForm.name : serviceForm.title).toLowerCase().replace(/\s+/g, '-')
                })
            });

            if (!response.ok) throw response;
            setIsModalOpen(false);
            fetchData();
            addToast(`${activeTab === 'gowns' ? 'Gown' : 'Service'} saved successfully`, 'success');
        } catch (error) {
            console.error('Error saving:', error);
            showApiError(error, 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            const baseUrl = activeTab === 'gowns' ? '/api/admin/catalog/bridal/gowns' : '/api/admin/catalog/bridal/services';
            const response = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw response;
            addToast('Deleted successfully', 'success');
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
            showApiError(error, 'Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-1 rounded-xl border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveTab('gowns')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'gowns' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                >
                    Bridal Gowns
                </button>
                <button
                    onClick={() => setActiveTab('services')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'services' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                >
                    Styling Services
                </button>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus size={18} />
                    Add {activeTab === 'gowns' ? 'Gown' : 'Service'}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-300" size={40} />
                </div>
            ) : activeTab === 'gowns' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {gowns.map((gown) => (
                        <div key={gown.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden group shadow-sm hover:shadow-md transition-all">
                            <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                                {gown.images?.[0] ? (
                                    <img src={gown.images[0]} alt={gown.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-pink-50">
                                        <Heart size={40} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(gown)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-pink-600">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(gown.id)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {gown.is_new && (
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">New Arrival</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-primary mb-1">{gown.name}</h3>
                                <p className="text-xs text-slate-500 mb-2 truncate">{gown.designer} • {gown.style}</p>
                                <div className="flex gap-2 text-xs font-medium text-pink-600">
                                    {gown.price_rent && <span>Rent: ${gown.price_rent}</span>}
                                    {gown.price_buy && <span>Buy: ${gown.price_buy}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                        <div key={service.id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 hover:shadow-md transition-all group">
                            <div className="w-24 h-24 bg-pink-50 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                                {service.image ? (
                                    <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Scissors className="text-pink-300" size={32} />
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-primary">{service.title}</h3>
                                        <span className="text-sm font-bold text-pink-600">${service.price_start}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{service.duration} • {service.type}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleOpenModal(service)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-pink-600">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
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
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} {activeTab === 'gowns' ? 'Bridal Gown' : 'Styling Service'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {activeTab === 'gowns' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Gown Name</label>
                                        <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={gownForm.name} onChange={e => setGownForm({ ...gownForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <label className="text-sm font-medium text-slate-700">Designer</label>
                                        <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={gownForm.designer} onChange={e => setGownForm({ ...gownForm, designer: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Silhouette</label>
                                        <select
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                            value={gownForm.silhouette}
                                            onChange={e => setGownForm({ ...gownForm, silhouette: e.target.value })}
                                        >
                                            <option value="">Select Silhouette</option>
                                            {BRIDAL_SILHOUETTES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Rent Price ($)</label>
                                        <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={gownForm.price_rent} onChange={e => setGownForm({ ...gownForm, price_rent: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Buy Price ($)</label>
                                        <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={gownForm.price_buy} onChange={e => setGownForm({ ...gownForm, price_buy: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Gown Images</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {gownForm.images.map((url, index) => (
                                                <ImageUpload
                                                    key={index}
                                                    bucket="bridal"
                                                    value={url}
                                                    onChange={(newUrl) => {
                                                        const newImages = [...gownForm.images];
                                                        if (newUrl) {
                                                            newImages[index] = newUrl;
                                                        } else {
                                                            newImages.splice(index, 1);
                                                        }
                                                        setGownForm({ ...gownForm, images: newImages });
                                                    }}
                                                />
                                            ))}
                                            {gownForm.images.length < 6 && (
                                                <ImageUpload
                                                    bucket="bridal"
                                                    onChange={(newUrl: string) => {
                                                        if (newUrl) {
                                                            setGownForm({ ...gownForm, images: [...gownForm.images, newUrl] });
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="text"
                                                placeholder="Or paste an image URL..."
                                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const input = e.target as HTMLInputElement;
                                                        const url = input.value.trim();
                                                        if (url && gownForm.images.length < 6) {
                                                            setGownForm({ ...gownForm, images: [...gownForm.images, url] });
                                                            input.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                                                    const url = input.value.trim();
                                                    if (url && gownForm.images.length < 6) {
                                                        setGownForm({ ...gownForm, images: [...gownForm.images, url] });
                                                        input.value = '';
                                                    }
                                                }}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-200 text-sm"
                                            >
                                                Add URL
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Sizes (Comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="S, M, L"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                                            value={sizeInput}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSizeInput(val);
                                                setGownForm({
                                                    ...gownForm,
                                                    sizes: val.split(',').map(s => s.trim()).filter(Boolean)
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="is_new" checked={gownForm.is_new} onChange={e => setGownForm({ ...gownForm, is_new: e.target.checked })} />
                                        <label htmlFor="is_new" className="text-sm text-slate-700">New Arrival</label>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Service Title</label>
                                        <input required type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={serviceForm.title} onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Service Image</label>
                                        <ImageUpload
                                            bucket="bridal"
                                            value={serviceForm.image}
                                            onChange={(url) => setServiceForm({ ...serviceForm, image: url })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Or paste an image URL..."
                                            className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-sm"
                                            value={serviceForm.image}
                                            onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Starting Price ($)</label>
                                        <input required type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={serviceForm.price_start} onChange={e => setServiceForm({ ...serviceForm, price_start: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Duration</label>
                                        <input type="text" placeholder="e.g. 2 Hours" className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={serviceForm.duration} onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Description</label>
                                        <textarea rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-lg" value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancel</button>
                                <button disabled={submitting} type="submit" className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 font-medium">
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
