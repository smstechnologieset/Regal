export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { enforceRateLimit } from '@/lib/rate-limit';

// Lazily create the Supabase admin client inside request handlers,
// never at module level. This prevents Vercel build failures caused by
// missing env vars during the static page-data collection phase.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Find an auth user by email, paginating through all pages so it keeps working
 * past the first 50 users (listUsers only returns a single page by default).
 */
async function findUserByEmail(admin: SupabaseClient, email: string) {
  const perPage = 200;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < perPage) break; // reached the last page
  }
  return null;
}

export async function POST(request: Request) {
  // Rate limit to throttle verification-code brute-forcing.
  const limited = enforceRateLimit(request, 'telegram-verify', 10, 60_000);
  if (limited) return limited;

  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { sessionId, code } = await request.json();

    if (!sessionId || !code) {
      return NextResponse.json(
        { error: 'Session ID and code are required' },
        { status: 400 }
      );
    }

    // 1. Find the auth attempt in the database
    const { data: attempt, error: fetchError } = await supabaseAdmin
      .from('telegram_auth_attempts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !attempt) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // 2. Prepare user identifier (using phone number as a unique point).
    // Generate a fresh random password on every verification. It is handed to
    // the client once to complete signInWithPassword, and is never derived from
    // any secret. For existing users we rotate their password to this value so
    // the just-issued credential is the only one that works.
    const emailIdentifier = `${attempt.phone_number}@telegram.regal`;
    const password = `tg-${randomUUID()}-${randomUUID()}`;

    // 3. Find existing user (paginated) or create a new one.
    let targetUser = await findUserByEmail(supabaseAdmin, emailIdentifier);

    if (!targetUser) {
      // Create new user if not found
      const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: emailIdentifier,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: attempt.full_name,
          phone: attempt.phone_number,
          telegram_id: attempt.telegram_id,
          provider: 'telegram'
        }
      });

      if (signUpError) {
        throw signUpError;
      }
      targetUser = newUser.user;
    } else {
      // Existing user: rotate the password to the freshly generated one so the
      // returned credential is valid exactly once for this login.
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { password }
      );
      if (updateError) {
        throw updateError;
      }
    }

    // 4. Mark attempt as verified
    await supabaseAdmin
      .from('telegram_auth_attempts')
      .delete()
      .eq('id', attempt.id);

    // 5. Generate a link or just provide the credentials for the frontend to sign in
    // Note: In a real production app, you might use a custom token or magic link.
    // For this implementation, we'll return the credentials for the frontend to use signInWithPassword.
    // This is safe because the 'code' was verified and the attempt is deleted.
    
    return NextResponse.json({
      success: true,
      email: emailIdentifier,
      password: password
    });

  } catch (error) {
    console.error('Telegram verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
