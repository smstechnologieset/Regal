/**
 * Attire Service API
 * 
 * Handles all attire-related data fetching and order submissions.
 * Uses the standard public Supabase client for client-side and server-side compatibility.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { Product, Category, FilterOptions, SortOption, PaginatedResponse } from '@/types';

/**
 * Fetch products from the database with filtering, sorting, and pagination.
 */
export async function getProducts(
    options: FilterOptions = {},
    sort: SortOption = 'newest',
    page: number = 1,
    pageSize: number = 12
): Promise<PaginatedResponse<Product>> {
    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

    // Apply filters
    if (options.category) {
        query = query.eq('category', options.category);
    }
    if (options.subcategory) {
        query = query.eq('subcategory', options.subcategory);
    }
    if (options.sizes && options.sizes.length > 0) {
        query = query.contains('sizes', options.sizes);
    }
    if (options.priceRange) {
        query = query.gte('price', options.priceRange.min).lte('price', options.priceRange.max);
    }
    if (options.inStock !== undefined) {
        query = query.eq('in_stock', options.inStock);
    }

    // Apply sorting
    switch (sort) {
        case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
        case 'price-asc':
            query = query.order('price', { ascending: true });
            break;
        case 'price-desc':
            query = query.order('price', { ascending: false });
            break;
        case 'popularity':
            query = query.order('popularity', { ascending: false });
            break;
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching products:', error);
        return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
        };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Transform database format to TypeScript interface format
    const transformedData = (data || []).map((item: Record<string, any>) => ({
        id: item.id as string,
        name: item.name as string,
        description: item.description as string,
        price: item.price as number,
        originalPrice: item.original_price as number,
        category: item.category as string,
        subcategory: item.subcategory as string,
        sizes: (item.sizes as string[]) || [],
        colors: (item.colors as any[]) || [],
        images: (item.images as string[]) || [],
        badges: (item.badges as any[]) || [],
        rating: item.rating as number,
        reviewCount: item.review_count as number,
        popularity: item.popularity as number,
        createdAt: item.created_at as string,
        inStock: item.in_stock as boolean,
        stockCount: item.stock_count as number,
    }));

    return {
        data: transformedData,
        total,
        page,
        pageSize,
        totalPages,
    };
}

/**
 * Fetch a single product by its ID
 */
export async function getProductById(id: string): Promise<Product | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Error fetching product:', error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        originalPrice: data.original_price,
        category: data.category,
        subcategory: data.subcategory,
        sizes: data.sizes || [],
        colors: data.colors || [],
        images: data.images || [],
        badges: data.badges || [],
        rating: data.rating,
        reviewCount: data.review_count,
        popularity: data.popularity,
        createdAt: data.created_at,
        inStock: data.in_stock,
        stockCount: data.stock_count,
    };
}

/**
 * Fetch all attire categories
 */
export async function getCategories(): Promise<Category[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return (data || []).map((cat: Record<string, any>) => ({
        id: cat.id as string,
        name: cat.name as string,
        slug: cat.slug as string,
        image: cat.image as string,
        subcategories: (cat.subcategories as any[]) || [],
    }));
}

/**
 * Fetch featured products for the landing page
 */
export async function getFeaturedProducts(): Promise<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
}> {
    const { data: products } = await getProducts({}, 'newest', 1, 100);

    return {
        newArrivals: products.filter((p: Product) => p.badges.includes('new')).slice(0, 8),
        bestsellers: products.filter((p: Product) => p.badges.includes('bestseller')).slice(0, 8),
        onSale: products.filter((p: Product) => p.badges.includes('sale')).slice(0, 8),
    };
}

/**
 * Fetch related products for a given product
 */
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    const supabase = getSupabaseClient();

    // First get the current product's category
    const { data: product } = await supabase
        .from('products')
        .select('category')
        .eq('id', productId)
        .single();

    if (!product) return [];

    // Then find other products in the same category
    const { data: related } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .neq('id', productId)
        .limit(limit);

    return (related || []).map((item: Record<string, any>) => ({
        id: item.id as string,
        name: item.name as string,
        description: item.description as string,
        price: item.price as number,
        originalPrice: item.original_price as number,
        category: item.category as string,
        sizes: item.sizes || [],
        colors: item.colors || [],
        images: item.images || [],
        badges: item.badges || [],
        rating: item.rating,
        reviewCount: item.review_count,
        popularity: item.popularity,
        createdAt: item.created_at,
        inStock: item.in_stock,
    }));
}

/**
 * Create a new order (Cash on Delivery)
 */
export async function createOrder(orderData: any): Promise<{ orderId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('orders')
        .insert({
            user_id: orderData.userId,
            total: orderData.total,
            status: 'pending',
            payment_method: 'cod',
            details: orderData.items,
            shipping_address: orderData.shippingAddress,
            service_type: 'attire',
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error creating order:', error);
        return { orderId: '', success: false };
    }

    return { orderId: data.id, success: true };
}
