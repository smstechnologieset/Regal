"use client";

/**
 * User Order Detail Page
 *
 * Shows order details and status timeline.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  Package,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

interface Order {
  id: string;
  service_type: string;
  status: string;
  total: number;
  details: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  has_preorders?: boolean;
  preorder_status?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  selected_size?: string;
  selected_color?: string;
  is_preorder: boolean;
  preorder_status?: string;
  estimated_delivery_date?: string;
  created_at: string;
}

const statusSteps = ["pending", "confirmed", "in_progress", "completed"];

export default function UserOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user } = useAuth();
  const { addToast } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [cancellingItemId, setCancellingItemId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<OrderItem | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;

      const supabase = getSupabaseClient();

      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!orderError && orderData) {
        setOrder(orderData);

        // Fetch order items if this is an attire order
        if (orderData.service_type === "attire") {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true });

          if (!itemsError && itemsData) {
            setOrderItems(itemsData);
          }
        }
      }
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  const getServiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      attire: "Attire Shop",
      events: "Event Planning",
      bridal: "Bridal Services",
      catering: "Catering",
    };
    return labels[type] || type;
  };

  const getCurrentStep = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.indexOf(status);
  };

  const handleContactSupport = async () => {
    if (!order || !user) return;
    setContacting(true);

    try {
      const supabase = getSupabaseClient();

      // 1. Check for existing conversation for this order
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("order_id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingConv) {
        router.push(`/account/messages/${existingConv.id}`);
        return;
      }

      // 2. If no conversation exists, create a new one
      const items = Array.isArray(order.details) ? order.details : [];
      const firstItemName =
        items[0]?.productName ||
        items[0]?.product?.name ||
        items[0]?.name ||
        "Order";
      const displaySubject =
        items.length > 1
          ? `${firstItemName} +${items.length - 1} more`
          : firstItemName;

      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          order_id: orderId,
          service_type: order.service_type,
          subject: displaySubject,
          status: "open",
        })
        .select()
        .single();

      if (createError) throw createError;

      if (newConv) {
        router.push(`/account/messages/${newConv.id}`);
      }
    } catch (err: any) {
      console.error("Error starting conversation:", err);
      addToast("Failed to start conversation. Please try again.", "error");
    } finally {
      setContacting(false);
    }
  };

  const handleCancelPreOrder = (item: OrderItem) => {
    setItemToCancel(item);
    setShowCancelDialog(true);
  };

  const confirmCancelPreOrder = async () => {
    if (!itemToCancel) return;

    setCancellingItemId(itemToCancel.id);
    setShowCancelDialog(false);

    try {
      const response = await fetch(
        `/api/attire/orders/${orderId}/items/${itemToCancel.id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel pre-order");
      }

      const result = await response.json();

      // Update local state
      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === itemToCancel.id
            ? { ...item, preorder_status: "cancelled" }
            : item
        )
      );

      // Update order if needed
      if (result.order) {
        setOrder((prev) => (prev ? { ...prev, ...result.order } : null));
      }

      addToast("Pre-order cancelled successfully", "success");
    } catch (err: any) {
      console.error("Error cancelling pre-order:", err);
      addToast(err.message || "Failed to cancel pre-order", "error");
    } finally {
      setCancellingItemId(null);
      setItemToCancel(null);
    }
  };

  const formatDeliveryDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Order not found.</p>
        <Link
          href="/account/orders"
          className="text-rose-600 hover:underline mt-2 inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStep = getCurrentStep(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/account/orders"
          className="text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-slate-500">
            {getServiceLabel(order.service_type)} •{" "}
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-6">Order Status</h2>

        {order.status === "cancelled" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-red-600" size={32} />
            </div>
            <p className="text-lg font-medium text-red-600">Order Cancelled</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200">
              <div
                className="h-full bg-rose-600 transition-all duration-500"
                style={{
                  width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
                }}
              />
            </div>
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                        isCompleted
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 text-slate-400"
                      } ${isCurrent ? "ring-4 ring-rose-100" : ""}`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                    </div>
                    <p
                      className={`mt-2 text-sm font-medium capitalize ${
                        isCompleted ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {step.replace("_", " ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order Items (for Attire orders) */}
      {order.service_type === "attire" && orderItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">
                    {item.product_name}
                  </h3>
                  <div className="text-sm text-slate-600 mt-1 space-y-1">
                    {item.selected_size && <p>Size: {item.selected_size}</p>}
                    {item.selected_color && <p>Color: {item.selected_color}</p>}
                    <p>Quantity: {item.quantity}</p>
                    <p className="font-medium">ETB {item.price.toFixed(2)} each</p>
                  </div>

                  {/* Pre-order badge and info */}
                  {item.is_preorder && (
                    <div className="mt-2">
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Pre-Order
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.preorder_status === "pending"
                              ? "bg-blue-100 text-blue-800"
                              : item.preorder_status === "ready"
                                ? "bg-green-100 text-green-800"
                                : item.preorder_status === "fulfilled"
                                  ? "bg-slate-100 text-slate-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.preorder_status === "pending"
                            ? "Awaiting Stock"
                            : item.preorder_status === "ready"
                              ? "Ready to Ship"
                              : item.preorder_status === "fulfilled"
                                ? "Fulfilled"
                                : "Cancelled"}
                        </span>
                      </div>
                      {item.preorder_status === "pending" &&
                        item.estimated_delivery_date && (
                          <p className="text-sm text-slate-600 mt-1">
                            Estimated delivery:{" "}
                            {formatDeliveryDate(item.estimated_delivery_date)}
                          </p>
                        )}
                    </div>
                  )}
                </div>

                {/* Cancel button for pending pre-orders */}
                {item.is_preorder && item.preorder_status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelPreOrder(item)}
                    disabled={cancellingItemId === item.id}
                  >
                    {cancellingItemId === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Cancel Pre-Order"
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Order Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Service</span>
              <span className="font-medium text-slate-900">
                {getServiceLabel(order.service_type)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Order Date</span>
              <span className="font-medium text-slate-900">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Last Updated</span>
              <span className="font-medium text-slate-900">
                {new Date(order.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600 text-lg">Total</span>
              <span className="font-bold text-slate-900 text-lg">
                ETB {order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Need Help?</h2>
          <p className="text-slate-600 mb-4">
            Have questions about your order? Our support team is here to help.
          </p>
          <Button
            variant="outline"
            fullWidth
            onClick={handleContactSupport}
            disabled={contacting}
          >
            {contacting ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <MessageSquare size={18} className="mr-2" />
            )}
            Contact Support
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && itemToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Cancel Pre-Order?
            </h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to cancel the pre-order for{" "}
              <span className="font-medium">{itemToCancel.product_name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setItemToCancel(null);
                }}
              >
                Keep Pre-Order
              </Button>
              <Button
                variant="primary"
                onClick={confirmCancelPreOrder}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Cancel Pre-Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
