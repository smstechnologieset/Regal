'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, ChevronDown, ChevronRight, Folder, FolderPlus, Save, Loader2, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import ImageUpload from '@/components/admin/catalog/ImageUpload';

interface Subcategory {
    id: string;
    name: string;
    slug: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    image?: string;
    subcategories: Subcategory[];
}

export default function CategoriesPage() {
    const { addToast, showApiError } = useApp();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    
    // Modal states
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingSubcategory, setEditingSubcategory] = useState<{ catId: string; sub: Subcategory } | null>(null);
    const [parentCategory, setParentCategory] = useState<Category | null>(null);

    // Form states
    const [submitting, setSubmitting] = useState(false);
    const [catFormData, setCatFormData] = useState({ id: '', name: '', slug: '', image: '' });
    const [subFormData, setSubFormData] = useState({ id: '', name: '', slug: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/catalog/attire/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showApiError(error, 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    }

    const toggleExpand = (catId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(catId)) {
            newExpanded.delete(catId);
        } else {
            newExpanded.add(catId);
        }
        setExpandedCategories(newExpanded);
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    // Category Handlers
    const handleOpenCatModal = (cat?: Category) => {
        if (cat) {
            setEditingCategory(cat);
            setCatFormData({ id: cat.id, name: cat.name, slug: cat.slug, image: cat.image || '' });
        } else {
            setEditingCategory(null);
            setCatFormData({ id: '', name: '', slug: '', image: '' });
        }
        setIsCatModalOpen(true);
    };

    const handleCatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = editingCategory ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/catalog/attire/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...catFormData,
                    id: editingCategory ? catFormData.id : (catFormData.id || generateSlug(catFormData.name)),
                    slug: catFormData.slug || generateSlug(catFormData.name),
                    subcategories: editingCategory ? editingCategory.subcategories : []
                }),
            });

            if (!res.ok) throw res;
            
            addToast(`Category ${editingCategory ? 'updated' : 'created'} successfully`, 'success');
            setIsCatModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            showApiError(error, 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCat = async (id: string) => {
        if (!confirm('Are you sure? This will delete the category and all its data.')) return;
        
        try {
            const res = await fetch(`/api/admin/catalog/attire/categories?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw res;
            addToast('Category deleted successfully', 'success');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showApiError(error, 'Failed to delete category');
        }
    };

    // Subcategory Handlers
    const handleOpenSubModal = (cat: Category, sub?: Subcategory) => {
        setParentCategory(cat);
        if (sub) {
            setEditingSubcategory({ catId: cat.id, sub });
            setSubFormData({ id: sub.id, name: sub.name, slug: sub.slug });
        } else {
            setEditingSubcategory(null);
            setSubFormData({ id: '', name: '', slug: '' });
        }
        setIsSubModalOpen(true);
    };

    const handleSubSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!parentCategory) return;
        
        setSubmitting(true);
        try {
            let newSubcategories = [...(parentCategory.subcategories || [])];
            const subData = {
                id: editingSubcategory ? subFormData.id : (subFormData.id || generateSlug(subFormData.name)),
                name: subFormData.name,
                slug: subFormData.slug || generateSlug(subFormData.name)
            };

            if (editingSubcategory) {
                newSubcategories = newSubcategories.map(s => s.id === editingSubcategory.sub.id ? subData : s);
            } else {
                newSubcategories.push(subData);
            }

            const res = await fetch('/api/admin/catalog/attire/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...parentCategory, subcategories: newSubcategories }),
            });

            if (!res.ok) throw res;
            
            addToast('Subcategory saved successfully', 'success');
            setIsSubModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving subcategory:', error);
            showApiError(error, 'Failed to save subcategory');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSub = async (cat: Category, subId: string) => {
        if (!confirm('Remove this subcategory?')) return;
        
        try {
            const newSubcategories = cat.subcategories.filter(s => s.id !== subId);
            const res = await fetch('/api/admin/catalog/attire/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cat, subcategories: newSubcategories }),
            });

            if (!res.ok) throw res;
            addToast('Subcategory removed', 'success');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            showApiError(error, 'Failed to delete subcategory');
        }
    };

    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
                    <p className="text-slate-500">Manage attire categories and their nested subcategories</p>
                </div>
                <Button onClick={() => handleOpenCatModal()} className="flex items-center gap-2">
                    <Plus size={20} />
                    Add Category
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories or subcategories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p>Loading categories...</p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Folder className="mx-auto mb-4 text-slate-300" size={48} />
                    <p className="text-slate-500">No categories found</p>
                    <Button variant="outline" onClick={() => handleOpenCatModal()} className="mt-4">
                        Create your first category
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCategories.map((cat) => (
                        <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleExpand(cat.id)}>
                                    <div className="text-slate-400">
                                        {expandedCategories.has(cat.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                        {cat.image ? (
                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Folder className="text-slate-400" size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                                        <p className="text-xs text-slate-500 font-mono">{cat.slug}</p>
                                    </div>
                                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                                        {cat.subcategories?.length || 0} Subcategories
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleOpenSubModal(cat)}
                                        className="hidden sm:flex items-center gap-1 text-xs"
                                    >
                                        <FolderPlus size={14} />
                                        Add Sub
                                    </Button>
                                    <button 
                                        onClick={() => handleOpenCatModal(cat)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCat(cat.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Subcategories List */}
                            {expandedCategories.has(cat.id) && (
                                <div className="bg-slate-50/50 border-t border-slate-100 p-4 pl-14">
                                    {cat.subcategories && cat.subcategories.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {cat.subcategories.map((sub) => (
                                                <div key={sub.id} className="group flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-rose-200 transition-all">
                                                    <div className="overflow-hidden">
                                                        <p className="font-medium text-slate-800 truncate">{sub.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono truncate">{sub.slug}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleOpenSubModal(cat, sub)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteSub(cat, sub.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 italic text-sm">
                                            No subcategories in this category
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Category Modal */}
            {isCatModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingCategory ? 'Edit Category' : 'Create Category'}
                            </h2>
                            <button onClick={() => setIsCatModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Category Name</label>
                                <Input
                                    placeholder="e.g., Men's Clothing"
                                    value={catFormData.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCatFormData({ 
                                            ...catFormData, 
                                            name: val,
                                            // Auto-generate slug but don't overwrite if manually edited or in edit mode
                                            slug: editingCategory ? catFormData.slug : generateSlug(val)
                                        });
                                    }}
                                    required
                                />
                                <p className="text-[10px] text-slate-400">
                                    Identifier: <span className="font-mono">{catFormData.slug || '...'}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Category Image</label>
                                <ImageUpload
                                    bucket="attire"
                                    value={catFormData.image}
                                    onChange={(url) => setCatFormData({ ...catFormData, image: url })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCatModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" isLoading={submitting}>
                                    {editingCategory ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subcategory Modal */}
            {isSubModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">To: <span className="font-semibold">{parentCategory?.name}</span></p>
                            </div>
                            <button onClick={() => setIsSubModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Subcategory Name</label>
                                <Input
                                    placeholder="e.g., T-Shirts"
                                    value={subFormData.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSubFormData({ 
                                            ...subFormData, 
                                            name: val,
                                            slug: editingSubcategory ? subFormData.slug : generateSlug(val)
                                        });
                                    }}
                                    required
                                />
                                <p className="text-[10px] text-slate-400">
                                    Identifier: <span className="font-mono">{subFormData.slug || '...'}</span>
                                </p>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsSubModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" isLoading={submitting}>
                                    Save
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
