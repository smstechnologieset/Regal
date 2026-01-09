/**
 * Admin Authorization Utility
 * 
 * Verifies that the request is from an authenticated admin user.
 * Uses cookies to get the session, then checks role via service role client.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

interface AdminVerification {
    isAdmin: boolean;
    userId: string | null;
    error?: string;
}

/**
 * Verify if the current request is from an authenticated admin user.
 * 
 * @returns Object containing isAdmin status, userId, and optional error
 */
export async function verifyAdmin(): Promise<AdminVerification> {
    try {
        const cookieStore = await cookies();
        
        // Create a server client to get the current session
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll() {
                        // Read-only for verification
                    },
                },
            }
        );

        // Get the current user session
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                isAdmin: false,
                userId: null,
                error: 'Not authenticated',
            };
        }

        // Use admin client to check the user's role (bypasses RLS)
        const adminClient = createAdminClient();
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return {
                isAdmin: false,
                userId: user.id,
                error: 'Profile not found',
            };
        }

        return {
            isAdmin: profile.role === 'admin',
            userId: user.id,
            error: profile.role !== 'admin' ? 'Insufficient permissions' : undefined,
        };
    } catch (error) {
        console.error('Admin verification error:', error);
        return {
            isAdmin: false,
            userId: null,
            error: 'Verification failed',
        };
    }
}

/**
 * Helper to create a standardized unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
    return Response.json(
        { error: message },
        { status: 401 }
    );
}

/**
 * Helper to create a standardized forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): Response {
    return Response.json(
        { error: message },
        { status: 403 }
    );
}
