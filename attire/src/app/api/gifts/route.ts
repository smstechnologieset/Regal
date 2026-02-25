export const runtime = "nodejs";

/**
 * Public Gift Packages API
 * 
 * GET /api/gifts - List all gift packages for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const { data, error: dbError } = await supabase
            .from('gift_packages')
            .select('*')
            .order('name', { ascending: true });

        if (dbError) throw dbError;
        
        return NextResponse.json({ 
            success: true,
            packages: data || [] 
        });
    } catch (error: any) {
        console.error('Error fetching public gift packages:', error);
        return NextResponse.json(
            { error: 'Failed to load gift packages' }, 
            { status: 500 }
        );
    }
}
