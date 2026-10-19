export const runtime = "nodejs";

/**
 * Public Services Status API
 *
 * GET /api/services/status
 * Returns the active/disabled status for all Regal services.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SERVICES_CONFIG } from '@/lib/constants/services';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ services: DEFAULT_SERVICES_CONFIG });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'services_status')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ services: DEFAULT_SERVICES_CONFIG });
    }

    const merged = { ...DEFAULT_SERVICES_CONFIG, ...(data.value || {}) };
    return NextResponse.json({ services: merged });
  } catch (error) {
    console.warn('[api/services/status] Fallback to default services config:', error);
    return NextResponse.json({ services: DEFAULT_SERVICES_CONFIG });
  }
}
