export const runtime = "nodejs";

/**
 * OAuth Callback Route
 * 
 * Handles OAuth redirects from providers like Google.
 * Exchanges authorization code for session and redirects to appropriate page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/account';
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
        console.error('OAuth error:', error, error_description);
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(error_description || 'Authentication failed')}`, request.url)
        );
    }

    // Exchange code for session
    if (code) {
        try {
            const supabase = await createClient();
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                console.error('Code exchange error:', exchangeError);
                return NextResponse.redirect(
                    new URL(`/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`, request.url)
                );
            }

            // Success - redirect to next page
            return NextResponse.redirect(new URL(next, request.url));
        } catch (error) {
            console.error('Unexpected error during code exchange:', error);
            return NextResponse.redirect(
                new URL('/login?error=An unexpected error occurred', request.url)
            );
        }
    }

    // No code provided - redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
}
