"use client";

/**
 * User Orders Page
 *
 * Lists all user orders with status filtering.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import {
  getOrderSummary,
  formatServiceType,
  formatOrderDate,
} from "@/lib/utils/orderHelpers";

interface Order {
  id: string;
  service_type: string;
  status: string;
  total: number;
  created_at: string;
  details: Record<string, unknown>;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [user]);

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={18} className="text-emerald-600" />;
      case "cancelled":
        return <XCircle size={18} className="text-red-600" />;
      case "in_progress":
        return <AlertCircle size={18} className="text-purple-600" />;
      default:
        return <Clock size={18} className="text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-blue-100 text-blue-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return styles[status] || styles.pending;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Orders</h1>
          <p className="text-slate-600">Track and manage all your orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "in_progress", "completed"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                filter === status
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {getOrderSummary(order.details)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatServiceType(order.service_type)} •{" "}
                        {formatOrderDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        ETB {order.total.toFixed(2)}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadge(order.status)}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <ChevronRight className="text-slate-400" size={20} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">
              {filter === "all"
                ? "No orders yet"
                : `No ${filter.replace("_", " ")} orders`}
            </h3>
            <p className="text-slate-500 mb-6">
              {filter === "all"
                ? "Start exploring our services and place your first order!"
                : "Try a different filter to see more orders."}
            </p>
            {filter === "all" && (
              <Link href="/">
                <Button>Browse Services</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
