export const runtime = 'nodejs';

/**
 * POST /api/newsletter — subscribe an email to the newsletter.
 * Public, rate-limited, and idempotent (duplicate emails are treated as success).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'newsletter', 5, 60_000);
  if (limited) return limited;

  try {
    const { email } = await request.json();

    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalized });

    // Unique violation => already subscribed; treat as success.
    if (error && error.code !== '23505') {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Could not subscribe right now. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter route error:', error);
    return NextResponse.json({ error: 'Could not subscribe right now. Please try again.' }, { status: 500 });
  }
}
