import { getSupabaseClient } from '@/lib/supabase/client';
import { withRetry } from '@/lib/supabase/utils';
import { Product, Category, FilterOptions, SortOption, PaginatedResponse, ProductColor, ProductBadge } from '@/types';

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
    try {
        const { data, count } = await withRetry(async (retrySignal) => {
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
            q = q.range(from, to);

            const result = await q;
            if (result.error) throw result.error;
            return result;
        }, 3, 500, 15000, signal);

        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);

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
            estimatedRestockDate: item.estimated_restock_date as string | undefined,
            allowPreorder: item.allow_preorder as boolean | undefined,
            preorderCount: item.preorder_count as number | undefined,
            estimatedDeliveryDays: item.estimated_delivery_days as number | undefined,
        }));

        if (options.onSale !== undefined) {
            finalData = finalData.filter((p: Product) =>
                options.onSale ? (p.originalPrice ?? 0) > p.price : !((p.originalPrice ?? 0) > p.price)
            );
        }

        return {
            data: finalData,
            total,
            page,
            pageSize,
            totalPages,
        };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
}

/**
 * Fetch a single product by its ID
 */
export async function getProductById(id: string, signal?: AbortSignal): Promise<Product | null> {
    const supabase = getSupabaseClient();
    try {
        const data = await withRetry(async (retrySignal) => {
            let q = supabase.from('products').select('*').eq('id', id).maybeSingle();
            if (retrySignal) q = q.abortSignal(retrySignal);
            const result = await q;
            if (result.error) throw result.error;
            return result.data;
        }, 3, 500, 15000, signal);

        if (!data) return null;

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
            estimatedRestockDate: p.estimated_restock_date,
            allowPreorder: p.allow_preorder,
            preorderCount: p.preorder_count,
            estimatedDeliveryDays: p.estimated_delivery_days,
        };
    } catch (error: any) {
        if (error?.code !== 'PGRST116') {
            console.error('Error fetching product:', error);
        }
        return null;
    }
}

/**
 * Fetch all attire categories
 */
export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
    console.log('[attireService] getCategories: Querying Supabase...');
    try {
        const data = await withRetry(async (retrySignal) => {
            const supabase = getSupabaseClient();
            let q = supabase.from('categories').select('*').order('name', { ascending: true });
            if (retrySignal) q = q.abortSignal(retrySignal);
            const result = await q;
            if (result.error) throw result.error;
            return result.data;
        }, 3, 500, 15000, signal);

        return (data || []).map((cat: any) => ({
            id: cat.id as string,
            name: cat.name as string,
            slug: cat.slug as string,
            image: cat.image as string,
            subcategories: (cat.subcategories as any[]) || [],
        }));
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

/**
 * Fetch featured products for the landing page
 */
export async function getFeaturedProducts(signal?: AbortSignal): Promise<{
    newArrivals: Product[];
    bestsellers: Product[];
    onSale: Product[];
}> {
    console.log('[attireService] getFeaturedProducts: STARTING parallel fetch...');

    try {
        const results = await Promise.all([
            getProducts({ badges: ['new'] }, 'newest', 1, 8, signal),
            (async () => {
                await new Promise(r => setTimeout(r, 20));
                return getProducts({ badges: ['bestseller'] }, 'popularity', 1, 8, signal);
            })(),
            (async () => {
                await new Promise(r => setTimeout(r, 40));
                return getProducts({ onSale: true }, 'newest', 1, 8, signal);
            })()
        ]);

        const [newRes, bestRes, saleRes] = results;
        console.log('[attireService] getFeaturedProducts: SUCCESS');

        return {
            newArrivals: newRes.data || [],
            bestsellers: bestRes.data || [],
            onSale: saleRes.data || [],
        };
    } catch (error) {
        console.error('Error in getFeaturedProducts:', error);
        return { newArrivals: [], bestsellers: [], onSale: [] };
    }
}

/**
 * Fetch related products for a given product
 */
export async function getRelatedProducts(productId: string, limit: number = 4, signal?: AbortSignal): Promise<Product[]> {
    const supabase = getSupabaseClient();
    try {
        let q1 = supabase.from('products').select('category').eq('id', productId).single();
        if (signal) q1 = q1.abortSignal(signal);
        const { data: product } = await q1;

        if (!product) return [];

        let q2 = supabase.from('products').select('*').eq('category', product.category).neq('id', productId).limit(limit);
        if (signal) q2 = q2.abortSignal(signal);
        const { data: related } = await q2;

        return (related || []).map((item: any) => ({
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
    } catch (error) {
        console.error('Error in getRelatedProducts:', error);
        return [];
    }
}

/**
 * Create a new order (Cash on Delivery)
 */
export async function createOrder(orderData: Record<string, unknown>): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();
    const items = orderData.items as any[];
    let hasPreorders = false;
    let allPreorders = true;

    try {
        for (const item of items) {
            if (item.isPreorder) {
                hasPreorders = true;
                continue;
            }
            allPreorders = false;

            const { data: product } = await supabase.from('products').select('stock_count, in_stock, name').eq('id', item.productId).single();
            if (!product || !product.in_stock || product.stock_count < item.quantity) {
                console.error(`Insufficient stock for ${item.productId}`);
                return { orderId: '', conversationId: '', success: false };
            }
        }

        const preorderStatus = hasPreorders ? (allPreorders ? 'all' : 'partial') : 'none';
        const { data: order, error: orderError } = await supabase.from('orders').insert({
            user_id: orderData.userId,
            total: orderData.total,
            status: 'pending',
            details: orderData.items,
            shipping_address: orderData.shippingAddress,
            service_type: 'attire',
            promo_code: orderData.promoCode || null,
            discount_amount: orderData.discount || 0,
            has_preorders: hasPreorders,
            preorder_status: preorderStatus,
        }).select().single();

        if (orderError || !order) throw orderError;

        const orderItemsToInsert = items.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            selected_size: item.size,
            selected_color: item.color,
            is_preorder: item.isPreorder || false,
            estimated_delivery_date: item.estimatedDeliveryDate || null,
            preorder_status: item.isPreorder ? 'pending' : null,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
        if (itemsError) {
            await supabase.from('orders').delete().eq('id', order.id);
            throw itemsError;
        }

        if (orderData.promoCode) {
            await supabase.rpc('increment_promo_usage', { p_code: orderData.promoCode }).catch(console.error);
        }

        const firstItemName = items[0]?.productName || items[0]?.product?.name || items[0]?.name || 'Attire Order';
        const displaySubject = items.length > 1 ? `${firstItemName} +${items.length - 1} more` : firstItemName;
        const { data: conversation } = await supabase.from('conversations').insert({
            user_id: orderData.userId,
            order_id: order.id,
            service_type: 'attire',
            subject: displaySubject,
            status: 'open',
        }).select().single();

        if (conversation) {
            const orderTypeMsg = hasPreorders ? (allPreorders ? 'New pre-order' : 'New order with pre-orders') : 'New order';
            await supabase.from('messages').insert({
                conversation_id: conversation.id,
                sender_id: orderData.userId,
                content: `${orderTypeMsg} ID: ${order.id}. I have a question.`,
            });
        }

        return { orderId: order.id, conversationId: conversation?.id || '', success: true };
    } catch (error) {
        console.error('Order creation failed:', error);
        return { orderId: '', conversationId: '', success: false };
    }
}
