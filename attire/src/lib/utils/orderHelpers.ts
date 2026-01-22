/**
 * Order Helper Utilities
 * 
 * Helper functions for formatting and displaying order data.
 */

/**
 * Format service type for display
 * @param serviceType - The service type from the database
 * @returns Capitalized service type
 */
export function formatServiceType(serviceType: string): string {
  return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
}

/**
 * Format order date for display
 * @param dateString - ISO date string from the database
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get order summary from order details
 * @param details - Order details object
 * @returns Summary string (e.g., "Product Name +2 more")
 */
export function getOrderSummary(details: Record<string, unknown>): string {
  // Check if details is actually an array (the items directly)
  let items: any[];
  
  if (Array.isArray(details)) {
    items = details;
  } else if (details.items && Array.isArray(details.items)) {
    items = details.items as any[];
  } else {
    console.log('No items found in details:', details);
    return 'Order';
  }
  
  if (items.length === 0) {
    return 'Order';
  }

  const firstItem = items[0];
  // Try multiple possible field names for the product name
  const itemName = firstItem.productName || firstItem.product?.name || firstItem.name || 'Item';

  if (items.length > 1) {
    return `${itemName} +${items.length - 1} more`;
  }

  return itemName;
}
