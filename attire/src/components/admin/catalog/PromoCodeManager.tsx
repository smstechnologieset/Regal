'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Tag, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn, formatPrice } from '@/lib/utils';

interface PromoCode {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase: number;
    usage_limit: number | null;
    usage_count: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
}

export default function PromoCodeManager() {
    const { addToast, showApiError } = useApp();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        min_purchase: '0',
        usage_limit: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    async function fetchPromoCodes() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/catalog/promocodes');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPromoCodes(data.promoCodes || []);
        } catch (error) {
            console.error('Error fetching promo codes:', error);
            showApiError(error, 'Failed to fetch promo codes');
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (code?: PromoCode) => {
        if (code) {
            setEditingCode(code);
            setFormData({
                code: code.code,
                discount_type: code.discount_type,
                discount_value: code.discount_value.toString(),
                min_purchase: code.min_purchase.toString(),
                usage_limit: code.usage_limit?.toString() || '',
                start_date: new Date(code.start_date).toISOString().split('T')[0],
                end_date: code.end_date ? new Date(code.end_date).toISOString().split('T')[0] : '',
                is_active: code.is_active
            });
        } else {
            setEditingCode(null);
            setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_purchase: '0',
                usage_limit: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingCode
                ? `/api/admin/catalog/promocodes/${editingCode.id}`
                : '/api/admin/catalog/promocodes';

            const payload = {
                ...formData,
                code: formData.code.toUpperCase(),
                discount_value: parseFloat(formData.discount_value),
                min_purchase: parseFloat(formData.min_purchase),
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                end_date: formData.end_date || null
            };

            const response = await fetch(url, {
                method: editingCode ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save promo code');
            }

            addToast(editingCode ? 'Promo code updated' : 'Promo code created', 'success');
            setIsModalOpen(false);
            fetchPromoCodes();
        } catch (error) {
            console.error('Error saving promo code:', error);
            showApiError(error, 'Failed to save promo code');
        } finally {
            setSubmitting(false);
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;
        try {
            const response = await fetch(`/api/admin/catalog/promocodes/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete promo code');
            addToast('Promo code deleted', 'success');
            fetchPromoCodes();
        } catch (error) {
            console.error('Error deleting promo code:', error);
            showApiError(error, 'Failed to delete promo code');
        }
    };

    const toggleStatus = async (code: PromoCode) => {
        try {
            const response = await fetch(`/api/admin/catalog/promocodes/${code.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !code.is_active })
            });
            if (!response.ok) throw new Error('Failed to update status');
            fetchPromoCodes();
        } catch (error) {
            showApiError(error);
        }
    };

    const filteredCodes = promoCodes.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search promo codes..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors whitespace-nowrap text-sm"
                >
                    <Plus size={18} />
                    Add Promo Code
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-300" size={40} />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requirements</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Validity</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                            No promo codes found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCodes.map((code) => (
                                        <tr key={code.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                                        <Tag size={16} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-primary">{code.code}</span>
                                                        <div className="flex items-center gap-1 mt-0.5" onClick={() => toggleStatus(code)}>
                                                            {code.is_active ? (
                                                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium cursor-pointer">
                                                                    <CheckCircle size={10} /> Active
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium cursor-pointer">
                                                                    <XCircle size={10} /> Inactive
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {code.discount_type === 'percentage'
                                                        ? `${code.discount_value}% OFF`
                                                        : `${formatPrice(code.discount_value)} OFF`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-500">
                                                    Min: {formatPrice(code.min_purchase)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} className="text-slate-400" />
                                                    <span className="text-xs text-slate-600 font-medium">
                                                        {code.usage_count} / {code.usage_limit || '∞'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                        <Calendar size={10} />
                                                        <span>{new Date(code.start_date).toLocaleDateString()}</span>
                                                        {code.end_date && (
                                                            <>
                                                                <span>-</span>
                                                                <span>{new Date(code.end_date).toLocaleDateString()}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(code)}
                                                        className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(code.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingCode ? 'Edit Promo Code' : 'Add Promo Code'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Promo Code</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="SUMMER2024"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary uppercase font-mono font-bold"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400">The code users will enter at checkout.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Discount Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Min. Purchase ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        value={formData.min_purchase}
                                        onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Usage Limit (Optional)</label>
                                    <input
                                        type="number"
                                        placeholder="No limit"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        value={formData.usage_limit}
                                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Start Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="promo_active"
                                    className="rounded border-slate-300 text-secondary focus:ring-secondary"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="promo_active" className="text-sm text-slate-700 font-medium cursor-pointer">
                                    Enable this promo code
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-secondary text-white rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2 font-bold"
                                >
                                    {submitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingCode ? 'Update Code' : 'Create Code'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
