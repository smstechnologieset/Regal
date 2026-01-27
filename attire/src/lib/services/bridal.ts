import { getSupabaseClient } from '@/lib/supabase/client';
import { withRetry } from '@/lib/supabase/utils';
import { BridalGown, BridalService } from '@/types';

export async function getBridalGowns(signal?: AbortSignal): Promise<BridalGown[]> {
    try {
        const data = await withRetry(async (retrySignal) => {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('bridal_gowns')
                .select('*')
                .abortSignal(retrySignal || (signal as any));

            if (error) throw error;
            return data;
        }, 3, 500, 15000, signal);

        // Transform database format to TypeScript interface format
        return (data || []).map((gown: Record<string, unknown>) => ({
            id: gown.id as string,
            name: gown.name as string,
            designer: gown.designer as string,
            style: gown.style as string,
            silhouette: gown.silhouette as string,
            priceRent: gown.price_rent as number,
            priceBuy: gown.price_buy as number,
            sizes: (gown.sizes as string[]) || [],
            images: (gown.images as string[]) || [],
            description: gown.description as string,
            isNew: gown.is_new as boolean,
        }));
    } catch (error) {
        console.error('Error fetching bridal gowns after retries:', error);
        return [];
    }
}

export async function getBridalServices(signal?: AbortSignal): Promise<BridalService[]> {
    try {
        const data = await withRetry(async (retrySignal) => {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('bridal_services')
                .select('*')
                .order('price_start', { ascending: true })
                .abortSignal(retrySignal || (signal as any));

            if (error) throw error;
            return data;
        }, 3, 500, 15000, signal);

        return (data || []).map((service: Record<string, unknown>) => ({
            id: service.id as string,
            title: service.title as string,
            description: service.description as string,
            priceStart: service.price_start as number,
            duration: service.duration as string,
            type: service.type as 'makeup' | 'hair' | 'full-styling' | 'fitting',
            image: service.image as string,
        }));
    } catch (error) {
        console.error('Error fetching bridal services after retries:', error);
        return [];
    }
}

/**
 * Book a bridal appointment (creates order + conversation)
 */
export async function bookBridalAppointment(bookingData: {
    userId: string;
    serviceId: string;
    serviceTitle: string;
    appointmentDate: string;
    appointmentTime: string;
    notes: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
}): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    // Check for double booking using the API (which uses admin privileges)
    try {
        const checkRes = await fetch(`${window.location.origin}/api/bridal/appointments/booked-slots?date=${bookingData.appointmentDate}`);
        const { bookedSlots } = await checkRes.json();

        if (bookedSlots && bookedSlots.includes(bookingData.appointmentTime)) {
            console.warn('Double booking attempted for:', bookingData.appointmentDate, bookingData.appointmentTime);
            return { orderId: '', conversationId: '', success: false };
        }
    } catch (apiError) {
        console.error('Error checking availability via API:', apiError);
        // Continue if API fails? Or block? Let's block for safety.
        return { orderId: '', conversationId: '', success: false };
    }

    // Create the order entry
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: bookingData.userId,
            service_type: 'bridal',
            status: 'pending',
            total: 0, // Appointments might have fees, but initially 0
            details: {
                serviceId: bookingData.serviceId,
                serviceTitle: bookingData.serviceTitle,
                date: bookingData.appointmentDate,
                time: bookingData.appointmentTime,
                notes: bookingData.notes,
                contactName: bookingData.contactName,
                contactEmail: bookingData.contactEmail,
                contactPhone: bookingData.contactPhone,
            },
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating bridal appointment:', orderError);
        return { orderId: '', conversationId: '', success: false };
    }

    // Create a conversation for this appointment
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
            user_id: bookingData.userId,
            service_type: 'bridal',
            order_id: order.id,
            subject: `Bridal Appointment: ${bookingData.serviceTitle} - ${bookingData.appointmentDate}`,
            status: 'open',
        })
        .select()
        .single();

    if (convError || !conversation) {
        console.error('Error creating conversation:', convError);
        // Order was created but conversation failed - still return order
        return { orderId: order.id, conversationId: '', success: true };
    }

    // Send initial message with booking details
    const messageContent = `
**New Bridal Appointment Booking**

👰 **Service:** ${bookingData.serviceTitle}
📅 **Date:** ${bookingData.appointmentDate}
🕒 **Time:** ${bookingData.appointmentTime}

**Notes:**
${bookingData.notes || 'No additional notes provided.'}

---
*Contact: ${bookingData.contactName} | ${bookingData.contactEmail} | ${bookingData.contactPhone}*
    `.trim();

    await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: bookingData.userId,
        content: messageContent,
    });

    return {
        orderId: order.id,
        conversationId: conversation.id,
        success: true,
    };
}

/**
 * Fetch a single bridal gown by ID
 */
export async function getBridalGownById(id: string): Promise<BridalGown | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('bridal_gowns')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching bridal gown:', error);
        }
        return null;
    }

    const gown = data as any;
    return {
        id: gown.id,
        name: gown.name,
        designer: gown.designer,
        style: gown.style,
        silhouette: gown.silhouette,
        priceRent: gown.price_rent,
        priceBuy: gown.price_buy,
        sizes: gown.sizes || [],
        images: gown.images || [],
        description: gown.description,
        isNew: gown.is_new,
    };
}

/**
 * Fetch a single bridal accessory by ID
 */
export async function getBridalAccessoryById(id: string): Promise<import('@/types').BridalAccessory | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('bridal_accessories')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching bridal accessory:', error);
        }
        return null;
    }

    const item = data as any;
    return {
        id: item.id,
        name: item.name,
        category: item.category,
        priceRent: item.price_rent,
        priceBuy: item.price_buy,
        images: item.images || [],
        description: item.description,
        isNew: item.is_new,
    };
}

/**
 * Submit a bridal transaction (Rent or Buy for Gown or Accessory)
 */
export async function submitBridalTransaction(orderData: {
    userId: string;
    itemId: string;
    itemName: string;
    itemType: 'gown' | 'accessory';
    transactionType: 'rent' | 'buy';
    price: number;
    appointmentDate?: string;
    notes: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
}): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    // 1. If renting, check for daily booking availability
    if (orderData.transactionType === 'rent' && orderData.appointmentDate) {
        try {
            const checkRes = await fetch(`${window.location.origin}/api/bridal/appointments/booked-slots?date=${orderData.appointmentDate}&itemId=${orderData.itemId}`);
            const { isBooked } = await checkRes.json();

            if (isBooked) {
                return { orderId: '', conversationId: '', success: false };
            }
        } catch (apiError) {
            console.error('Error checking availability:', apiError);
            return { orderId: '', conversationId: '', success: false };
        }
    }

    // 2. Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: orderData.userId,
            service_type: 'bridal',
            status: 'pending',
            total: orderData.price,
            details: {
                itemId: orderData.itemId,
                itemName: orderData.itemName,
                itemType: orderData.itemType,
                type: orderData.transactionType, // 'rent' or 'buy'
                date: orderData.appointmentDate || null,
                notes: orderData.notes,
                contactName: orderData.contactName,
                contactEmail: orderData.contactEmail,
                contactPhone: orderData.contactPhone,
            },
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating bridal order:', orderError);
        return { orderId: '', conversationId: '', success: false };
    }

    // 3. Create a conversation
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
            user_id: orderData.userId,
            service_type: 'bridal',
            order_id: order.id,
            subject: `${orderData.itemType === 'gown' ? 'Gown' : 'Accessory'} ${orderData.transactionType.toUpperCase()}: ${orderData.itemName}`,
            status: 'open',
        })
        .select()
        .single();

    if (convError || !conversation) {
        return { orderId: order.id, conversationId: '', success: true };
    }

    // 4. Send initial detailed message
    const displayItemType = orderData.itemType === 'gown' ? 'Gown' : 'Accessory';
    const displayOrderType = orderData.transactionType === 'rent' ? 'Rental Request' : 'Purchase Request';

    const messageContent = `
**New Bridal ${displayItemType} ${displayOrderType}**

✨ **Item:** ${orderData.itemName}
💰 **Total:** $${orderData.price}
${orderData.transactionType === 'rent' ? `
📅 **Rental Date:** ${orderData.appointmentDate}
` : '📦 **Action:** Direct Purchase'}

**Special Notes:**
${orderData.notes || 'None'}

---
*Customer: ${orderData.contactName} (${orderData.contactEmail})*
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

export async function getBridalAccessories(signal?: AbortSignal): Promise<import('@/types').BridalAccessory[]> {
    try {
        const data = await withRetry(async (retrySignal) => {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('bridal_accessories')
                .select('*')
                .order('name', { ascending: true })
                .abortSignal(retrySignal || (signal as any));

            if (error) throw error;
            return data;
        }, 3, 500, 15000, signal);

        return (data || []).map((item: Record<string, unknown>) => ({
            id: item.id as string,
            name: item.name as string,
            category: item.category as 'veil' | 'jewelry' | 'headpiece' | 'shoes' | 'clutch',
            priceRent: item.price_rent as number,
            priceBuy: item.price_buy as number,
            images: (item.images as string[]) || [],
            description: item.description as string,
            isNew: item.is_new as boolean,
        }));
    } catch (error) {
        console.error('Error fetching bridal accessories after retries:', error);
        return [];
    }
}
