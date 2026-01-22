"use client";

/**
 * Account Overview Page
 *
 * Main dashboard for user account.
 * Shows profile summary, recent orders, and quick actions.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  MessageSquare,
  Settings,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { getUserOrders, UserOrder } from "@/lib/services/orders";
import {
  formatServiceType,
  formatOrderDate,
  getOrderSummary,
} from "@/lib/utils/orderHelpers";

export default function AccountPage() {
  const { profile, user } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getUserOrders(5);
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-blue-100 text-blue-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-primary mb-2">
          Welcome back, {profile?.full_name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-slate-600">
          Manage your orders, messages, and account settings from here.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/account/orders" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-rose-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <Package className="text-secondary" size={24} />
              <ChevronRight
                className="text-slate-400 group-hover:text-secondary transition-colors"
                size={20}
              />
            </div>
            <h3 className="font-semibold text-primary">My Orders</h3>
            <p className="text-sm text-slate-500">View order history</p>
          </div>
        </Link>

        <Link href="/account/messages" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-rose-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <MessageSquare className="text-secondary" size={24} />
              <ChevronRight
                className="text-slate-400 group-hover:text-secondary transition-colors"
                size={20}
              />
            </div>
            <h3 className="font-semibold text-primary">Messages</h3>
            <p className="text-sm text-slate-500">Chat with support</p>
          </div>
        </Link>

        <Link href="/account/settings" className="group">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-rose-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <Settings className="text-secondary" size={24} />
              <ChevronRight
                className="text-slate-400 group-hover:text-secondary transition-colors"
                size={20}
              />
            </div>
            <h3 className="font-semibold text-primary">Settings</h3>
            <p className="text-sm text-slate-500">Manage your account</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-secondary hover:text-secondary/80 font-medium"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : orders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      {order.status === "completed" ? (
                        <CheckCircle size={20} className="text-emerald-600" />
                      ) : (
                        <Clock size={20} className="text-amber-600" />
                      )}
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
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      ${order.total.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">
              No orders yet
            </h3>
            <p className="text-slate-500 mb-4">Start exploring our services!</p>
            <Link href="/">
              <Button>Browse Services</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Profile Completion */}
      {(!profile?.phone || !profile?.avatar_url) && (
        <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-2xl border border-rose-100 p-6">
          <h3 className="font-semibold text-primary mb-2">
            Complete Your Profile
          </h3>
          <p className="text-slate-600 mb-4">
            Add your phone number and profile photo for a better experience.
          </p>
          <Link href="/account/settings">
            <Button size="sm" variant="outline">
              Update Profile
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
