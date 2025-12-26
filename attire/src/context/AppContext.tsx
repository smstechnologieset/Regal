'use client';

/**
 * App Context
 * 
 * Provides global application state for search, filters, and UI preferences.
 * Handles search queries, filter options, and sort preferences.
 * 
 * Usage:
 * const { searchQuery, setSearchQuery, filters, setFilters } = useApp();
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FilterOptions, SortOption } from '@/types';

// App context interface
interface AppContextType {
    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Filters
    filters: FilterOptions;
    setFilters: (filters: FilterOptions) => void;
    updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
    clearFilters: () => void;

    // Sorting
    sortOption: SortOption;
    setSortOption: (option: SortOption) => void;

    // UI State
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;

    // Toast notifications
    toasts: Toast[];
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

// Default filter state
const defaultFilters: FilterOptions = {};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Filter state
    const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

    // Sort state
    const [sortOption, setSortOption] = useState<SortOption>('popularity');

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Toast state
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Update a single filter
    const updateFilter = useCallback(<K extends keyof FilterOptions>(
        key: K,
        value: FilterOptions[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    // Toggle mobile menu
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    // Close mobile menu
    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // Add toast notification
    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // Remove toast
    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value: AppContextType = {
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        sortOption,
        setSortOption,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        toasts,
        addToast,
        removeToast,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use app context
export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
