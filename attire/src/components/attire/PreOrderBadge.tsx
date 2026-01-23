import { Product } from "@/types";
import {
  calculateEstimatedDelivery,
  formatDeliveryDate,
  getEstimatedDeliveryDate,
} from "@/lib/utils/preorderHelpers";

interface PreOrderBadgeProps {
  product: Product;
  variant?: "compact" | "detailed";
  className?: string;
}

/**
 * PreOrderBadge Component
 * Visual badge indicating pre-order status with estimated delivery
 * Requirements: 2.1, 2.2, 2.3
 */
export default function PreOrderBadge({
  product,
  variant = "compact",
  className = "",
}: PreOrderBadgeProps) {
  const estimatedDelivery = calculateEstimatedDelivery(product);
  const deliveryDate = getEstimatedDeliveryDate(product);

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ${className}`}
      >
        Pre-Order
      </span>
    );
  }

  // Detailed variant
  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-start gap-2">
        <svg
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">Pre-Order Item</p>
          {estimatedDelivery && (
            <p className="text-sm text-amber-700 mt-1">{estimatedDelivery}</p>
          )}
          {deliveryDate && (
            <p className="text-xs text-amber-600 mt-1">
              Estimated delivery: {formatDeliveryDate(deliveryDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
