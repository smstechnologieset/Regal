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
    const supabase = getSupabaseClient();

    // Fetch wishlist from Supabase
    const fetchWishlist = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('wishlist')
                .select('product_id')
                .eq('user_id', userId);

            if (error) throw error;

            if (data && data.length > 0) {
                // Fetch product details for each wishlist item
                const productPromises = data.map((item: { product_id: string }) => getProductById(item.product_id));
                const products = await Promise.all(productPromises);
                setItems(products.filter((p): p is Product => p !== null));
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
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

    // Save to localStorage for guests
    useEffect(() => {
        if (!user && !isLoading) {
            storage.set(WISHLIST_STORAGE_KEY, items);
        }
    }, [items, user, isLoading]);

    const addToWishlist = useCallback(async (product: Product) => {
        // Optimistic update
        setItems(prev => {
            if (prev.some(item => item.id === product.id)) return prev;
            return [...prev, product];
        });

        if (user) {
            try {
                const { error } = await supabase
                    .from('wishlist')
                    .insert({ user_id: user.id, product_id: product.id });

                if (error && error.code !== '23505') throw error; // Ignore unique constraint violation
            } catch (error) {
                console.error('Error adding to wishlist in DB:', error);
                // Revert on error?
            }
        }
    }, [user, supabase]);

    const removeFromWishlist = useCallback(async (productId: string) => {
        // Optimistic update
        setItems(prev => prev.filter(item => item.id !== productId));

        if (user) {
            try {
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);

                if (error) throw error;
            } catch (error) {
                console.error('Error removing from wishlist in DB:', error);
            }
        }
    }, [user, supabase]);

    const isInWishlist = useCallback((productId: string) => {
        return items.some(item => item.id === productId);
    }, [items]);

    const clearWishlist = useCallback(async () => {
        setItems([]);
        if (user) {
            try {
                const { error } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id);

                if (error) throw error;
            } catch (error) {
                console.error('Error clearing wishlist in DB:', error);
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
