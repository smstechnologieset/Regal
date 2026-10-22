"use client";

/**
 * Checkout Page
 *
 * Checkout flow with shipping address form and Cash on Delivery payment option.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Truck,
  CreditCard,
  Banknote,
  Lock,
  Tag,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { submitOrder } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PreOrderNotice from "@/components/attire/PreOrderNotice";
import { formatPrice, isValidEmail, isValidPhone } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import {
  hasPreOrderItems,
  getEstimatedDeliveryDate,
} from "@/lib/utils/preorderHelpers";

type PaymentMethod = "cod" | "card";

interface ShippingForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCart();
  const { addToast } = useApp();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login?redirect=/attire/checkout");
    }
  }, [user, isAuthLoading, router]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [formData, setFormData] = useState<ShippingForm>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Ethiopia",
  });
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});

  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const subtotal = getCartTotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = appliedPromo?.discountAmount || 0;
  const total = Math.max(0, subtotal - discount + shipping);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof ShippingForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingForm> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Promo Code application
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;

    setIsApplyingPromo(true);
    try {
      const response = await fetch(
        `/api/validate-promo?code=${encodeURIComponent(promoCodeInput)}&subtotal=${subtotal}`
      );

      const result = await response.json();

      if (result.success && result.promo) {
        setAppliedPromo({
          code: result.promo.code,
          discountAmount: result.promo.discount_amount,
        });
        addToast(`Promo code "${result.promo.code}" applied!`, "success");
        setPromoCodeInput("");
      } else {
        addToast(result.error || "Invalid promo code", "error");
      }
    } catch (error) {
      console.error("Failed to validate promo code:", error);
      addToast("Failed to apply promo code", "error");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    addToast("Promo code removed", "info");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    if (items.length === 0) {
      addToast("Your cart is empty", "error");
      return;
    }

    if (!user) {
      addToast("Please log in to place an order", "error");
      router.push("/login?redirect=/attire/checkout");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit order to Supabase
      const { orderId, conversationId, success } = await submitOrder({
        userId: user.id,
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor.name,
          price: item.product.price,
          isPreorder: item.isPreorder || false,
          estimatedDeliveryDate: item.isPreorder
            ? getEstimatedDeliveryDate(item.product)?.toISOString()
            : null,
        })),
        shippingAddress: formData,
        subtotal,
        shipping,
        discount,
        promoCode: appliedPromo?.code || null,
        total,
      });

      if (success) {
        // Fire-and-forget confirmation email (never blocks the redirect).
        if (orderId) {
          fetch("/api/orders/confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, email: formData.email }),
          }).catch((err) => console.error("Confirmation email request failed:", err));
        }

        // Clear cart and redirect to confirmation
        clearCart();
        addToast("Order placed successfully!", "success");
        router.push(
          `/attire/order-confirmation?orderId=${orderId}${conversationId ? `&conversationId=${conversationId}` : ""}`
        );
      } else {
        addToast("Failed to place order. Please try again.", "error");
      }
    } catch (error) {
      console.error("Order submission failed:", error);
      addToast("Failed to place order. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-primary mb-4">
          Your cart is empty
        </h1>
        <Link href="/attire/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 min-w-0">
        {/* Back button */}
        <Link
          href="/attire/cart"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 hover:text-[#1E3A8A] mb-3 sm:mb-5 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Cart
        </Link>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111827] mb-5 sm:mb-8 font-serif">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="w-full max-w-full min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8 w-full max-w-full min-w-0">
            {/* Checkout Form */}
            <div className="w-full min-w-0 max-w-full lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5DFD7] shadow-xs w-full max-w-full min-w-0">
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F4EFEA] rounded-full flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-[#1E3A8A]" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-[#111827] font-serif">
                    Shipping Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
                  <div className="md:col-span-2 w-full min-w-0">
                    <Input
                      label="Full Name"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      error={errors.fullName}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <Input
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      placeholder="+251 900 000 000"
                    />
                  </div>
                  <div className="md:col-span-2 w-full min-w-0">
                    <Input
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      error={errors.address}
                      placeholder="123 Main St, Apt 4"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      placeholder="Addis Ababa"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <Input
                      label="State / Province"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      error={errors.state}
                      placeholder="Addis Ababa"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <Input
                      label="ZIP / Postal Code"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      error={errors.zipCode}
                      placeholder="1000"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full min-w-0 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5DFD7] shadow-xs w-full max-w-full min-w-0">
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F4EFEA] rounded-full flex items-center justify-center shrink-0">
                    <CreditCard size={18} className="text-[#1E3A8A]" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-[#111827] font-serif">
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-3 w-full min-w-0">
                  {/* Cash on Delivery */}
                  <label
                    className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 border-2 rounded-xl cursor-pointer transition-colors w-full min-w-0 ${
                      paymentMethod === "cod"
                        ? "border-[#1E3A8A] bg-[#F4EFEA]/60"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 accent-[#1E3A8A]"
                    />
                    <Banknote size={22} className="text-[#1E3A8A] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[#111827] text-sm sm:text-base block truncate">
                        Cash on Delivery
                      </span>
                      <p className="text-xs sm:text-sm text-slate-500 truncate sm:whitespace-normal">
                        Pay when you receive your order
                      </p>
                    </div>
                  </label>

                  {/* Credit Card (Disabled - UI Only) */}
                  <label className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 border-2 border-slate-200 rounded-xl opacity-50 cursor-not-allowed w-full min-w-0">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      disabled
                      className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                    />
                    <CreditCard size={22} className="text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-500 text-sm sm:text-base block truncate">
                        Credit / Debit Card
                      </span>
                      <p className="text-xs sm:text-sm text-slate-400 truncate">Coming soon</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full min-w-0 max-w-full lg:col-span-1">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5DFD7] shadow-xs w-full min-w-0 lg:sticky lg:top-24">
                <h2 className="text-base sm:text-lg font-semibold text-[#111827] mb-4 font-serif">
                  Order Summary
                </h2>

                {/* Items preview */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1 w-full min-w-0">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                      className="flex items-center gap-3 w-full min-w-0"
                    >
                      <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={64}
                          height={80}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate" title={item.product.name}>
                          {item.product.name}
                        </p>
                        <p
                          className="text-xs text-slate-500 truncate"
                          title={`${item.selectedSize} / ${item.selectedColor.name} × ${item.quantity}`}
                        >
                          {item.selectedSize} / {item.selectedColor.name} ×{" "}
                          {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-[#1E3A8A] mt-0.5">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pre-Order Notice */}
                {hasPreOrderItems(items) && (
                  <div className="mb-4 w-full min-w-0">
                    <PreOrderNotice items={items} />
                  </div>
                )}

                <div className="space-y-2.5 py-4 border-y border-[#E5DFD7] w-full min-w-0">
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-slate-600 shrink-0">Subtotal</span>
                    <span className="font-medium text-right truncate">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-slate-600 shrink-0">Shipping</span>
                    <span className="font-medium text-right shrink-0">
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between items-center text-sm text-emerald-600 font-medium gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <Tag size={12} className="shrink-0" />
                        <span className="truncate">Discount ({appliedPromo.code})</span>
                      </div>
                      <span className="shrink-0">-{formatPrice(appliedPromo.discountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                {!appliedPromo ? (
                  <div className="py-3.5 border-b border-[#E5DFD7] w-full min-w-0">
                    <div className="flex gap-2 w-full min-w-0">
                      <input
                        type="text"
                        placeholder="PROMO CODE"
                        className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] uppercase font-medium tracking-wider"
                        value={promoCodeInput}
                        onChange={(e) =>
                          setPromoCodeInput(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleApplyPromoCode())
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 px-3"
                        onClick={handleApplyPromoCode}
                        isLoading={isApplyingPromo}
                        disabled={!promoCodeInput.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-3.5 border-b border-slate-200 w-full min-w-0">
                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg w-full min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                          <Tag size={11} />
                        </div>
                        <span className="text-sm font-bold text-emerald-700 truncate">
                          {appliedPromo.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-emerald-700 hover:text-emerald-900 transition-colors p-1 shrink-0"
                        aria-label="Remove promo code"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 mb-5 gap-2 w-full min-w-0">
                  <span className="text-base sm:text-lg font-semibold text-primary shrink-0">
                    Total
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-primary text-right truncate">
                    {formatPrice(total)}
                  </span>
                </div>

                {/* Place Order Button */}
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  variant="secondary"
                  className="w-full min-w-0"
                  isLoading={isSubmitting}
                >
                  Place Order
                </Button>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                  <Lock size={14} className="shrink-0" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
