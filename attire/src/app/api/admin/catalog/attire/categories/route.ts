/**
 * Admin Attire Catalog API (Categories)
 * 
 * GET /api/admin/catalog/attire/categories - List all categories
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
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (dbError) throw dbError;
        return NextResponse.json({ categories: data || [] });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
