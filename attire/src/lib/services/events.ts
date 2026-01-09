/**
 * Events Service API
 * 
 * Handles all event-related data fetching and order submissions.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { EventPackage } from '@/types';

/**
 * Fetch all event packages from the database
 */
export async function getEventPackages(): Promise<EventPackage[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('event_packages')
        .select('*')
        .order('price_start', { ascending: true });

    if (error) {
        console.error('Error fetching event packages:', error);
        return [];
    }

    // Transform database format to TypeScript interface format
    return (data || []).map((pkg: Record<string, unknown>) => ({
        id: pkg.id,
        title: pkg.title,
        description: pkg.description,
        type: pkg.type,
        priceStart: pkg.price_start,
        features: pkg.features || [],
        image: pkg.image,
        capacity: pkg.capacity,
        popular: pkg.popular,
    }));
}

/**
 * Fetch event packages by type
 */
export async function getEventPackagesByType(type: string): Promise<EventPackage[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('event_packages')
        .select('*')
        .eq('type', type)
        .order('price_start', { ascending: true });

    if (error) {
        console.error('Error fetching event packages by type:', error);
        return [];
    }

    return (data || []).map((pkg: Record<string, unknown>) => ({
        id: pkg.id,
        title: pkg.title,
        description: pkg.description,
        type: pkg.type,
        priceStart: pkg.price_start,
        features: pkg.features || [],
        image: pkg.image,
        capacity: pkg.capacity,
        popular: pkg.popular,
    }));
}

/**
 * Fetch a single event package by ID
 */
export async function getEventPackageById(id: string): Promise<EventPackage | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('event_packages')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Error fetching event package:', error);
        return null;
    }

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        priceStart: data.price_start,
        features: data.features || [],
        image: data.image,
        capacity: data.capacity,
        popular: data.popular,
    };
}

/**
 * Submit an event request (creates order + conversation)
 */
export async function submitEventRequest(requestData: {
    userId: string;
    packageId?: string;
    eventType: string;
    guestCount: number;
    budget: number;
    date: string;
    features: string[];
    description: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
}): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    // Calculate estimated total based on budget or package
    const total = requestData.budget || 0;

    // Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: requestData.userId,
            service_type: 'events',
            status: 'pending',
            total: total,
            details: {
                packageId: requestData.packageId,
                eventType: requestData.eventType,
                guestCount: requestData.guestCount,
                budget: requestData.budget,
                date: requestData.date,
                features: requestData.features,
                description: requestData.description,
                contactName: requestData.contactName,
                contactEmail: requestData.contactEmail,
                contactPhone: requestData.contactPhone,
            },
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating event order:', orderError);
        return { orderId: '', conversationId: '', success: false };
    }

    // Create a conversation for this order
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
            user_id: requestData.userId,
            service_type: 'events',
            order_id: order.id,
            subject: `Event Request: ${requestData.eventType} - ${requestData.guestCount} guests`,
            status: 'open',
        })
        .select()
        .single();

    if (convError || !conversation) {
        console.error('Error creating conversation:', convError);
        // Order was created but conversation failed - still return order
        return { orderId: order.id, conversationId: '', success: true };
    }

    // Send initial message with order details
    const messageContent = `
**New Event Request**

📅 **Event Type:** ${requestData.eventType}
👥 **Guest Count:** ${requestData.guestCount}
💰 **Budget:** $${requestData.budget.toLocaleString()}
📆 **Preferred Date:** ${requestData.date || 'Flexible'}

**Selected Services:**
${requestData.features.map(f => `• ${f}`).join('\n')}

**Additional Details:**
${requestData.description || 'No additional details provided.'}

---
*Contact: ${requestData.contactName} | ${requestData.contactEmail} | ${requestData.contactPhone}*
    `.trim();

    await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: requestData.userId,
        content: messageContent,
    });

    return {
        orderId: order.id,
        conversationId: conversation.id,
        success: true,
    };
}
