import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const itemId = searchParams.get('itemId');

    if (!date) {
        return NextResponse.json({ bookedSlots: [] });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('orders')
        .select('details')
        .eq('service_type', 'bridal')
        .neq('status', 'cancelled')
        .contains('details', { date });

    if (error) {
        console.error('Error fetching booked slots:', error);
        return NextResponse.json({ error: 'Failed to fetch booked slots' }, { status: 500 });
    }

    // Filter by itemId if provided (handles both old serviceId and new itemId keys)
    const matches = (data || [])
        .filter(order => {
            if (!itemId) return true; // If no itemId requested, return all slots for that date
            const d = order.details;
            return d.itemId === itemId || d.serviceId === itemId;
        });

    const bookedSlots = matches.map(order => order.details?.time).filter(Boolean);

    return NextResponse.json({
        bookedSlots,
        isBooked: matches.length > 0 // For daily rental: if any booking exists for this item on this date
    });
}
