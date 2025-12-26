/**
 * API Service Layer
 * 
 * This module provides a centralized interface for all data fetching operations.
 * Currently using mock data, but structured to easily swap for real API calls.
 * 
 * To integrate with a real backend:
 * 1. Replace mock data imports with fetch/axios calls
 * 2. Update the base URL in the configuration
 * 3. Add authentication headers as needed
 */

import { Product, Category, FilterOptions, SortOption, PaginatedResponse } from '@/types';
import { products, categories, getProductById as getMockProductById } from '@/data/mock/products';

// Simulated API delay (remove in production)
const simulateDelay = (ms: number = 300): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Fetch all products with optional filtering and sorting
 */
export async function getProducts(
    filters?: FilterOptions,
    sort?: SortOption,
    page: number = 1,
    pageSize: number = 12
): Promise<PaginatedResponse<Product>> {
    await simulateDelay();

    let filteredProducts = [...products];

    // Apply filters
    if (filters) {
        if (filters.category) {
            filteredProducts = filteredProducts.filter(p => p.category === filters.category);
        }
        if (filters.subcategory) {
            filteredProducts = filteredProducts.filter(p => p.subcategory === filters.subcategory);
        }
        if (filters.sizes && filters.sizes.length > 0) {
            filteredProducts = filteredProducts.filter(p =>
                filters.sizes!.some(size => p.sizes.includes(size))
            );
        }
        if (filters.colors && filters.colors.length > 0) {
            filteredProducts = filteredProducts.filter(p =>
                filters.colors!.some(color => p.colors.some(c => c.name === color))
            );
        }
        if (filters.priceRange) {
            filteredProducts = filteredProducts.filter(p =>
                p.price >= filters.priceRange!.min && p.price <= filters.priceRange!.max
            );
        }
        if (filters.inStock !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.inStock === filters.inStock);
        }
    }

    // Apply sorting
    if (sort) {
        switch (sort) {
            case 'newest':
                filteredProducts.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                break;
            case 'price-asc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'popularity':
                filteredProducts.sort((a, b) => b.popularity - a.popularity);
                break;
        }
    }

    // Apply pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

    return {
        data: paginatedProducts,
        total,
        page,
        pageSize,
        totalPages,
    };
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
    await simulateDelay();
    return getMockProductById(id) || null;
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<Category[]> {
    await simulateDelay(200);
    return categories;
}

/**
 * Search products by query
 */
export async function searchProducts(query: string): Promise<Product[]> {
    await simulateDelay();

    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return [];

    return products.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
    );
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(): Promise<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
}> {
    await simulateDelay();

    return {
        newArrivals: products.filter(p => p.badges.includes('new')).slice(0, 8),
        bestsellers: products.filter(p => p.badges.includes('bestseller')).slice(0, 8),
        onSale: products.filter(p => p.badges.includes('sale')).slice(0, 8),
    };
}

/**
 * Get related products (same category, excluding current product)
 */
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    await simulateDelay();

    const currentProduct = getMockProductById(productId);
    if (!currentProduct) return [];

    return products
        .filter(p => p.category === currentProduct.category && p.id !== productId)
        .slice(0, limit);
}

/**
 * Placeholder for future order submission
 * Currently just simulates success
 */
export async function submitOrder(orderData: {
    items: { productId: string; quantity: number; size: string; color: string }[];
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
}): Promise<{ orderId: string; success: boolean }> {
    await simulateDelay(500);

    // Generate a mock order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // In a real implementation, this would send data to the backend
    console.log('Order submitted:', orderData);

    return {
        orderId,
        success: true,
    };
}
