"use client";

/**
 * Admin Orders Management - Client Component
 *
 * Lists all orders with filtering by service (including Gifts) and status.
 * Includes single and bulk order deletion with confirmation modal.
 * Includes Pre-Orders tab for managing pre-order items.
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ChevronRight,
  Package,
  ShoppingBag,
  Calendar,
  Heart,
  UtensilsCrossed,
  Clock,
  Gift,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import PreOrderManager from "@/components/admin/orders/PreOrderManager";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  user_id: string;
  service_type: string;
  status: string;
  total: number;
  created_at: string;
  profiles?: { full_name: string | null };
}

type TabType = "orders" | "preorders";

export default function AdminOrdersClient() {
  const { showApiError, addToast } = useApp();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState(
    searchParams.get("service") || "all"
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [preorderCount, setPreorderCount] = useState(0);

  // Selection & Deletion state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ordersToDelete, setOrdersToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (serviceFilter !== "all") params.set("service", serviceFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/orders?${params.toString()}`);

      if (!response.ok) throw response;

      const data = await response.json();
      setOrders(data.orders || []);
      setSelectedOrders([]);
    } catch (err) {
      console.error("Error fetching orders:", err);
      showApiError(err, "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [serviceFilter, statusFilter, showApiError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    async function fetchPreorderCount() {
      try {
        const response = await fetch(
          "/api/admin/attire/preorders?status=pending&limit=1"
        );
        if (!response.ok) return;
        const data = await response.json();
        setPreorderCount(data.total || 0);
      } catch (err) {
        console.error("Error fetching preorder count:", err);
      }
    }

    fetchPreorderCount();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !search ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesService =
      serviceFilter === "all" || order.service_type === serviceFilter;
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesService && matchesStatus;
  });

  // Selection handlers
  const handleToggleSelect = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  // Open delete modal for a single order
  const confirmSingleDelete = (orderId: string) => {
    setOrdersToDelete([orderId]);
    setDeleteModalOpen(true);
  };

  // Open delete modal for selected orders
  const confirmBulkDelete = () => {
    if (selectedOrders.length === 0) return;
    setOrdersToDelete(selectedOrders);
    setDeleteModalOpen(true);
  };

  // Execute deletion
  const executeDelete = async () => {
    if (ordersToDelete.length === 0) return;
    try {
      setIsDeleting(true);
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ordersToDelete }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete orders");
      }

      addToast(
        `Successfully deleted ${ordersToDelete.length} order${
          ordersToDelete.length > 1 ? "s" : ""
        }`,
        "success"
      );

      setDeleteModalOpen(false);
      setOrdersToDelete([]);
      await fetchOrders();
    } catch (err: any) {
      console.error("Error executing delete:", err);
      showApiError(err, err.message || "Failed to delete orders");
    } finally {
      setIsDeleting(false);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "attire":
        return <ShoppingBag size={16} />;
      case "events":
        return <Calendar size={16} />;
      case "bridal":
        return <Heart size={16} />;
      case "catering":
        return <UtensilsCrossed size={16} />;
      case "gifts":
        return <Gift size={16} />;
      default:
        return <Package size={16} />;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Orders</h1>
          <p className="text-slate-600 text-sm">Manage, filter, and review all customer orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === "orders"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <span className="flex items-center gap-2">
              <Package size={18} />
              All Orders
            </span>
          </button>
          <button
            onClick={() => setActiveTab("preorders")}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === "preorders"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <span className="flex items-center gap-2">
              <Clock size={18} />
              Pre-Orders
              {preorderCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {preorderCount}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "orders" ? (
        <>
          {/* Filters & Bulk Action Bar */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by order ID or customer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
              </div>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-white"
              >
                <option value="all">All Services</option>
                <option value="attire">Attire</option>
                <option value="events">Events</option>
                <option value="bridal">Bridal</option>
                <option value="catering">Catering</option>
                <option value="gifts">Gifts</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Bulk Actions Floating Row */}
            {selectedOrders.length > 0 && (
              <div className="flex items-center justify-between bg-[#F4EFEA] border border-[#E0D6C8] px-4 py-2.5 rounded-lg animate-fade-in text-sm">
                <div className="flex items-center gap-2 text-[#4A5D4E] font-medium">
                  <CheckSquare size={16} />
                  <span>
                    <strong>{selectedOrders.length}</strong> order
                    {selectedOrders.length > 1 ? "s" : ""} selected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedOrders([])}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={confirmBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete Selected ({selectedOrders.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-slate-500 mt-4 text-sm">Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="w-10 px-4 py-3.5 text-center">
                        <button
                          onClick={handleSelectAll}
                          className="text-slate-400 hover:text-primary transition-colors"
                          title="Select all"
                        >
                          {selectedOrders.length > 0 &&
                          selectedOrders.length === filteredOrders.length ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3.5">Order</th>
                      <th className="text-left px-4 py-3.5">Customer</th>
                      <th className="text-left px-4 py-3.5">Service</th>
                      <th className="text-left px-4 py-3.5">Status</th>
                      <th className="text-left px-4 py-3.5">Total</th>
                      <th className="text-left px-4 py-3.5">Date</th>
                      <th className="text-right px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredOrders.map((order) => {
                      const isSelected = selectedOrders.includes(order.id);
                      return (
                        <tr
                          key={order.id}
                          className={cn(
                            "hover:bg-[#FDFBF7] transition-colors",
                            isSelected && "bg-[#F4EFEA]/60"
                          )}
                        >
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => handleToggleSelect(order.id)}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare size={18} className="text-primary" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-bold text-primary">
                              #{order.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 font-medium">
                            {order.profiles?.full_name || "Guest Customer"}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-slate-700 capitalize font-medium">
                              {getServiceIcon(order.service_type)}
                              {order.service_type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadge(
                                order.status
                              )}`}
                            >
                              {order.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            ETB {order.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-xs">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                title="View order details"
                              >
                                <ChevronRight size={18} />
                              </Link>
                              <button
                                onClick={() => confirmSingleDelete(order.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete order"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                No orders found matching your criteria.
              </div>
            )}
          </div>
        </>
      ) : (
        <PreOrderManager />
      )}

      {/* Confirmation Modal for Order Deletion */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  Delete Order{ordersToDelete.length > 1 ? "s" : ""}?
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong>
                    {ordersToDelete.length}{" "}
                    {ordersToDelete.length === 1 ? "order" : "orders"}
                  </strong>
                  ? This will delete all associated line items and cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                disabled={isDeleting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
