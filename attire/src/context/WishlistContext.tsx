'use client';

/**
 * Wishlist Context
 * 
 * Provides global wishlist state management across the application.
 * Handles adding and removing products from the wishlist and persists to localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { storage } from '@/lib/utils';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getProductById } from '@/lib/services/attire';

interface WishlistContextType {
    items: Product[];
    addToWishlist: (product: Product) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => Promise<void>;
    itemCount: number;
    isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'attire-wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isTableMissingRef = React.useRef(false);
    const supabase = getSupabaseClient();

    // Fetch wishlist from Supabase or localStorage
    const fetchWishlist = useCallback(async (userId: string) => {
        // Pre-fill immediately from local storage for instant UI
        const savedWishlist = storage.get<Product[]>(WISHLIST_STORAGE_KEY, []);
        if (savedWishlist.length > 0) {
            setItems(savedWishlist);
        }

        if (isTableMissingRef.current) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error, status } = await supabase
                .from('wishlist')
                .select('product_id')
                .eq('user_id', userId);

            if (error) {
                // If table does not exist in Supabase (404 / 42P01), silence and rely on localStorage
                if (status === 404 || error.code === '42P01' || error.message?.includes('does not exist')) {
                    isTableMissingRef.current = true;
                }
                const fallbackWishlist = storage.get<Product[]>(WISHLIST_STORAGE_KEY, []);
                setItems(fallbackWishlist);
                return;
            }

            if (data && data.length > 0) {
                const productPromises = data.map((item: { product_id: string }) => getProductById(item.product_id));
                const products = await Promise.all(productPromises);
                const validProducts = products.filter((p): p is Product => p !== null);
                setItems(validProducts);
                storage.set(WISHLIST_STORAGE_KEY, validProducts);
            } else if (savedWishlist.length === 0) {
                setItems([]);
            }
        } catch {
            const fallbackWishlist = storage.get<Product[]>(WISHLIST_STORAGE_KEY, []);
            setItems(fallbackWishlist);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    // Initialize from Supabase if logged in, otherwise localStorage
    useEffect(() => {
        if (user) {
            fetchWishlist(user.id);
        } else {
            // Guest mode: load from localStorage
            const savedWishlist = storage.get<Product[]>(WISHLIST_STORAGE_KEY, []);
            setItems(savedWishlist);
            setIsLoading(false);
        }
    }, [user, fetchWishlist]);

    // Save to localStorage whenever items change and initial load is complete (works for all users)
    useEffect(() => {
        if (!isLoading) {
            storage.set(WISHLIST_STORAGE_KEY, items);
        }
    }, [items, isLoading]);

    const addToWishlist = useCallback(async (product: Product) => {
        // Optimistic update
        setItems(prev => {
            if (prev.some(item => item.id === product.id)) return prev;
            return [...prev, product];
        });

        if (user && !isTableMissingRef.current) {
            try {
                const { error, status } = await supabase
                    .from('wishlist')
                    .insert({ user_id: user.id, product_id: product.id });

                if (status === 404 || error?.code === '42P01') {
                    isTableMissingRef.current = true;
                }
            } catch {
                isTableMissingRef.current = true;
            }
        }
    }, [user, supabase]);

    const removeFromWishlist = useCallback(async (productId: string) => {
        // Optimistic update
        setItems(prev => prev.filter(item => item.id !== productId));

        if (user && !isTableMissingRef.current) {
            try {
                const { error, status } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);

                if (status === 404 || error?.code === '42P01') {
                    isTableMissingRef.current = true;
                }
            } catch {
                isTableMissingRef.current = true;
            }
        }
    }, [user, supabase]);

    const isInWishlist = useCallback((productId: string) => {
        return items.some(item => item.id === productId);
    }, [items]);

    const clearWishlist = useCallback(async () => {
        setItems([]);
        if (user && !isTableMissingRef.current) {
            try {
                const { error, status } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id);

                if (status === 404 || error?.code === '42P01') {
                    isTableMissingRef.current = true;
                }
            } catch {
                isTableMissingRef.current = true;
            }
        }
    }, [user, supabase]);

    const value: WishlistContextType = {
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        itemCount: items.length,
        isLoading,
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
