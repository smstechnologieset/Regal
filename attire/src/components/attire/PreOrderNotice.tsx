import { CartItem } from "@/types";
import {
  getPreOrderItems,
  getPreOrderStatus,
  formatDeliveryDate,
  getEstimatedDeliveryDate,
} from "@/lib/utils/preorderHelpers";

interface PreOrderNoticeProps {
  items: CartItem[];
  className?: string;
}

/**
 * PreOrderNotice Component
 * Displays pre-order terms, conditions, and delivery estimates
 * Requirements: 3.1, 3.2
 */
export default function PreOrderNotice({
  items,
  className = "",
}: PreOrderNoticeProps) {
  const preOrderItems = getPreOrderItems(items);
  const preOrderStatus = getPreOrderStatus(items);

  if (preOrderItems.length === 0) {
    return null;
  }

  const isMixedOrder = preOrderStatus === "partial";

  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <div className="flex-1">
          <h3 className="text-base font-semibold text-amber-900 mb-2">
            {isMixedOrder
              ? "Your Order Contains Pre-Order Items"
              : "Pre-Order Information"}
          </h3>

          <div className="space-y-3 text-sm text-amber-800">
            {isMixedOrder && (
              <p className="font-medium">
                Some items in your order are pre-orders and will ship separately
                when available.
              </p>
            )}

            <div>
              <p className="font-medium mb-2">Pre-Order Items:</p>
              <ul className="space-y-2 ml-4">
                {preOrderItems.map((item, index) => {
                  const deliveryDate = getEstimatedDeliveryDate(item.product);
                  return (
                    <li
                      key={index}
                      className="flex justify-between items-start"
                    >
                      <span className="flex-1">
                        {item.product.name}
                        <span className="text-amber-600">
                          {" "}
                          (x{item.quantity})
                        </span>
                      </span>
                      {deliveryDate && (
                        <span className="text-xs text-amber-700 ml-2">
                          Est: {formatDeliveryDate(deliveryDate)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-amber-200 pt-3 space-y-2">
              <p className="font-medium">Pre-Order Terms:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Pre-order items will be charged at checkout</li>
                <li>Items will ship as soon as they become available</li>
                <li>
                  You'll receive a notification when your pre-order is ready to
                  ship
                </li>
                <li>Pre-orders can be cancelled before shipping</li>
                {isMixedOrder && (
                  <li>
                    In-stock items will ship immediately, pre-orders will follow
                    separately
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
