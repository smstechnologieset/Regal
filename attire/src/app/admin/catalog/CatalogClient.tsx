'use client';

import React, { useState } from 'react';
import { ShoppingBag, Calendar, Heart, UtensilsCrossed, Tag, Droplets, Smile, BookOpen, Gift } from 'lucide-react';
import AttireManager from '@/components/admin/catalog/AttireManager';
import EventManager from '@/components/admin/catalog/EventManager';
import BridalManager from '@/components/admin/catalog/BridalManager';
import CateringManager from '@/components/admin/catalog/CateringManager';
import PromoCodeManager from '@/components/admin/catalog/PromoCodeManager';
import GiftPackagesManager from '@/components/admin/catalog/GiftPackagesManager';
import ServiceCatalogManager from '@/components/admin/catalog/ServiceCatalogManager';
import {
  SEED_SKINCARE_PRODUCTS,
  SEED_TOYS_PRODUCTS,
  SEED_JOURNALS_PRODUCTS,
} from '@/lib/data/seedStorefrontProducts';

type Category =
  | 'attire'
  | 'skincare'
  | 'toys'
  | 'journals'
  | 'catering'
  | 'gifts'
  | 'bridal'
  | 'events'
  | 'promocodes';

export default function CatalogClient() {
    const [activeTab, setActiveTab] = useState<Category>('attire');

    const tabs = [
        { id: 'attire', name: 'Attire', icon: ShoppingBag, color: 'text-secondary', bg: 'bg-rose-50' },
        { id: 'skincare', name: ' Skincare', icon: Droplets, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { id: 'toys', name: ' Toys', icon: Smile, color: 'text-amber-700', bg: 'bg-amber-50' },
        { id: 'journals', name: 'Journals', icon: BookOpen, color: 'text-indigo-700', bg: 'bg-indigo-50' },
        { id: 'catering', name: 'Catering', icon: UtensilsCrossed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'gifts', name: 'Gift Packages', icon: Gift, color: 'text-[#1E3A8A]', bg: 'bg-[#1E3A8A]/10' },
        { id: 'bridal', name: 'Bridal', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
        { id: 'events', name: 'Events', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'promocodes', name: 'Promo Codes', icon: Tag, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    const renderManager = () => {
        switch (activeTab) {
            case 'attire': return <AttireManager />;
            case 'skincare':
                return (
                    <ServiceCatalogManager
                        serviceId="skincare"
                        serviceTitle="Skincare & Body Care"
                        serviceColor="text-emerald-700"
                        subcategories={[
                            { id: 'raw-butters', name: 'Raw Butters' },
                            { id: 'face-oils', name: 'Herbal Face & Body Oils' },
                            { id: 'soaps', name: 'Artisan Soaps' },
                            { id: 'balms', name: 'Rescue Balms' },
                            { id: 'mother-baby', name: 'Mother & Baby Care' },
                        ]}
                        initialSeedProducts={SEED_SKINCARE_PRODUCTS}
                    />
                );
            case 'toys':
                return (
                    <ServiceCatalogManager
                        serviceId="toys"
                        serviceTitle="Grounded Childhood Toys"
                        serviceColor="text-amber-700"
                        subcategories={[
                            { id: 'modest-dolls', name: 'Modest Heirloom Dolls' },
                            { id: 'doll-clothing', name: 'Doll Wardrobes' },
                            { id: 'wooden-toys', name: 'Natural Wooden Toys' },
                            { id: 'keepsakes', name: 'Heirloom Keepsakes' },
                        ]}
                        initialSeedProducts={SEED_TOYS_PRODUCTS}
                    />
                );
            case 'journals':
                return (
                    <ServiceCatalogManager
                        serviceId="journals"
                        serviceTitle="Mindful Journals & Tools"
                        serviceColor="text-indigo-700"
                        subcategories={[
                            { id: 'daily-journals', name: 'Daily Reflection & Gratitude' },
                            { id: 'habit-trackers', name: 'Habit & Alignment Trackers' },
                            { id: 'motherhood', name: 'Motherhood Keepsakes' },
                            { id: 'planners', name: 'Value Alignment Planners' },
                        ]}
                        initialSeedProducts={SEED_JOURNALS_PRODUCTS}
                    />
                );
            case 'events': return <EventManager />;
            case 'bridal': return <BridalManager />;
            case 'catering': return <CateringManager />;
            case 'gifts': return <GiftPackagesManager />;
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
