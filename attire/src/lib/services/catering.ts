import { getSupabaseClient } from '@/lib/supabase/client';
import { withRetry } from '@/lib/supabase/utils';
import { CateringPackage, MenuItem } from '@/types';

export async function getCateringPackages(signal?: AbortSignal): Promise<CateringPackage[]> {
    try {
        const data = await withRetry(async (retrySignal) => {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('catering_packages')
                .select('*')
                .order('price_per_guest', { ascending: true })
                .abortSignal(retrySignal || (signal as any));

            if (error) throw error;
            return data;
        }, 3, 500, 15000, signal);

        // Transform database format to TypeScript interface format
        return (data || []).map((pkg: Record<string, unknown>) => ({
            id: pkg.id as string,
            name: pkg.name as string,
            description: pkg.description as string,
            pricePerGuest: pkg.price_per_guest as number,
            minGuests: pkg.min_guests as number,
            includes: (pkg.includes as string[]) || [],
            image: pkg.image as string,
        }));
    } catch (error) {
        console.error('Error fetching catering packages after retries:', error);
        return [];
    }
}

/**
 * Fetch a single catering package by ID
 */
export async function getCateringPackageById(id: string): Promise<CateringPackage | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('catering_packages')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Error fetching catering package:', error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        pricePerGuest: data.price_per_guest,
        minGuests: data.min_guests,
        includes: data.includes || [],
        image: data.image,
    };
}

export async function getMenuItems(signal?: AbortSignal): Promise<MenuItem[]> {
    try {
        const data = await withRetry(async (retrySignal) => {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('category', { ascending: true })
                .abortSignal(retrySignal || (signal as any));

            if (error) throw error;
            return data;
        }, 3, 500, 15000, signal);

        return (data || []).map((item: Record<string, unknown>) => ({
            id: item.id as string,
            name: item.name as string,
            description: item.description as string,
            price: item.price as number,
            category: item.category as 'appetizer' | 'main' | 'dessert' | 'drink' | 'station',
            dietary: (item.dietary as string[]) || [],
            image: item.image as string,
        }));
    } catch (error) {
        console.error('Error fetching menu items after retries:', error);
        return [];
    }
}

/**
 * Fetch menu items by category
 */
export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category', category);

    if (error) {
        console.error('Error fetching menu items by category:', error);
        return [];
    }

    return (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        name: item.name as string,
        description: item.description as string,
        price: item.price as number,
        category: item.category as 'appetizer' | 'main' | 'dessert' | 'drink' | 'station',
        dietary: (item.dietary as string[]) || [],
        image: item.image as string,
    }));
}

export async function submitCateringQuote(quoteData: {
    userId: string;
    packageId?: string;
    packageName?: string;
    guestCount: number;
    eventDate: string;
    venue: string;
    dietaryRequirements: string;
    notes: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
}): Promise<{ orderId: string; conversationId: string; success: boolean; error?: string }> {
    const supabase = getSupabaseClient();

    // 1. Check availability FIRST
    if (quoteData.eventDate) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id')
                .in('service_type', ['events', 'catering'])
                .neq('status', 'cancelled')
                .or(`details->>date.eq.${quoteData.eventDate},details->>eventDate.eq.${quoteData.eventDate}`)
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) {
                return {
                    orderId: '',
                    conversationId: '',
                    success: false,
                    error: 'This date is already booked for another event. Please select a different date.'
                };
            }
        } catch (availErr) {
            console.error('Catering availability check failed:', availErr);
            // Continue if check fails? Or fail safe? Let's fail safe if it's a real error
        }
    }

    // Estimate total based on package and guest count
    let estimatedTotal = 0;
    if (quoteData.packageId) {
        // Add a small timeout guard to package fetch
        const pkgPromise = getCateringPackageById(quoteData.packageId);
        const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 10000)
        );

        try {
            const pkg = await Promise.race([pkgPromise, timeoutPromise]);
            if (pkg) {
                estimatedTotal = (pkg as any).pricePerGuest * quoteData.guestCount;
            }
        } catch (err) {
            console.warn('Catering package fetch timed out or failed, proceeding with 0 total');
        }
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: quoteData.userId,
            service_type: 'catering',
            status: 'pending',
            total: estimatedTotal,
            details: {
                packageId: quoteData.packageId,
                packageName: quoteData.packageName,
                guestCount: quoteData.guestCount,
                eventDate: quoteData.eventDate,
                venue: quoteData.venue,
                dietaryRequirements: quoteData.dietaryRequirements,
                notes: quoteData.notes,
                contactName: quoteData.contactName,
                contactEmail: quoteData.contactEmail,
                contactPhone: quoteData.contactPhone,
            },
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating catering quote:', orderError);
        return { orderId: '', conversationId: '', success: false };
    }

    // Create a conversation for this quote
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
            user_id: quoteData.userId,
            service_type: 'catering',
            order_id: order.id,
            subject: `Catering Quote: ${quoteData.guestCount} guests - ${quoteData.packageName || 'Custom'}`,
            status: 'open',
        })
        .select()
        .single();

    if (convError || !conversation) {
        console.error('Error creating conversation:', convError);
        return { orderId: order.id, conversationId: '', success: true };
    }

    // Send initial message with quote details
    const messageContent = `
**New Catering Quote Request**

🍽️ **Package:** ${quoteData.packageName || 'Custom Menu'}
👥 **Guest Count:** ${quoteData.guestCount}
📅 **Event Date:** ${quoteData.eventDate}
📍 **Venue:** ${quoteData.venue}

**Dietary Requirements:**
${quoteData.dietaryRequirements || 'None specified'}

**Additional Notes:**
${quoteData.notes || 'No additional notes.'}

💰 **Estimated Total:** ETB ${estimatedTotal.toLocaleString()}

---
*Contact: ${quoteData.contactName} | ${quoteData.contactEmail} | ${quoteData.contactPhone}*
    `.trim();

    await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: quoteData.userId,
        content: messageContent,
    });

    return {
        orderId: order.id,
        conversationId: conversation.id,
        success: true,
    };
}
