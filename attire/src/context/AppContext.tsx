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

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { FilterOptions, SortOption, Category } from '@/types';
import { getCategories } from '@/lib/api';

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

    // Categories
    categories: Category[];
    categoriesLoading: boolean;
    refreshCategories: () => Promise<void>;

    // UI State
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;

    // Toast notifications
    toasts: Toast[];
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
    showApiError: (error: any, defaultMessage?: string) => Promise<void>;
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
    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
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

    // Centralized API Error handling
    const showApiError = useCallback(async (error: any, defaultMessage: string = 'Something went wrong') => {
        let message = defaultMessage;

        try {
            if (error instanceof Response) {
                const data = await error.json();
                message = data.error || data.message || message;
            } else if (error && typeof error === 'object') {
                message = error.message || error.error || message;
            } else if (typeof error === 'string') {
                message = error;
            }
        } catch (e) {
            console.error('Failed to parse error response:', e);
        }

        addToast(message, 'error');
    }, [addToast]);

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

    // Fetch categories on mount
    const fetchCategories = useCallback(async (signal?: AbortSignal) => {
        setCategoriesLoading(true);
        try {
            const data = await getCategories(signal);
            
            if (signal?.aborted) return;

            if (data.length === 0) {
                // ...
            }
            setCategories(data);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            console.error('AppProvider: Error fetching categories:', error);
            showApiError(error, 'Failed to load menu categories');
        } finally {
            if (!signal?.aborted) {
                setCategoriesLoading(false);
            }
        }
    }, [showApiError]);

    useEffect(() => {
        const controller = new AbortController();
        fetchCategories(controller.signal);
        
        return () => {
            controller.abort();
        };
    }, [fetchCategories]);

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
        showApiError,
        categories,
        categoriesLoading,
        refreshCategories: fetchCategories,
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
