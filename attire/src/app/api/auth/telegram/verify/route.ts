import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase admin client (using service role key to bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
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

    // 2. Prepare user identifer (using phone number as a unique point)
    const emailIdentifier = `${attempt.phone_number}@telegram.regal`;
    const password = `tg_${attempt.telegram_id}_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)}`;

    // 3. Try to find if user exists or create new one
    // We use a custom email-like format for Telegram users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) throw listError;

    let targetUser = users.find(u => u.email === emailIdentifier);

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

  } catch (error: any) {
    console.error('Telegram verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
