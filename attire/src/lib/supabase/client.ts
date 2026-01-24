/**
 * Supabase Browser Client
 * 
 * Creates a Supabase client for use in browser components.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    console.log('[SupabaseClient] Creating new browser client...');
    const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Instrument session events
    client.auth.onAuthStateChange((event, session) => {
        console.log(`[SupabaseClient] Auth Event: ${event}`, {
            hasSession: !!session,
            user: session?.user?.email
        });
    });

    return client;
}

// Singleton instance for convenience
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
    if (!browserClient) {
        browserClient = createClient();
    }
    return browserClient;
}
