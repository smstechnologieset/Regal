export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const body = await request.json();
        const { id, name, slug, image, subcategories } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createAdminClient();
        
        // Use provided id (e.g. from existing system) or generate a fresh UUID for consistency
        const categoryId = id || crypto.randomUUID();

        const { data, error: dbError } = await supabase
            .from('categories')
            .insert([{ id: categoryId, name, slug, image, subcategories: subcategories || [] }])
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Category ID or Slug already exists' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ category: data });
    } catch (error: any) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const body = await request.json();
        const { id, name, slug, image, subcategories } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing category ID' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { data, error: dbError } = await supabase
            .from('categories')
            .update({ name, slug, image, subcategories })
            .eq('id', id)
            .select()
            .single();

        if (dbError) {
            if (dbError.code === '23505') {
                return NextResponse.json({ error: 'Slug already exists on another category' }, { status: 400 });
            }
            throw dbError;
        }
        return NextResponse.json({ category: data });
    } catch (error: any) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing category ID' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error: dbError } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
