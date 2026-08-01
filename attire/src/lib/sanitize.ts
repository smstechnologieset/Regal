/**
 * Input sanitization helpers for admin write routes.
 *
 * These routes run under the service-role client (RLS bypassed), so raw request
 * bodies must never be passed straight into `.insert()/.update()`. `pick()`
 * whitelists columns per entity to prevent mass assignment (e.g. overwriting
 * `id`, `created_at`, `usage_count`, ownership columns, etc.).
 */

export function pick<T extends Record<string, unknown>>(
  body: T,
  allowed: readonly string[]
): Partial<T> {
  const out: Partial<T> = {};
  if (!body || typeof body !== 'object') return out;
  for (const key of allowed) {
    if (key in body && (body as Record<string, unknown>)[key] !== undefined) {
      (out as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
    }
  }
  return out;
}

// Allowed writable columns per catalog entity (id/timestamps/derived counters
// are intentionally excluded from updates unless explicitly listed).
export const ALLOWED_FIELDS = {
  product: [
    'id', 'name', 'description', 'price', 'original_price', 'category', 'subcategory',
    'sizes', 'colors', 'images', 'badges', 'rating', 'review_count', 'popularity',
    'in_stock', 'stock_count', 'estimated_restock_date', 'allow_preorder',
    'estimated_delivery_days',
  ],
  category: ['id', 'name', 'slug', 'image', 'subcategories'],
  eventPackage: ['id', 'title', 'description', 'type', 'price_start', 'features', 'image', 'capacity', 'popular'],
  giftPackage: ['id', 'name', 'description', 'price', 'category', 'contents', 'image'],
  bridalGown: ['id', 'name', 'designer', 'style', 'silhouette', 'price_rent', 'price_buy', 'sizes', 'images', 'description', 'is_new'],
  bridalService: ['id', 'title', 'description', 'price_start', 'duration', 'type', 'image'],
  bridalAccessory: ['id', 'name', 'category', 'price_rent', 'price_buy', 'images', 'description', 'is_new'],
  cateringPackage: ['id', 'name', 'description', 'price_per_guest', 'min_guests', 'includes', 'image'],
  menuItem: ['id', 'name', 'description', 'price', 'category', 'dietary', 'image'],
  promoCode: [
    'code', 'discount_type', 'discount_value', 'min_purchase', 'usage_limit',
    'start_date', 'end_date', 'is_active',
  ],
} as const;
