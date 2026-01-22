import { getSupabaseClient } from '@/lib/supabase/client';
import { Product, Category, FilterOptions, SortOption, PaginatedResponse, ProductColor, ProductBadge } from '@/types';

/**
 * Utility to retry a Supabase query with exponential backoff
 */
async function withRetry<T>(
    fn: (signal?: AbortSignal) => Promise<{ data: T | null; error: any; count?: number | null }>,
    retries = 3,
    delay = 500,
    timeoutMs = 15000, // Reduced to 15s - if it takes longer, better to retry or fail early than hog slots
    signal?: AbortSignal
): Promise<{ data: T | null; error: any; count?: number | null }> {
    let lastError: any;

    // If the external signal is already aborted, don't even start
    if (signal?.aborted) {
        return { data: null, error: new Error('Request aborted'), count: 0 };
    }

    for (let i = 0; i < retries; i++) {
        const attempt = i + 1;
        const timestamp = new Date().toLocaleTimeString();

        // Create an internal timeout controller
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

        try {
            console.log(`[${timestamp}] FETCH START: Attempt ${attempt}/${retries}`);

            // Execute the function, passing it a signal that combines the external and timeout signals
            // (In recent Node/Browsers we can use AbortSignal.any, but for compatibility we'll manually check)
            const result = await fn(timeoutController.signal);

            if (!result.error) {
                console.log(`[${timestamp}] FETCH SUCCESS on attempt ${attempt}`);
                return result;
            }

            lastError = result.error;
            console.warn(`[${timestamp}] FETCH FAILURE: Attempt ${attempt} failed with:`, lastError.message || lastError);

            if (lastError.code === 'PGRST116') return result;

        } catch (err: any) {
            lastError = err;
            if (err.name === 'AbortError' || err.message?.includes('timed out')) {
                console.warn(`[${timestamp}] FETCH TIMEOUT/ABORT on attempt ${attempt}`);
            } else {
                console.error(`[${timestamp}] FETCH CRITICAL: Error on attempt ${attempt}:`, err.message || err);
            }
        } finally {
            clearTimeout(timeoutId);
        }

        if (i < retries - 1 && !signal?.aborted) {
            const backoff = delay * Math.pow(2, i);
            console.log(`[${timestamp}] FETCH RETRY: Waiting ${backoff}ms before attempt ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
        }

        if (signal?.aborted) break;
    }

    return { data: null, error: lastError || new Error('Request failed after retries'), count: 0 };
}

/**
 * Fetch products from the database with filtering, sorting, and pagination.
 */
export async function getProducts(
    options: FilterOptions = {},
    sort: SortOption = 'newest',
    page: number = 1,
    pageSize: number = 12,
    signal?: AbortSignal
): Promise<PaginatedResponse<Product>> {
    console.log(`Fetching products: page=${page}, size=${pageSize}, sort=${sort}`);
    const { data, error, count } = await withRetry((retrySignal) => {
        let q = getSupabaseClient()
            .from('products')
            .select('*', { count: 'exact' });

        if (retrySignal) q = q.abortSignal(retrySignal);

        if (options.category) q = q.eq('category', options.category);
        if (options.subcategory) q = q.eq('subcategory', options.subcategory);
        if (options.sizes && options.sizes.length > 0) q = q.contains('sizes', options.sizes);
        if (options.priceRange) q = q.gte('price', options.priceRange.min).lte('price', options.priceRange.max);
        if (options.inStock !== undefined) q = q.eq('in_stock', options.inStock);
        if (options.badges && options.badges.length > 0) q = q.contains('badges', options.badges);

        switch (sort) {
            case 'newest': q = q.order('created_at', { ascending: false }); break;
            case 'price-asc': q = q.order('price', { ascending: true }); break;
            case 'price-desc': q = q.order('price', { ascending: false }); break;
            case 'popularity': q = q.order('popularity', { ascending: false }); break;
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        return q.range(from, to);
    });

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

    // Filter by onSale if requested (client-side filter on the current page of results)
    let finalData = ((data as any[]) || []).map((item: any) => ({
        id: item.id as string,
        name: item.name as string,
        description: item.description as string,
        price: item.price as number,
        originalPrice: item.original_price as number,
        category: item.category as string,
        subcategory: item.subcategory as string,
        sizes: (item.sizes as string[]) || [],
        colors: (item.colors as ProductColor[]) || [],
        images: (item.images as string[]) || [],
        badges: (item.badges as ProductBadge[]) || [],
        rating: item.rating as number,
        reviewCount: item.review_count as number,
        popularity: item.popularity as number,
        createdAt: item.created_at as string,
        inStock: item.in_stock as boolean,
        stockCount: item.stock_count as number,
    }));

    if (options.onSale !== undefined) {
        if (options.onSale) {
            finalData = finalData.filter((p: Product) => (p.originalPrice ?? 0) > p.price);
        } else {
            finalData = finalData.filter((p: Product) => !((p.originalPrice ?? 0) > p.price));
        }
    }

    return {
        data: finalData,
        total,
        page,
        pageSize,
        totalPages,
    };
}

/**
 * Fetch a single product by its ID
 */
export async function getProductById(id: string, signal?: AbortSignal): Promise<Product | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await withRetry((retrySignal) => {
        let q = supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (retrySignal) q = q.abortSignal(retrySignal);
        return q;
    }, 3, 500, 15000, signal);

    if (error || !data) {
        // Only log actual errors, not "not found" (PGRST116)
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching product:', error);
        }
        return null;
    }

    const p = data as any;
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.original_price,
        category: p.category,
        subcategory: p.subcategory,
        sizes: p.sizes || [],
        colors: p.colors || [],
        images: p.images || [],
        badges: p.badges || [],
        rating: p.rating,
        reviewCount: p.review_count,
        popularity: p.popularity,
        createdAt: p.created_at,
        inStock: p.in_stock,
        stockCount: p.stock_count,
    };
}

/**
 * Fetch all attire categories
 */
export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
    const { data, error } = await withRetry((retrySignal) => {
        let q = getSupabaseClient()
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (retrySignal) q = q.abortSignal(retrySignal);
        return q;
    }, 3, 500, 15000, signal);

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return ((data as any[]) || []).map((cat: any) => ({
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
export async function getFeaturedProducts(signal?: AbortSignal): Promise<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
}> {
    console.log('Fetching featured products (sequential with cancellation support)...');

    try {
        // Sequentialize to avoid hitting browser connection limits
        const newRes = await getProducts({ badges: ['new'] }, 'newest', 1, 8, signal);
        const bestRes = await getProducts({ badges: ['bestseller'] }, 'popularity', 1, 8, signal);
        const saleRes = await getProducts({ onSale: true }, 'newest', 1, 8, signal);

        return {
            newArrivals: newRes.data || [],
            bestsellers: bestRes.data || [],
            onSale: saleRes.data || [],
        };
    } catch (error) {
        console.error('Error in getFeaturedProducts:', error);
        return {
            newArrivals: [],
            bestsellers: [],
            onSale: [],
        };
    }
}

/**
 * Fetch related products for a given product
 */
export async function getRelatedProducts(productId: string, limit: number = 4, signal?: AbortSignal): Promise<Product[]> {
    const supabase = getSupabaseClient();

    // First get the current product's category
    let q1 = supabase
        .from('products')
        .select('category')
        .eq('id', productId)
        .single();

    if (signal) q1 = q1.abortSignal(signal);
    const { data: product } = await q1;

    if (!product) return [];

    // Then find other products in the same category
    let q2 = supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .neq('id', productId)
        .limit(limit);

    if (signal) q2 = q2.abortSignal(signal);
    const { data: related } = await q2;

    return (related || []).map((item: Record<string, unknown>) => ({
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
export async function createOrder(orderData: Record<string, unknown>): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    // 1. Verify stock availability for all items first
    for (const item of orderData.items as any[]) {
        const { data: product, error: stockCheckError } = await supabase
            .from('products')
            .select('stock_count, in_stock, name')
            .eq('id', item.productId)
            .single();

        if (stockCheckError || !product) {
            console.error(`Error checking stock for ${item.product.id}:`, stockCheckError);
            return { orderId: '', conversationId: '', success: false };
        }

        if (!product.in_stock || product.stock_count < item.quantity) {
            console.error(`Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stock_count}`);
            return { orderId: '', conversationId: '', success: false };
        }
    }

    // 2. Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: orderData.userId,
            total: orderData.total,
            status: 'pending',
            details: orderData.items,
            shipping_address: orderData.shippingAddress,
            service_type: 'attire',
            promo_code: orderData.promoCode || null,
            discount_amount: orderData.discount || 0,
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating order:', orderError);
        return { orderId: '', conversationId: '', success: false };
    }

    // 3. Increment promo code usage count if used
    if (orderData.promoCode) {
        try {
            const { error: promoUpdateError } = await supabase.rpc('increment_promo_usage', {
                p_code: orderData.promoCode
            });

            if (promoUpdateError) {
                // If RPC fails (e.g. not exists), try manual update
                const { data: promo } = await supabase
                    .from('promo_codes')
                    .select('id, usage_count')
                    .eq('code', orderData.promoCode)
                    .single();

                if (promo) {
                    await supabase
                        .from('promo_codes')
                        .update({ usage_count: (promo.usage_count || 0) + 1 })
                        .eq('id', promo.id);
                }
            }
        } catch (err) {
            console.error('Error updating promo usage:', err);
            // Don't fail the whole order if just usage count update fails
        }
    }

    // 3. Create an associated conversation
    const items = orderData.items as any[];
    const firstItemName = items[0]?.productName || items[0]?.product?.name || items[0]?.name || 'Attire Order';
    const displaySubject = items.length > 1
        ? `${firstItemName} +${items.length - 1} more`
        : firstItemName;

    try {
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({
                user_id: orderData.userId,
                order_id: order.id,
                service_type: 'attire',
                subject: displaySubject,
                status: 'open',
            })
            .select()
            .single();

        if (convError || !conversation) {
            console.error('Error creating conversation:', convError);
            // We still have the order, so return success but without conversation
            return { orderId: order.id, conversationId: '', success: true };
        }

        // 3. Create initial message
        const { error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation.id,
                sender_id: orderData.userId,
                content: `New order placed! Order ID: ${order.id}. I have a question about this order.`,
            });

        if (msgError) {
            console.error('Error creating initial message:', msgError);
        }

        return { orderId: order.id, conversationId: conversation.id, success: true };
    } catch (err) {
        console.error('Unexpected error in order flow:', err);
        // If conversation or message creation fails, we still consider the order placed successfully
        // but return without conversation ID.
        return { orderId: order.id, conversationId: '', success: true };
    }
}
