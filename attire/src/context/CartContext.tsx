'use client';

/**
 * Cart Context
 * 
 * Provides global cart state management across the application.
 * Handles adding, removing, updating cart items and persists to localStorage.
 * 
 * Usage:
 * const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { CartItem, Product, ProductColor } from '@/types';
import { storage } from '@/lib/utils';
import { useAuth } from './AuthContext';

// Cart state interface
interface CartState {
    items: CartItem[];
    isLoading: boolean;
    isOpen: boolean; // For cart drawer/modal
}

// Cart context interface
interface CartContextType extends CartState {
    addToCart: (product: Product, size: string, color: ProductColor, quantity?: number) => void;
    removeFromCart: (productId: string, size: string, colorName: string) => void;
    updateQuantity: (productId: string, size: string, colorName: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    closeCart: () => void;
    getCartTotal: () => number;
    getCartItemCount: () => number;
    isInCart: (productId: string, size: string, colorName: string) => boolean;
}

// Action types
type CartAction =
    | { type: 'SET_CART'; payload: CartItem[] }
    | { type: 'ADD_ITEM'; payload: CartItem }
    | { type: 'REMOVE_ITEM'; payload: { productId: string; size: string; colorName: string } }
    | { type: 'UPDATE_QUANTITY'; payload: { productId: string; size: string; colorName: string; quantity: number } }
    | { type: 'CLEAR_CART' }
    | { type: 'TOGGLE_CART' }
    | { type: 'CLOSE_CART' }
    | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: CartState = {
    items: [],
    isLoading: true,
    isOpen: false,
};

// Reducer function
function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case 'SET_CART':
            return { ...state, items: action.payload, isLoading: false };

        case 'ADD_ITEM': {
            const existingIndex = state.items.findIndex(
                item =>
                    item.product.id === action.payload.product.id &&
                    item.selectedSize === action.payload.selectedSize &&
                    item.selectedColor.name === action.payload.selectedColor.name
            );

            if (existingIndex >= 0) {
                // Update quantity if item exists
                const updatedItems = [...state.items];
                updatedItems[existingIndex] = {
                    ...updatedItems[existingIndex],
                    quantity: updatedItems[existingIndex].quantity + action.payload.quantity,
                };
                return { ...state, items: updatedItems };
            }

            return { ...state, items: [...state.items, action.payload] };
        }

        case 'REMOVE_ITEM':
            return {
                ...state,
                items: state.items.filter(
                    item =>
                        !(
                            item.product.id === action.payload.productId &&
                            item.selectedSize === action.payload.size &&
                            item.selectedColor.name === action.payload.colorName
                        )
                ),
            };

        case 'UPDATE_QUANTITY': {
            const updatedItems = state.items.map(item => {
                if (
                    item.product.id === action.payload.productId &&
                    item.selectedSize === action.payload.size &&
                    item.selectedColor.name === action.payload.colorName
                ) {
                    return { ...item, quantity: action.payload.quantity };
                }
                return item;
            });
            return { ...state, items: updatedItems };
        }

        case 'CLEAR_CART':
            return { ...state, items: [] };

        case 'TOGGLE_CART':
            return { ...state, isOpen: !state.isOpen };

        case 'CLOSE_CART':
            return { ...state, isOpen: false };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        default:
            return state;
    }
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'attire-cart-guest';
const USER_CART_PREFIX = 'attire-cart-';

function getStorageKey(userId?: string) {
    return userId ? `${USER_CART_PREFIX}${userId}` : GUEST_CART_KEY;
}

// Provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const { user } = useAuth();
    const isFirstLoad = useRef(true);
    const prevUserId = useRef<string | null | undefined>(undefined);

    // Initial load and merging logic
    useEffect(() => {
        // Skip if it is not the first load OR if user state hasn't settled
        const currentKey = getStorageKey(user?.id);
        const savedCart = storage.get<CartItem[]>(currentKey, []);

        if (isFirstLoad.current) {
            dispatch({ type: 'SET_CART', payload: savedCart });
            isFirstLoad.current = false;
            prevUserId.current = user?.id;
            return;
        }

        // Handle Login (Guest -> User)
        if (user?.id && !prevUserId.current) {
            console.log('CartContext: User logged in, merging guest cart...');
            const guestCart = storage.get<CartItem[]>(GUEST_CART_KEY, []);
            const userCart = storage.get<CartItem[]>(getStorageKey(user.id), []);

            // Merging logic: user items + guest items (avoiding duplicates)
            const mergedItems = [...userCart];
            guestCart.forEach(guestItem => {
                const existingIndex = mergedItems.findIndex(
                    uItem =>
                        uItem.product.id === guestItem.product.id &&
                        uItem.selectedSize === guestItem.selectedSize &&
                        uItem.selectedColor.name === guestItem.selectedColor.name
                );

                if (existingIndex >= 0) {
                    mergedItems[existingIndex].quantity += guestItem.quantity;
                } else {
                    mergedItems.push(guestItem);
                }
            });

            dispatch({ type: 'SET_CART', payload: mergedItems });
            // Clear guest cart after merging
            storage.remove(GUEST_CART_KEY);
        }
        // Handle Logout (User -> Guest)
        else if (!user?.id && prevUserId.current) {
            console.log('CartContext: User logged out, reverting to guest cart...');
            const guestCart = storage.get<CartItem[]>(GUEST_CART_KEY, []);
            dispatch({ type: 'SET_CART', payload: guestCart });
        }

        prevUserId.current = user?.id;
    }, [user?.id]);

    // Save cart to specific storage when items change
    useEffect(() => {
        if (!state.isLoading) {
            const currentKey = getStorageKey(user?.id);
            storage.set(currentKey, state.items);
        }
    }, [state.items, state.isLoading, user?.id]);

    // Add item to cart
    const addToCart = useCallback(
        (product: Product, size: string, color: ProductColor, quantity: number = 1) => {
            dispatch({
                type: 'ADD_ITEM',
                payload: {
                    product,
                    quantity,
                    selectedSize: size,
                    selectedColor: color,
                },
            });
        },
        []
    );

    // Remove item from cart
    const removeFromCart = useCallback(
        (productId: string, size: string, colorName: string) => {
            dispatch({ type: 'REMOVE_ITEM', payload: { productId, size, colorName } });
        },
        []
    );

    // Update item quantity
    const updateQuantity = useCallback(
        (productId: string, size: string, colorName: string, quantity: number) => {
            if (quantity < 1) {
                removeFromCart(productId, size, colorName);
                return;
            }
            dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, size, colorName, quantity } });
        },
        [removeFromCart]
    );

    // Clear entire cart
    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' });
    }, []);

    // Toggle cart visibility
    const toggleCart = useCallback(() => {
        dispatch({ type: 'TOGGLE_CART' });
    }, []);

    // Close cart
    const closeCart = useCallback(() => {
        dispatch({ type: 'CLOSE_CART' });
    }, []);

    // Calculate cart total
    const getCartTotal = useCallback(() => {
        return state.items.reduce((total: number, item) => total + item.product.price * item.quantity, 0);
    }, [state.items]);

    // Get total item count
    const getCartItemCount = useCallback(() => {
        return state.items.reduce((count: number, item) => count + item.quantity, 0);
    }, [state.items]);

    // Check if item is in cart
    const isInCart = useCallback(
        (productId: string, size: string, colorName: string) => {
            return state.items.some(
                item =>
                    item.product.id === productId &&
                    item.selectedSize === size &&
                    item.selectedColor.name === colorName
            );
        },
        [state.items]
    );

    const value: CartContextType = {
        ...state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        closeCart,
        getCartTotal,
        getCartItemCount,
        isInCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook to use cart context
export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
