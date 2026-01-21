import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

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

    const bookedSlots = (data || []).map(order => order.details?.time).filter(Boolean);

    return NextResponse.json({ bookedSlots });
}
