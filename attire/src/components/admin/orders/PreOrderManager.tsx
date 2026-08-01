"use client";

/**
 * Pre-Order Manager Component
 *
 * Displays and manages pre-orders with filtering and status updates
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PreOrder {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  size: string;
  color: string;
  quantity: number;
  price: number;
  preorder_status: string;
  estimated_delivery_date: string | null;
  order_date: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
}

export default function PreOrderManager() {
  const { addToast, showApiError } = useApp();
  const [preorders, setPreorders] = useState<PreOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPreOrders();
  }, [statusFilter, productFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchPreOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (productFilter !== "all") params.append("product_id", productFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch(`/api/admin/attire/preorders?${params}`);
      if (!response.ok) throw response;

      const data = await response.json();
      setPreorders(data.preorders || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching pre-orders:", error);
      showApiError(error, "Failed to fetch pre-orders");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch("/api/admin/catalog/attire/products");
      if (!response.ok) throw response;

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }

  async function updatePreOrderStatus(preorder: PreOrder, newStatus: string) {
    setUpdating(preorder.id);
    try {
      const response = await fetch(
        `/api/admin/attire/preorders/${preorder.order_id}/items/${preorder.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preorder_status: newStatus }),
        }
      );

      if (!response.ok) throw response;

      addToast(`Pre-order marked as ${newStatus}`, "success");
      fetchPreOrders();
    } catch (error) {
      console.error("Error updating pre-order:", error);
      showApiError(error, "Failed to update pre-order status");
    } finally {
      setUpdating(null);
    }
  }

  const filteredPreorders = preorders.filter(
    (preorder) =>
      search === "" ||
      preorder.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      preorder.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      preorder.product_name.toLowerCase().includes(search.toLowerCase()) ||
      preorder.order_number.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="text-amber-500" size={18} />;
      case "ready":
        return <Package className="text-blue-500" size={18} />;
      case "fulfilled":
        return <CheckCircle className="text-green-500" size={18} />;
      case "cancelled":
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <Clock className="text-slate-400" size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "ready":
        return "bg-blue-100 text-blue-700";
      case "fulfilled":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Pre-Orders</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage and fulfill customer pre-orders
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-secondary">{total}</div>
          <div className="text-xs text-slate-500">Total Pre-Orders</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by customer, product, or order number..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="ready">Ready</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          value={productFilter}
          onChange={(e) => {
            setProductFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Products</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {/* Pre-Orders List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-300" size={40} />
        </div>
      ) : filteredPreorders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">No pre-orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPreorders.map((preorder) => (
            <PreOrderCard
              key={preorder.id}
              preorder={preorder}
              updating={updating === preorder.id}
              onUpdateStatus={updatePreOrderStatus}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface PreOrderCardProps {
  preorder: PreOrder;
  updating: boolean;
  onUpdateStatus: (preorder: PreOrder, status: string) => void;
  getStatusIcon: (status: string) => React.ReactElement;
  getStatusColor: (status: string) => string;
}

function PreOrderCard({
  preorder,
  updating,
  onUpdateStatus,
  getStatusIcon,
  getStatusColor,
}: PreOrderCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
          {preorder.product_image ? (
            <img
              src={preorder.product_image}
              alt={preorder.product_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Package size={32} />
            </div>
          )}
        </div>

        {/* Pre-Order Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-semibold text-primary">
                {preorder.product_name}
              </h3>
              <Link
                href={`/admin/orders/${preorder.order_id}`}
                className="text-sm text-secondary hover:underline"
              >
                Order #{preorder.order_number}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(preorder.preorder_status)}
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium capitalize",
                  getStatusColor(preorder.preorder_status)
                )}
              >
                {preorder.preorder_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <span className="text-slate-500">Customer:</span>
              <p className="font-medium text-slate-700">
                {preorder.customer_name}
              </p>
              <p className="text-xs text-slate-500">
                {preorder.customer_email}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Details:</span>
              <p className="font-medium text-slate-700">
                Size: {preorder.size} | Color: {preorder.color}
              </p>
              <p className="text-xs text-slate-500">
                Qty: {preorder.quantity} × ETB {preorder.price}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Order Date:</span>
              <p className="font-medium text-slate-700">
                {new Date(preorder.order_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Est. Delivery:</span>
              <p className="font-medium text-slate-700">
                {preorder.estimated_delivery_date
                  ? new Date(
                      preorder.estimated_delivery_date
                    ).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Status
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform",
                      showActions && "rotate-180"
                    )}
                  />
                </>
              )}
            </button>

            {showActions && !updating && (
              <div className="flex gap-2">
                {preorder.preorder_status === "pending" && (
                  <button
                    onClick={() => onUpdateStatus(preorder, "ready")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Mark as Ready
                  </button>
                )}
                {preorder.preorder_status === "ready" && (
                  <button
                    onClick={() => onUpdateStatus(preorder, "fulfilled")}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    Mark as Fulfilled
                  </button>
                )}
                {(preorder.preorder_status === "pending" ||
                  preorder.preorder_status === "ready") && (
                  <button
                    onClick={() => onUpdateStatus(preorder, "cancelled")}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
