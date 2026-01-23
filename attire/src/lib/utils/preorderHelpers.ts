/**
 * Pre-Order Utility Functions
 * Helper functions for managing pre-order logic and display
 */

import { Product, CartItem, PreOrderStatus } from '@/types';

/**
 * Check if a product is eligible for pre-order
 * Requirements: 1.1, 1.2
 */
export function isEligibleForPreOrder(product: Product): boolean {
  const eligible = (
    (product.stockCount === 0 || product.stockCount === undefined) &&
    product.allowPreorder === true
  );
  
  // Debug logging
  console.log('Pre-order eligibility check:', {
    productId: product.id,
    productName: product.name,
    stockCount: product.stockCount,
    allowPreorder: product.allowPreorder,
    inStock: product.inStock,
    eligible
  });
  
  return eligible;
}

/**
 * Calculate estimated delivery message from restock date or delivery days
 * Requirements: 1.3, 2.2, 2.3
 */
export function calculateEstimatedDelivery(product: Product): string | null {
  // If we have an estimated restock date, calculate days from now
  if (product.estimatedRestockDate) {
    const restockDate = new Date(product.estimatedRestockDate);
    const now = new Date();
    const diffTime = restockDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Available soon';
    } else if (diffDays === 1) {
      return 'Available in 1 day';
    } else if (diffDays <= 7) {
      return `Available in ${diffDays} days`;
    } else if (diffDays <= 30) {
      const weeks = Math.ceil(diffDays / 7);
      return `Available in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    } else {
      const months = Math.ceil(diffDays / 30);
      return `Available in ${months} ${months === 1 ? 'month' : 'months'}`;
    }
  }

  // Fallback to estimated delivery days if set
  if (product.estimatedDeliveryDays) {
    const days = product.estimatedDeliveryDays;
    if (days === 1) {
      return 'Available in 1 day';
    } else if (days <= 7) {
      return `Available in ${days} days`;
    } else if (days <= 30) {
      const weeks = Math.ceil(days / 7);
      return `Available in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    } else {
      const months = Math.ceil(days / 30);
      return `Available in ${months} ${months === 1 ? 'month' : 'months'}`;
    }
  }

  return null;
}

/**
 * Get estimated delivery date for a pre-order
 * Requirements: 2.2, 2.3
 */
export function getEstimatedDeliveryDate(product: Product): Date | null {
  if (product.estimatedRestockDate) {
    return new Date(product.estimatedRestockDate);
  }

  if (product.estimatedDeliveryDays) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + product.estimatedDeliveryDays);
    return deliveryDate;
  }

  return null;
}

/**
 * Determine pre-order status for a cart or order
 * Requirements: 3.3, 3.4
 */
export function getPreOrderStatus(items: CartItem[]): PreOrderStatus {
  const preOrderItems = items.filter(item => item.isPreorder);
  const regularItems = items.filter(item => !item.isPreorder);

  if (preOrderItems.length === 0) {
    return 'none';
  } else if (regularItems.length === 0) {
    return 'all';
  } else {
    return 'partial';
  }
}

/**
 * Check if cart contains any pre-order items
 */
export function hasPreOrderItems(items: CartItem[]): boolean {
  return items.some(item => item.isPreorder);
}

/**
 * Get all pre-order items from cart
 */
export function getPreOrderItems(items: CartItem[]): CartItem[] {
  return items.filter(item => item.isPreorder);
}

/**
 * Format delivery date for display
 */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get pre-order summary for display
 */
export function getPreOrderSummary(items: CartItem[]) {
  const preOrderItems = getPreOrderItems(items);
  const totalPreOrderItems = preOrderItems.length;
  const hasPreOrders = totalPreOrderItems > 0;
  const preOrderStatus = getPreOrderStatus(items);

  // Find the latest estimated delivery date among pre-order items
  let latestDeliveryDate: Date | null = null;
  for (const item of preOrderItems) {
    const deliveryDate = getEstimatedDeliveryDate(item.product);
    if (deliveryDate) {
      if (!latestDeliveryDate || deliveryDate > latestDeliveryDate) {
        latestDeliveryDate = deliveryDate;
      }
    }
  }

  return {
    totalPreOrderItems,
    estimatedDeliveryDate: latestDeliveryDate ? latestDeliveryDate.toISOString() : undefined,
    hasPreOrders,
    preOrderStatus
  };
}
