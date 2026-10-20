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
    const hasSizes = (product.sizes?.length ?? 0) > 0;
    const hasColors = (product.colors?.length ?? 0) > 0;

    if (hasSizes && !selectedSize) {
      addToast("Please select a size", "warning");
      return;
    }
    if (hasColors && !selectedColor) {
      addToast("Please select a color", "warning");
      return;
    }

    const size = selectedSize || product.sizes?.[0] || "Standard";
    const color = selectedColor || product.colors?.[0] || { name: "Default", hex: "#000000" };

    // Add to cart with pre-order flag
    addToCart(product, size, color, quantity, true);
    addToast(`${product.name} added to cart as pre-order!`, "success");
    toggleCart();
  };

  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const hasColors = (product.colors?.length ?? 0) > 0;
  const canOrder = (!hasSizes || selectedSize) && (!hasColors || selectedColor);

  return (
    <div className={fullWidth ? "w-full space-y-3" : "space-y-3"}>
      <button
        onClick={handlePreOrder}
        disabled={disabled || !canOrder}
        className="w-full bg-[#C5A059] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#B38F4B] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        Pre-Order Now (ቅድመ-ይዘዙ)
      </button>

      {estimatedDelivery && (
        <p className="text-sm text-gray-600 text-center">{estimatedDelivery}</p>
      )}

      <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-lg p-3">
        <p className="text-xs text-[#2B2D2F]">
          <strong>Pre-Order:</strong> This item is currently out of stock. Place
          your order now and we'll ship it as soon as it's available.
        </p>
      </div>
    </div>
  );
}
