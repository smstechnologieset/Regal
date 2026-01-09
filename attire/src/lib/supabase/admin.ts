/**
 * Supabase Admin Client
 * 
 * Creates a Supabase client using the service role key.
 * This bypasses RLS - ONLY use in API routes, never expose to client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
    if (adminClient) {
        return adminClient;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
        );
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    return adminClient;
}

// Reset for testing purposes
export function resetAdminClient(): void {
    adminClient = null;
}
