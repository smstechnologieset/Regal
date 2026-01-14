export const runtime = "nodejs";

/**
 * Admin Bridal Catalog API (Gowns)
 * 
 * GET /api/admin/catalog/bridal/gowns - List all bridal gowns
 * POST /api/admin/catalog/bridal/gowns - Create new gown
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
            .from('bridal_gowns')
            .select('*')
            .order('name', { ascending: true });

        if (dbError) throw dbError;
        return NextResponse.json({ gowns: data || [] });
    } catch (error: any) {
        console.error('Error fetching bridal gowns:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch gowns' }, { status: 500 });
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
            .from('bridal_gowns')
            .insert(body)
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Gown ID already exists' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ gown: data });
    } catch (error: any) {
        console.error('Error creating bridal gown:', error);
        return NextResponse.json({ error: error.message || 'Failed to create gown' }, { status: 500 });
    }
}
