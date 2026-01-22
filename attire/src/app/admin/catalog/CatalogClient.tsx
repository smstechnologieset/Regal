'use client';

import React, { useState } from 'react';
import { ShoppingBag, Calendar, Heart, UtensilsCrossed, Tag } from 'lucide-react';
import AttireManager from '@/components/admin/catalog/AttireManager';
import EventManager from '@/components/admin/catalog/EventManager';
import BridalManager from '@/components/admin/catalog/BridalManager';
import CateringManager from '@/components/admin/catalog/CateringManager';
import PromoCodeManager from '@/components/admin/catalog/PromoCodeManager';

type Category = 'attire' | 'events' | 'bridal' | 'catering' | 'promocodes';

export default function CatalogClient() {
    const [activeTab, setActiveTab] = useState<Category>('attire');

    const tabs = [
        { id: 'attire', name: 'Attire', icon: ShoppingBag, color: 'text-secondary', bg: 'bg-rose-50' },
        { id: 'events', name: 'Events', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'bridal', name: 'Bridal', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
        { id: 'catering', name: 'Catering', icon: UtensilsCrossed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'promocodes', name: 'Promo Codes', icon: Tag, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    const renderManager = () => {
        switch (activeTab) {
            case 'attire': return <AttireManager />;
            case 'events': return <EventManager />;
            case 'bridal': return <BridalManager />;
            case 'catering': return <CateringManager />;
            case 'promocodes': return <PromoCodeManager />;
            default: return <AttireManager />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Catalog Management</h1>
                    <p className="text-slate-600">Manage products, packages, and services across categories</p>
                </div>
            </div>

            {/* Category Toggle */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Category)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                ? `bg-white ${tab.color} shadow-sm`
                                : 'text-slate-600 hover:text-primary hover:bg-white/50'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.name}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {renderManager()}
            </div>
        </div>
    );
}
