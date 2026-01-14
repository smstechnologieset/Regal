/**
 * API Service Layer
 * 
 * This module provides a centralized interface for all attire data fetching.
 * It routes calls to the Supabase attire service.
 */

import { Product, Category, FilterOptions, SortOption, PaginatedResponse } from '@/types';
import * as attireService from './services/attire';

/**
 * Fetch all products with optional filtering and sorting
 */
export async function getProducts(
    filters?: FilterOptions,
    sort?: SortOption,
    page: number = 1,
    pageSize: number = 12,
    signal?: AbortSignal
): Promise<PaginatedResponse<Product>> {
    return attireService.getProducts(filters, sort, page, pageSize, signal);
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string, signal?: AbortSignal): Promise<Product | null> {
    return attireService.getProductById(id, signal);
}

/**
 * Fetch all categories
 */
export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
    return attireService.getCategories(signal);
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(signal?: AbortSignal): Promise<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
}> {
    return attireService.getFeaturedProducts(signal);
}

/**
 * Get related products (same category, excluding current product)
 */
export async function getRelatedProducts(productId: string, limit: number = 4, signal?: AbortSignal): Promise<Product[]> {
    return attireService.getRelatedProducts(productId, limit, signal);
}

/**
 * Submit an attire order
 * Routes to attire service
 */
export async function submitOrder(orderData: Record<string, unknown>): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    return attireService.createOrder(orderData);
}

