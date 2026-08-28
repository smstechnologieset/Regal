"use client";

/**
 * Admin Order Detail Page
 *
 * Shows order details with status management.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  ShoppingBag,
  Truck,
  Clock,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

interface Order {
  id: string;
  user_id: string;
  service_type: string;
  status: string;
  total: number;
  details: any;
  shipping_address?: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; phone: string | null };
}

const statusOptions = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { addToast } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("orders")
          .select("*, profiles(full_name, phone)")
          .eq("id", orderId)
          .single();

        if (error) {
          console.error("Error fetching order:", error);
          addToast(`Failed to load order: ${error.message}`, "error");
        } else if (data) {
          setOrder(data);
        }
      } catch (err: any) {
        console.error("Unexpected error in fetchOrder:", err);
        addToast(
          "An unexpected error occurred while loading the order",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, addToast]);

  const updateStatus = async (newStatus: string) => {
    if (!order || order.status === newStatus) return;
    setUpdating(true);

    const activeStatuses = ["confirmed", "in_progress", "completed"];
    const wasActive = activeStatuses.includes(order.status);
    const isActive = activeStatuses.includes(newStatus);

    const supabase = getSupabaseClient();

    try {
      // 1. Handle Stock Adjustments
      if (!wasActive && isActive && Array.isArray(order.details)) {
        // Transitioning from Inactive to Active: Decrease Stock
        for (const item of (order.details as any[])) {
          const productId = item.productId || item.id;
          if (!productId) continue;

          const { data: product, error: productError } = await supabase
            .from("products")
            .select("stock_count")
            .eq("id", productId)
            .maybeSingle();

          // Skip if product doesn't exist (old/invalid product ID)
          if (productError || !product) {
            console.warn(
              `Product ${productId} not found, skipping stock adjustment`
            );
            continue;
          }

          const newCount = Math.max(
            0,
            (product.stock_count || 0) - (item.quantity || 1)
          );
          await supabase
            .from("products")
            .update({
              stock_count: newCount,
              in_stock: newCount > 0,
            })
            .eq("id", productId);
        }
      } else if (wasActive && !isActive && Array.isArray(order.details)) {
        // Transitioning from Active to Inactive (Cancelled/Pending): Restore Stock
        for (const item of (order.details as any[])) {
          const productId = item.productId || item.id;
          if (!productId) continue;

          const { data: product, error: productError } = await supabase
            .from("products")
            .select("stock_count")
            .eq("id", productId)
            .maybeSingle();

          // Skip if product doesn't exist (old/invalid product ID)
          if (productError || !product) {
            console.warn(
              `Product ${productId} not found, skipping stock adjustment`
            );
            continue;
          }

          const newCount = (product.stock_count || 0) + (item.quantity || 1);
          await supabase
            .from("products")
            .update({
              stock_count: newCount,
              in_stock: true,
            })
            .eq("id", productId);
        }
      }

      // 2. Update Order Status via API
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const { order: updatedOrder } = await response.json();
      setOrder({ ...order, status: newStatus });
      addToast(`Order status updated to ${newStatus}`, "success");
    } catch (err: any) {
      console.error("Error in updateStatus:", err);
      addToast(
        err.message || "An error occurred while updating the order",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleMessageCustomer = async () => {
    if (!order) return;
    setMessaging(true);

    try {
      const supabase = getSupabaseClient();

      // 1. Check for existing conversation for this order
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existingConv) {
        router.push(`/admin/messages/${existingConv.id}`);
        return;
      }

      // 2. If no conversation exists, create a new one
      const items = Array.isArray(order.details) ? order.details : [];
      const isBridal = order.service_type === 'bridal';
      const bridalDetails = !Array.isArray(order.details) ? order.details : null;

      const firstItemName = isBridal && bridalDetails?.gownName
        ? bridalDetails.gownName
        : (items[0]?.productName || items[0]?.product?.name || items[0]?.name || "Order Request");

      const displaySubject = items.length > 1
        ? `${firstItemName} +${items.length - 1} more`
        : firstItemName;

      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: order.user_id,
          order_id: orderId,
          service_type: order.service_type,
          subject: displaySubject,
          status: "open",
        })
        .select()
        .single();

      if (createError) throw createError;

      if (newConv) {
        router.push(`/admin/messages/${newConv.id}`);
      }
    } catch (err: any) {
      console.error("Error starting conversation:", err);
      addToast("Failed to start conversation", "error");
    } finally {
      setMessaging(false);
    }
  };

  const getServiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      attire: "Attire Shop",
      events: "Event Planning",
      bridal: "Bridal Services",
      catering: "Catering",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      confirmed: "bg-blue-100 text-blue-700 border-blue-200",
      in_progress: "bg-purple-100 text-purple-700 border-purple-200",
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
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
          href="/admin/orders"
          className="text-rose-600 hover:underline mt-2 inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-slate-500">
              {getServiceLabel(order.service_type)}
            </p>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize ${getStatusColor(order.status)}`}
        >
          {order.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Package size={20} />
              Order Summary
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Service Type</p>
                  <p className="font-medium text-slate-900">
                    {getServiceLabel(order.service_type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Order Date</p>
                  <p className="font-medium text-slate-900">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Last Updated</p>
                  <p className="font-medium text-slate-900">
                    {new Date(order.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ETB {order.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <ShoppingBag size={20} />
              Order Items
            </h2>
            <div className="space-y-4">
              {Array.isArray(order.details) ? (
                order.details.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ShoppingBag size={20} />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.productName || "Unknown Product"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && (
                            <span className="ml-3">Color: {item.color}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        ETB {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.quantity || 1} x $
                        {item.price?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                ))
              ) : order.service_type === 'bridal' ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 h-20 bg-rose-50 rounded-lg flex items-center justify-center text-rose-300">
                        <ShoppingBag size={32} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg text-slate-900">
                            {order.details?.gownName || "Bridal Gown"}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.details?.type === 'buy' ? 'bg-primary text-white' : 'bg-secondary text-white'
                            }`}>
                            {order.details?.type || 'Request'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Designer: {order.details?.designer || 'Custom'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">
                        ETB {order.total?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {order.details?.type === 'rent' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Rental Date</p>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar size={16} />
                        <span className="font-medium">{order.details?.date || 'To be scheduled'}</span>
                      </div>
                    </div>
                  )}

                  {order.details?.notes && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Notes from Customer</p>
                      <p className="text-sm text-slate-600 italic">"{order.details.notes}"</p>
                    </div>
                  )}
                </div>
              ) : order.service_type === 'events' || order.service_type === 'catering' ? (
                <div className="space-y-4">
                  {/* Event header */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-rose-50 rounded-lg flex items-center justify-center text-rose-300">
                        <Calendar size={28} />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-900 capitalize">
                          {order.details?.eventType || 'Custom'} Event
                        </p>
                        <p className="text-sm text-slate-500">
                          {order.details?.packageId ? `Package ID: ${order.details.packageId.slice(0, 8)}` : 'Custom Request'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Budget</p>
                      <p className="text-xl font-bold text-slate-900">
                        ETB {(order.details?.budget || order.total)?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Key details grid */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Event Date</p>
                      <p className="font-medium text-slate-800">{order.details?.date || 'Flexible'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Guest Count</p>
                      <p className="font-medium text-slate-800">{order.details?.guestCount ?? '—'} guests</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Contact</p>
                      <p className="font-medium text-slate-800 text-sm truncate">{order.details?.contactName || order.profiles?.full_name || '—'}</p>
                      <p className="text-xs text-slate-500 truncate">{order.details?.contactPhone || order.profiles?.phone || ''}</p>
                    </div>
                  </div>

                  {/* Features */}
                  {Array.isArray(order.details?.features) && order.details.features.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold mb-2">Requested Services</p>
                      <div className="flex flex-wrap gap-2">
                        {order.details.features.map((f: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 text-xs rounded-full font-medium">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {order.details?.description && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Client&apos;s Vision</p>
                      <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg">
                        &ldquo;{order.details.description}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Contact email */}
                  {order.details?.contactEmail && (
                    <div className="pt-2">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Email</p>
                      <a href={`mailto:${order.details.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                        {order.details.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Service details: {JSON.stringify(order.details)}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Truck size={20} />
                Shipping Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Recipient</p>
                  <p className="font-medium text-slate-900">
                    {order.shipping_address.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Contact</p>
                  <p className="font-medium text-slate-900">
                    {order.shipping_address.phone}
                  </p>
                  <p className="text-slate-500">
                    {order.shipping_address.email}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-500">Address</p>
                  <p className="font-medium text-slate-900">
                    {order.shipping_address.address}
                    <br />
                    {order.shipping_address.city},{" "}
                    {order.shipping_address.state}{" "}
                    {order.shipping_address.zipCode}
                    <br />
                    {order.shipping_address.country}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Update */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Update Status</h2>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={updating || order.status === status}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${order.status === status
                    ? getStatusColor(status)
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    } disabled:opacity-50`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User size={18} />
              Customer
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-medium text-slate-900">
                  {order.profiles?.full_name ||
                    order.shipping_address?.fullName ||
                    "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">
                  {order.profiles?.phone ||
                    order.shipping_address?.phone ||
                    "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={handleMessageCustomer}
                disabled={messaging}
              >
                {messaging ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <MessageSquare size={16} className="mr-2" />
                )}
                Message Customer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
