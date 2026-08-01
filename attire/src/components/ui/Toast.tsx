'use client';

/**
 * Toast Component
 * 
 * Notification toast display for cart actions and other feedback.
 * Rendered at root level, controlled by AppContext.
 */

import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

const toastIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const toastStyles = {
    success: 'bg-sky-50 border-sky-200 text-sky-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
    success: 'text-sky-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

export default function ToastContainer() {
    const { toasts, removeToast } = useApp();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => {
                const Icon = toastIcons[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in-right',
                            toastStyles[toast.type]
                        )}
                    >
                        <Icon size={20} className={cn('flex-shrink-0 mt-0.5', iconStyles[toast.type])} />
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
