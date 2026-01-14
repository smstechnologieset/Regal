/**
 * Admin Users API
 * 
 * GET /api/admin/users - List all users
 * PATCH /api/admin/users - Update user role
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    // Verify admin access
    const { isAdmin, userId, error } = await verifyAdmin();
    
    if (!userId) {
        return unauthorizedResponse(error);
    }
    
    if (!isAdmin) {
        return forbiddenResponse(error);
    }

    try {
        const supabase = createAdminClient();

        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, phone, role, created_at, avatar_url')
            .order('created_at', { ascending: false });

        if (usersError) {
            throw usersError;
        }

        return NextResponse.json({ users: users || [] });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    // Verify admin access
    const { isAdmin, userId, error } = await verifyAdmin();
    
    if (!userId) {
        return unauthorizedResponse(error);
    }
    
    if (!isAdmin) {
        return forbiddenResponse(error);
    }

    try {
        const body = await request.json();
        const { targetUserId, role } = body;

        if (!targetUserId || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: targetUserId, role' },
                { status: 400 }
            );
        }

        if (!['user', 'admin'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be "user" or "admin"' },
                { status: 400 }
            );
        }

        // Prevent admin from removing their own admin status
        if (targetUserId === userId && role === 'user') {
            return NextResponse.json(
                { error: 'Cannot remove your own admin privileges' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', targetUserId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ user: data });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}
