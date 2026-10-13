/**
 * Admin Users API
 * 
 * GET /api/admin/users - List all users with emails and ban status
 * POST /api/admin/users - Create new user
 * PATCH /api/admin/users - Update user role or ban/unban status
 * DELETE /api/admin/users - Delete user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const supabase = createAdminClient();

        // 1. Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, phone, role, created_at, avatar_url')
            .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // 2. Fetch auth users to get emails and banned_until status
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
            perPage: 1000
        });

        const authMap = new Map();
        if (!authError && authData?.users) {
            authData.users.forEach((u: any) => {
                const isBanned = Boolean(u.banned_until && new Date(u.banned_until) > new Date());
                authMap.set(u.id, {
                    email: u.email,
                    isBanned,
                    banned_until: u.banned_until
                });
            });
        }

        const mergedUsers = (profiles || []).map(p => {
            const authInfo = authMap.get(p.id) || {};
            return {
                ...p,
                email: authInfo.email || null,
                isBanned: authInfo.isBanned || false,
                banned_until: authInfo.banned_until || null
            };
        });

        return NextResponse.json({ users: mergedUsers });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const body = await request.json();
        const { email, password, full_name, phone, role = 'user' } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // 1. Create auth user
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, phone }
        });

        if (createError) throw createError;
        if (!authUser?.user) throw new Error('User creation failed');

        const newUserId = authUser.user.id;

        // 2. Ensure profile exists and set role
        await supabase
            .from('profiles')
            .upsert({
                id: newUserId,
                full_name: full_name || email.split('@')[0],
                phone: phone || null,
                role: role === 'admin' ? 'admin' : 'user',
                updated_at: new Date().toISOString()
            });

        return NextResponse.json({
            success: true,
            user: {
                id: newUserId,
                email: authUser.user.email,
                full_name: full_name || null,
                phone: phone || null,
                role
            }
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const body = await request.json();
        const { targetUserId, role, isBanned } = body;

        if (!targetUserId) {
            return NextResponse.json(
                { error: 'Missing required field: targetUserId' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // 1. Ban/unban action
        if (typeof isBanned === 'boolean') {
            if (targetUserId === userId) {
                return NextResponse.json(
                    { error: 'Cannot ban your own account' },
                    { status: 400 }
                );
            }

            const { error: banError } = await supabase.auth.admin.updateUserById(targetUserId, {
                ban_duration: isBanned ? '876000h' : 'none'
            });

            if (banError) throw banError;

            return NextResponse.json({ success: true, isBanned });
        }

        // 2. Role update action
        if (role) {
            if (!['user', 'admin'].includes(role)) {
                return NextResponse.json(
                    { error: 'Invalid role. Must be "user" or "admin"' },
                    { status: 400 }
                );
            }

            if (targetUserId === userId && role === 'user') {
                return NextResponse.json(
                    { error: 'Cannot remove your own admin privileges' },
                    { status: 400 }
                );
            }

            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', targetUserId)
                .select()
                .single();

            if (updateError) throw updateError;

            return NextResponse.json({ success: true, user: data });
        }

        return NextResponse.json({ error: 'No valid update operation provided' }, { status: 400 });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    const { isAdmin, userId, error } = await verifyAdmin();
    if (!userId) return unauthorizedResponse(error);
    if (!isAdmin) return forbiddenResponse(error);

    try {
        const body = await request.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json(
                { error: 'Missing required field: targetUserId' },
                { status: 400 }
            );
        }

        if (targetUserId === userId) {
            return NextResponse.json(
                { error: 'Cannot delete your own admin account' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Delete from auth.users (cascades to profiles)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
        if (deleteError) {
            // If auth delete fails, try deleting profile directly
            await supabase.from('profiles').delete().eq('id', targetUserId);
        }

        return NextResponse.json({ success: true, deletedUserId: targetUserId });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500 }
        );
    }
}
