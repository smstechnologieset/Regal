export const runtime = "nodejs";

/**
 * Admin Catering Catalog API (Packages)
 * 
 * GET /api/admin/catalog/catering/packages - List catering packages
 * POST /api/admin/catalog/catering/packages - Create catering package
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
            .from('catering_packages')
            .select('*')
            .order('name', { ascending: true });

        if (dbError) throw dbError;
        return NextResponse.json({ packages: data || [] });
    } catch (error: any) {
        console.error('Error fetching catering packages:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch packages' }, { status: 500 });
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
            .from('catering_packages')
            .insert(pick(body, ALLOWED_FIELDS.cateringPackage))
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Package ID already exists' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ package: data });
    } catch (error: any) {
        console.error('Error creating catering package:', error);
        return NextResponse.json({ error: error.message || 'Failed to create package' }, { status: 500 });
    }
}
