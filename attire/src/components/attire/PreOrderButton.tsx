"use client";

import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import {
  isEligibleForPreOrder,
  calculateEstimatedDelivery,
} from "@/lib/utils/preorderHelpers";

interface PreOrderButtonProps {
  product: Product;
  selectedSize: string | null;
  selectedColor: { name: string; hex: string } | null;
  quantity: number;
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * PreOrderButton Component
 * Replaces "Add to Cart" button when product is out of stock and eligible for pre-order
 * Requirements: 1.2, 1.3, 1.4
 */
export default function PreOrderButton({
  product,
  selectedSize,
  selectedColor,
  quantity,
  fullWidth = false,
  disabled = false,
}: PreOrderButtonProps) {
  const { addToCart, toggleCart } = useCart();
  const { addToast } = useApp();
  const estimatedDelivery = calculateEstimatedDelivery(product);

  if (!isEligibleForPreOrder(product)) {
    return null;
  }

  const handlePreOrder = () => {
    if (!selectedSize || !selectedColor) {
      addToast("Please select size and color", "warning");
      return;
    }

    // Add to cart with pre-order flag
    addToCart(product, selectedSize, selectedColor, quantity, true);
    addToast(`${product.name} added to cart as pre-order!`, "success");
    toggleCart();
  };

  return (
    <div className={fullWidth ? "w-full space-y-3" : "space-y-3"}>
      <button
        onClick={handlePreOrder}
        disabled={disabled || !selectedSize || !selectedColor}
        className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Pre-Order Now
      </button>

      {estimatedDelivery && (
        <p className="text-sm text-gray-600 text-center">{estimatedDelivery}</p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800">
          <strong>Pre-Order:</strong> This item is currently out of stock. Place
          your order now and we'll ship it as soon as it's available.
        </p>
      </div>
    </div>
  );
}
