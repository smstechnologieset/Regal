/**
 * Bridal Service API
 * 
 * Handles all bridal-related data fetching and service management.
 * Uses the standard public Supabase client for client-side and server-side compatibility.
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
        .select('*');

    if (error) {
        console.error('Error fetching bridal gowns:', error);
        return [];
    }

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
        id: service.id as string,
        title: service.title as string,
        description: service.description as string,
        priceStart: service.price_start as number,
        duration: service.duration as string,
        type: service.type as 'makeup' | 'hair' | 'full-styling' | 'fitting',
        image: service.image as string,
    }));
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
