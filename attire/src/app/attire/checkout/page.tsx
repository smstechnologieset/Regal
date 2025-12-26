'use client';

/**
 * Checkout Page
 * 
 * Checkout flow with shipping address form and Cash on Delivery payment option.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Truck, CreditCard, Banknote, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { submitOrder } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatPrice, isValidEmail, isValidPhone } from '@/lib/utils';

type PaymentMethod = 'cod' | 'card';

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
    const [formData, setFormData] = useState<ShippingForm>({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
    });
    const [errors, setErrors] = useState<Partial<ShippingForm>>({});

    const subtotal = getCartTotal();
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const total = subtotal + shipping;

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            newErrors.fullName = 'Full name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!isValidPhone(formData.phone)) {
            newErrors.phone = 'Invalid phone number';
        }
        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }
        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }
        if (!formData.zipCode.trim()) {
            newErrors.zipCode = 'ZIP code is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        if (items.length === 0) {
            addToast('Your cart is empty', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Submit order to mock API
            const result = await submitOrder({
                items: items.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    size: item.selectedSize,
                    color: item.selectedColor.name,
                })),
                shippingAddress: formData,
            });

            if (result.success) {
                // Clear cart and redirect to confirmation
                clearCart();
                router.push(`/attire/order-confirmation?orderId=${result.orderId}`);
            }
        } catch (error) {
            console.error('Order submission failed:', error);
            addToast('Failed to place order. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect if cart is empty
    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
                <Link href="/attire/products">
                    <Button>Continue Shopping</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="container mx-auto px-4 py-8">
                {/* Back button */}
                <Link
                    href="/attire/cart"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
                >
                    <ChevronLeft size={16} />
                    Back to Cart
                </Link>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">
                    Checkout
                </h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Information */}
                            <div className="bg-white rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Truck size={20} className="text-slate-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Shipping Information
                                    </h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Full Name"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            error={errors.fullName}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <Input
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={errors.email}
                                        placeholder="john@example.com"
                                    />
                                    <Input
                                        label="Phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        error={errors.phone}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Street Address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            error={errors.address}
                                            placeholder="123 Main St, Apt 4"
                                        />
                                    </div>
                                    <Input
                                        label="City"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        error={errors.city}
                                        placeholder="New York"
                                    />
                                    <Input
                                        label="State / Province"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        error={errors.state}
                                        placeholder="NY"
                                    />
                                    <Input
                                        label="ZIP / Postal Code"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        error={errors.zipCode}
                                        placeholder="10001"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Country
                                        </label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        >
                                            <option value="United States">United States</option>
                                            <option value="Canada">Canada</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <CreditCard size={20} className="text-slate-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Payment Method
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    {/* Cash on Delivery */}
                                    <label
                                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod'
                                            ? 'border-slate-900 bg-slate-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="w-5 h-5 text-slate-900"
                                        />
                                        <Banknote size={24} className="text-slate-600" />
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-900">
                                                Cash on Delivery
                                            </span>
                                            <p className="text-sm text-slate-500">
                                                Pay when you receive your order
                                            </p>
                                        </div>
                                    </label>

                                    {/* Credit Card (Disabled - UI Only) */}
                                    <label
                                        className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl opacity-50 cursor-not-allowed"
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            disabled
                                            className="w-5 h-5"
                                        />
                                        <CreditCard size={24} className="text-slate-400" />
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-500">
                                                Credit / Debit Card
                                            </span>
                                            <p className="text-sm text-slate-400">
                                                Coming soon
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 sticky top-24">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                    Order Summary
                                </h2>

                                {/* Items preview */}
                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                    {items.map((item) => (
                                        <div
                                            key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                                            className="flex gap-3"
                                        >
                                            <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                <Image
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    width={64}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {item.selectedSize} / {item.selectedColor.name} × {item.quantity}
                                                </p>
                                                <p className="text-sm font-medium text-slate-900 mt-1">
                                                    {formatPrice(item.product.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 py-4 border-y border-slate-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Subtotal</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Shipping</span>
                                        <span className="font-medium">
                                            {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4 mb-6">
                                    <span className="text-lg font-semibold text-slate-900">Total</span>
                                    <span className="text-lg font-bold text-slate-900">
                                        {formatPrice(total)}
                                    </span>
                                </div>

                                {/* Place Order Button */}
                                <Button
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                    variant="secondary"
                                    isLoading={isSubmitting}
                                >
                                    Place Order
                                </Button>

                                {/* Security note */}
                                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                                    <Lock size={14} />
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
