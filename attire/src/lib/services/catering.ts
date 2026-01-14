/**
 * Catering Service API
 * 
 * Handles all catering-related data fetching and quote submissions.
 * Uses the standard public Supabase client for client-side and server-side compatibility.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { CateringPackage, MenuItem } from '@/types';

/**
 * Fetch all catering packages from the database
 */
export async function getCateringPackages(): Promise<CateringPackage[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('catering_packages')
        .select('*')
        .order('price_per_guest', { ascending: true });

    if (error) {
        console.error('Error fetching catering packages:', error);
        return [];
    }

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

/**
 * Fetch all menu items from the database
 */
export async function getMenuItems(): Promise<MenuItem[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

    if (error) {
        console.error('Error fetching menu items:', error);
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

/**
 * Submit a catering quote request (creates order + conversation)
 */
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
}): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    // Estimate total based on package and guest count
    let estimatedTotal = 0;
    if (quoteData.packageId) {
        const pkg = await getCateringPackageById(quoteData.packageId);
        if (pkg) {
            estimatedTotal = pkg.pricePerGuest * quoteData.guestCount;
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

💰 **Estimated Total:** $${estimatedTotal.toLocaleString()}

---
*Contact: ${quoteData.contactName} | ${quoteData.contactEmail}*
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
