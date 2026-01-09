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
    pageSize: number = 12
): Promise<PaginatedResponse<Product>> {
    return attireService.getProducts(filters, sort, page, pageSize);
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
    return attireService.getProductById(id);
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<Category[]> {
    return attireService.getCategories();
}

/**
 * Search products by query
 */
export async function searchProducts(query: string): Promise<Product[]> {
    return attireService.searchProducts(query);
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(): Promise<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
}> {
    return attireService.getFeaturedProducts();
}

/**
 * Get related products (same category, excluding current product)
 */
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    return attireService.getRelatedProducts(productId, limit);
}

/**
 * Submit an attire order
 * Routes to attire service
 */
export async function submitOrder(orderData: any): Promise<{ orderId: string; success: boolean }> {
    // Note: The UI might need small adjustments to pass the right data structure
    // but the service handles the Supabase interaction.
    const result = await attireService.submitAttireOrder(orderData);
    return {
        orderId: result.orderId,
        success: result.success
    };
}

