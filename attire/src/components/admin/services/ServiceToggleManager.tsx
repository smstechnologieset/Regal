'use client';

/**
 * ServiceToggleManager Component
 *
 * Switchboard interface for administrators to turn services ON and OFF.
 * Provides instant feedback, status badges, and syncs across the site.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shirt,
  Droplets,
  Smile,
  BookOpen,
  UtensilsCrossed,
  Gift,
  Heart,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useServices } from '@/context/ServicesContext';
import { useApp } from '@/context/AppContext';
import { ServiceDefinition } from '@/lib/constants/services';

const iconMap = {
  Shirt,
  Droplets,
  Smile,
  BookOpen,
  UtensilsCrossed,
  Gift,
  Heart,
  Calendar,
};

export default function ServiceToggleManager() {
  const { services, isServiceEnabled, toggleService, resetToDefaults } = useServices();
  const { addToast } = useApp();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const activeCount = services.filter((s) => isServiceEnabled(s.id)).length;
  const disabledCount = services.length - activeCount;

  const handleToggle = async (service: ServiceDefinition) => {
    const current = isServiceEnabled(service.id);
    const next = !current;
    setUpdatingId(service.id);

    try {
      const ok = await toggleService(service.id, next);
      if (ok) {
        addToast(
          `${service.defaultName} is now ${next ? 'Active (Visible)' : 'Disabled (Hidden)'}`,
          'success'
        );
      } else {
        addToast('Saved locally; sync failed', 'info');
      }
    } catch (err) {
      addToast('Error updating service status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all services to default configuration? (Bridal and Events will be OFF; Attire, Skincare, Toys, Journals, Catering, Gifts will be ON)')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetToDefaults();
      addToast('Services reset to default configuration', 'success');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 text-[#4A5D4E] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>Service Visibility Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Service Controls & Toggles</h2>
          <p className="text-slate-600 text-sm mt-1">
            Turn services on or off. Toggled services will automatically show or hide in the Navbar, Mobile Menu, Homepage Services Grid, and Footer.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shrink-0 disabled:opacity-50"
        >
          {isResetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Services</p>
          <p className="text-3xl font-bold text-primary mt-1">{services.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200/80 p-5 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700">Active (Visible)</p>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-amber-700">Disabled (Hidden)</p>
            <XCircle size={18} className="text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-700 mt-1">{disabledCount}</p>
        </div>
      </div>

      {/* Services Switchboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {services.map((svc) => {
          const Icon = iconMap[svc.iconName] || Shirt;
          const isEnabled = isServiceEnabled(svc.id);
          const isUpdating = updatingId === svc.id;

          return (
            <div
              key={svc.id}
              className={`rounded-2xl border p-5 transition-all bg-white shadow-xs ${
                isEnabled ? 'border-slate-200/90' : 'border-slate-200/50 bg-slate-50/40 opacity-85'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isEnabled
                        ? 'bg-[#4A5D4E]/10 text-[#4A5D4E]'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-primary text-base">{svc.defaultName}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isEnabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-serif mt-0.5">{svc.nameAm}</p>
                  </div>
                </div>

                {/* Modern Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  disabled={isUpdating}
                  onClick={() => handleToggle(svc)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] focus:ring-offset-2 ${
                    isEnabled ? 'bg-[#4A5D4E]' : 'bg-slate-300'
                  } ${isUpdating ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                      isEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  >
                    {isUpdating && <Loader2 size={12} className="animate-spin text-slate-500" />}
                  </span>
                </button>
              </div>

              {/* Tagline & Route */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {svc.defaultTagline}
                </p>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {svc.href}
                  </span>
                  <Link
                    href={svc.href}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[#4A5D4E] hover:underline font-medium"
                  >
                    <span>Preview page</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
