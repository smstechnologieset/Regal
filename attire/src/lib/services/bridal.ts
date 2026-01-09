/**
 * Bridal Service API
 * 
 * Handles all bridal-related data fetching and appointment bookings.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { BridalGown, BridalService } from '@/types';

/**
 * Fetch all bridal gowns from the database
 */
export async function getBridalGowns(): Promise<BridalGown[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('bridal_gowns')
        .select('*')
        .order('is_new', { ascending: false });

    if (error) {
        console.error('Error fetching bridal gowns:', error);
        return [];
    }

    // Transform database format to TypeScript interface format
    return (data || []).map((gown: Record<string, unknown>) => ({
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
    }));
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
        console.error('Error fetching bridal gown:', error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        designer: data.designer,
        style: data.style,
        silhouette: data.silhouette,
        priceRent: data.price_rent,
        priceBuy: data.price_buy,
        sizes: data.sizes || [],
        images: data.images || [],
        description: data.description,
        isNew: data.is_new,
    };
}

/**
 * Fetch all bridal services from the database
 */
export async function getBridalServices(): Promise<BridalService[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('bridal_services')
        .select('*')
        .order('price_start', { ascending: true });

    if (error) {
        console.error('Error fetching bridal services:', error);
        return [];
    }

    return (data || []).map((service: Record<string, unknown>) => ({
        id: service.id,
        title: service.title,
        description: service.description,
        priceStart: service.price_start,
        duration: service.duration,
        type: service.type,
        image: service.image,
    }));
}

/**
 * Book a bridal appointment (creates order + conversation)
 */
export async function bookBridalAppointment(appointmentData: {
    userId: string;
    serviceId: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    notes: string;
}): Promise<{ orderId: string; conversationId: string; success: boolean }> {
    const supabase = getSupabaseClient();

    // Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: appointmentData.userId,
            service_type: 'bridal',
            status: 'pending',
            total: 0, // Will be updated after consultation
            details: {
                serviceId: appointmentData.serviceId,
                serviceName: appointmentData.serviceName,
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                contactName: appointmentData.contactName,
                contactEmail: appointmentData.contactEmail,
                contactPhone: appointmentData.contactPhone,
                notes: appointmentData.notes,
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
            user_id: appointmentData.userId,
            service_type: 'bridal',
            order_id: order.id,
            subject: `Bridal Appointment: ${appointmentData.serviceName}`,
            status: 'open',
        })
        .select()
        .single();

    if (convError || !conversation) {
        console.error('Error creating conversation:', convError);
        return { orderId: order.id, conversationId: '', success: true };
    }

    // Send initial message with appointment details
    const messageContent = `
**New Bridal Appointment Booking**

💍 **Service:** ${appointmentData.serviceName}
📅 **Date:** ${new Date(appointmentData.appointmentDate).toLocaleDateString()}
🕐 **Time:** ${appointmentData.appointmentTime}

**Special Requests:**
${appointmentData.notes || 'No special requests.'}

---
*Contact: ${appointmentData.contactName} | ${appointmentData.contactEmail} | ${appointmentData.contactPhone}*
    `.trim();

    await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: appointmentData.userId,
        content: messageContent,
    });

    return {
        orderId: order.id,
        conversationId: conversation.id,
        success: true,
    };
}
