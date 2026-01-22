/**
 * Orders Service
 * 
 * Functions for fetching and managing user orders.
 */

import { getSupabaseClient } from '@/lib/supabase/client';

export interface UserOrder {
  id: string;
  service_type: 'attire' | 'events' | 'bridal' | 'catering';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total: number;
  created_at: string;
  details: Record<string, unknown>;
}

/**
 * Fetch recent orders for the authenticated user
 * @param limit - Maximum number of orders to fetch (default: 5)
 * @returns Array of user orders
 */
export async function getUserOrders(limit: number = 5): Promise<UserOrder[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('orders')
    .select('id, service_type, status, total, created_at, details')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user orders:', error);
    throw new Error('Failed to fetch orders');
  }

  return data || [];
}
