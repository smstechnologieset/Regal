/**
 * Attire Service API
 * 
 * Handles all attire shop data fetching and order submissions.
 * Replaces mock data with Supabase queries.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { Product, Category, FilterOptions, SortOption, PaginatedResponse } from '@/types';

/**
 * Transform database product to TypeScript interface
 */
function transformProduct(dbProduct: Record<string, unknown>): Product {
    return {
        id: dbProduct.id as string,
        name: dbProduct.name as string,
        description: dbProduct.description as string,
        price: Number(dbProduct.price),
        originalPrice: dbProduct.original_price ? Number(dbProduct.original_price) : undefined,
        category: dbProduct.category as string,
        subcategory: dbProduct.subcategory as string | undefined,
        sizes: (dbProduct.sizes as string[]) || [],
        colors: (dbProduct.colors as { name: string; hex: string }[]) || [],
        images: (dbProduct.images as string[]) || [],
        badges: (dbProduct.badges as ('new' | 'sale' | 'bestseller' | 'limited')[]) || [],
        rating: Number(dbProduct.rating) || 0,
        reviewCount: Number(dbProduct.review_count) || 0,
        popularity: Number(dbProduct.popularity) || 0,
        createdAt: dbProduct.created_at as string,
        inStock: dbProduct.in_stock as boolean,
        stockCount: Number(dbProduct.stock_count) || 0,
    };
}

/**
 * Fetch all products with optional filtering and sorting
 */
export async function getProducts(
    filters?: FilterOptions,
    sort?: SortOption,
    page: number = 1,
    pageSize: number = 12
): Promise<PaginatedResponse<Product>> {
    const supabase = getSupabaseClient();

    // Build query
    let query = supabase.from('products').select('*', { count: 'exact' });

    // Apply filters
    if (filters) {
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.subcategory) {
            query = query.eq('subcategory', filters.subcategory);
        }
        if (filters.inStock !== undefined) {
            query = query.eq('in_stock', filters.inStock);
        }
        if (filters.priceRange) {
            query = query.gte('price', filters.priceRange.min).lte('price', filters.priceRange.max);
        }
        // Note: sizes and colors filters would need array containment which is more complex
    }

    // Apply sorting
    if (sort) {
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
    } else {
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching products:', error);
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
        data: (data || []).map(transformProduct),
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

    return transformProduct(data);
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<Category[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('categories')
        .select('*');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return (data || []).map((cat: Record<string, unknown>) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        subcategories: cat.subcategories || [],
    }));
}

/**
 * Search products by query
 */
export async function searchProducts(query: string): Promise<Product[]> {
    const supabase = getSupabaseClient();

    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .limit(20);

    if (error) {
        console.error('Error searching products:', error);
        return [];
    }

    return (data || []).map(transformProduct);
}

/**
 * Get featured products for homepage
 */
export async function getFeaturedProducts(): Promise<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
}> {
    const supabase = getSupabaseClient();

    // Fetch all products and filter client-side for badges
    // (Supabase array containment requires specific syntax)
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching featured products:', error);
        return { newArrivals: [], bestsellers: [], onSale: [] };
    }

    const products = (data || []).map(transformProduct);

    return {
        newArrivals: products.filter((p: Product) => p.badges.includes('new')).slice(0, 8),
        bestsellers: products.filter((p: Product) => p.badges.includes('bestseller')).slice(0, 8),
        onSale: products.filter((p: Product) => p.badges.includes('sale')).slice(0, 8),
    };
}

/**
 * Get related products (same category, excluding current product)
 */
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    const supabase = getSupabaseClient();

    // First get the current product's category
    const { data: currentProduct } = await supabase
        .from('products')
        .select('category')
        .eq('id', productId)
        .single();

    if (!currentProduct) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', currentProduct.category)
        .neq('id', productId)
        .eq('in_stock', true)
        .limit(limit);

    if (error) {
        console.error('Error fetching related products:', error);
        return [];
    }

    return (data || []).map(transformProduct);
}

/**
 * Submit an attire order (creates order + conversation)
 */
export async function submitAttireOrder(orderData: {
    userId: string;
    items: { productId: string; productName: string; quantity: number; size: string; color: string; price: number }[];
    shippingAddress: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    subtotal: number;
    shipping: number;
    total: number;
}): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    // Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: orderData.userId,
            service_type: 'attire',
            status: 'pending',
            total: orderData.total,
            details: {
                items: orderData.items,
                shippingAddress: orderData.shippingAddress,
                subtotal: orderData.subtotal,
                shipping: orderData.shipping,
                paymentMethod: 'cod',
            },
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating attire order:', orderError);
        return { orderId: '', conversationId: '', success: false };
    }

    // Create a conversation for this order
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
            user_id: orderData.userId,
            service_type: 'attire',
            order_id: order.id,
            subject: `Order Confirmation: ${orderData.items.length} item(s) - $${orderData.total.toFixed(2)}`,
            status: 'open',
        })
        .select()
        .single();

    if (convError || !conversation) {
        console.error('Error creating conversation:', convError);
        return { orderId: order.id, conversationId: '', success: true };
    }

    // Send initial message with order details
    const itemsList = orderData.items.map(item =>
        `• ${item.productName} (${item.size}, ${item.color}) x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const messageContent = `
**Order Confirmation**

📦 **Order ID:** ${order.id.slice(0, 8)}

**Items:**
${itemsList}

---
**Subtotal:** $${orderData.subtotal.toFixed(2)}
**Shipping:** ${orderData.shipping === 0 ? 'FREE' : `$${orderData.shipping.toFixed(2)}`}
**Total:** $${orderData.total.toFixed(2)}

---
**Shipping Address:**
${orderData.shippingAddress.fullName}
${orderData.shippingAddress.address}
${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}
${orderData.shippingAddress.country}

📞 ${orderData.shippingAddress.phone}
📧 ${orderData.shippingAddress.email}

---
*Payment Method: Cash on Delivery*
    `.trim();

    await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: orderData.userId,
        content: messageContent,
    });

    return {
        orderId: order.id,
        conversationId: conversation.id,
        success: true,
    };
}
