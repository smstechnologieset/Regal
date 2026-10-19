export const runtime = "nodejs";

/**
 * Admin Services Status API
 *
 * GET /api/admin/services/status - Get current service status
 * POST /api/admin/services/status - Update service status (single or full map)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_SERVICES_CONFIG } from '@/lib/constants/services';

export async function GET(request: NextRequest) {
  const { isAdmin, userId, error } = await verifyAdmin();
  if (!userId) return unauthorizedResponse(error);
  if (!isAdmin) return forbiddenResponse(error);

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'services_status')
      .maybeSingle();

    const services = { ...DEFAULT_SERVICES_CONFIG, ...(data?.value || {}) };
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching admin services status:', error);
    return NextResponse.json({ services: DEFAULT_SERVICES_CONFIG });
  }
}

export async function POST(request: NextRequest) {
  const { isAdmin, userId, error } = await verifyAdmin();
  if (!userId) return unauthorizedResponse(error);
  if (!isAdmin) return forbiddenResponse(error);

  try {
    const body = await request.json();
    const { serviceId, enabled, fullConfig } = body;

    const supabase = createAdminClient();

    // Fetch existing settings
    const { data: existing } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'services_status')
      .maybeSingle();

    let updatedValue: Record<string, boolean>;

    if (fullConfig && typeof fullConfig === 'object') {
      updatedValue = { ...DEFAULT_SERVICES_CONFIG, ...fullConfig };
    } else if (serviceId && typeof enabled === 'boolean') {
      updatedValue = { ...DEFAULT_SERVICES_CONFIG, ...(existing?.value || {}), [serviceId]: enabled };
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Try upserting into site_settings
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({
        key: 'services_status',
        value: updatedValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (upsertError) {
      console.warn('site_settings upsert warning (table might need creation):', upsertError);
    }

    return NextResponse.json({ success: true, services: updatedValue });
  } catch (error) {
    console.error('Error updating service status:', error);
    return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 });
  }
}
