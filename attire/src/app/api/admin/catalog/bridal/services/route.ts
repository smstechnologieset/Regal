/**
 * Admin Bridal Catalog API (Services)
 * 
 * GET /api/admin/catalog/bridal/services - List all bridal services
 * POST /api/admin/catalog/bridal/services - Create new service
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const supabase = createAdminClient();
        const { data, error: dbError } = await supabase
            .from('bridal_services')
            .select('*')
            .order('title', { ascending: true });

        if (dbError) throw dbError;
        return NextResponse.json({ services: data || [] });
    } catch (error) {
        console.error('Error fetching bridal services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const body = await request.json();
        const supabase = createAdminClient();

        const { data, error: dbError } = await supabase
            .from('bridal_services')
            .insert(body)
            .select()
            .single();

        if (dbError) throw dbError;
        return NextResponse.json({ service: data });
    } catch (error) {
        console.error('Error creating bridal service:', error);
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
