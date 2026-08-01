export const runtime = "nodejs";

/**
 * Admin Bridal Catalog API (Accessories)
 * 
 * GET /api/admin/catalog/bridal/accessories - List all bridal accessories
 * POST /api/admin/catalog/bridal/accessories - Create new accessory
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { pick, ALLOWED_FIELDS } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const supabase = createAdminClient();
        const { data, error: dbError } = await supabase
            .from('bridal_accessories')
            .select('*')
            .order('name', { ascending: true });

        if (dbError) throw dbError;
        return NextResponse.json({ accessories: data || [] });
    } catch (error: any) {
        console.error('Error fetching bridal accessories:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch accessories' }, { status: 500 });
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
            .from('bridal_accessories')
            .insert(pick(body, ALLOWED_FIELDS.bridalAccessory))
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Accessory ID already exists' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ accessory: data });
    } catch (error: any) {
        console.error('Error creating bridal accessory:', error);
        return NextResponse.json({ error: error.message || 'Failed to create accessory' }, { status: 500 });
    }
}
