"use client";

import { useState, useEffect } from "react";
import { Package, Clock, TrendingUp, AlertCircle, Loader2 } from "lucide-react";

interface ProductPreorder {
  productId: string;
  productName: string;
  totalQuantity: number;
  pendingCount: number;
  readyCount: number;
  estimatedRestockDate?: string;
  currentStock: number;
}

interface AnalyticsData {
  totalActivePreorders: number;
  totalPendingPreorders: number;
  totalReadyPreorders: number;
  preordersByProduct: ProductPreorder[];
  averageWaitDays: number;
  conversionRate: number;
  fulfilledCount: number;
  cancelledCount: number;
}

export default function PreOrderAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/attire/preorders/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Pre-Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Pre-Orders</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.totalActivePreorders}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {analytics.totalPendingPreorders} pending,{" "}
            {analytics.totalReadyPreorders} ready
          </div>
        </div>

        {/* Average Wait Time */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Avg Wait Time</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.averageWaitDays} days
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Based on fulfilled orders
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.conversionRate}%
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {analytics.fulfilledCount} fulfilled, {analytics.cancelledCount}{" "}
            cancelled
          </div>
        </div>

        {/* Products with Pre-Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Products</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.preordersByProduct.length}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            With active pre-orders
          </div>
        </div>
      </div>

      {/* Pre-Orders by Product */}
      {analytics.preordersByProduct.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Pre-Order Demand by Product
          </h3>
          <div className="space-y-4">
            {analytics.preordersByProduct.slice(0, 10).map((product) => (
              <div
                key={product.productId}
                className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">
                    {product.productName}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                    <span>
                      Total:{" "}
                      <span className="font-medium">
                        {product.totalQuantity}
                      </span>
                    </span>
                    <span className="text-blue-600">
                      Pending: {product.pendingCount}
                    </span>
                    <span className="text-green-600">
                      Ready: {product.readyCount}
                    </span>
                    <span className="text-slate-500">
                      Stock: {product.currentStock}
                    </span>
                  </div>
                  {product.estimatedRestockDate && (
                    <p className="text-xs text-slate-500 mt-1">
                      Restock: {formatDate(product.estimatedRestockDate)}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-700">
                      {product.totalQuantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {analytics.preordersByProduct.length > 10 && (
            <p className="text-sm text-slate-500 mt-4 text-center">
              Showing top 10 products.{" "}
              {analytics.preordersByProduct.length - 10} more products have
              pre-orders.
            </p>
          )}
        </div>
      )}

      {/* No Pre-Orders Message */}
      {analytics.preordersByProduct.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-semibold text-slate-900 mb-2">
            No Active Pre-Orders
          </h3>
          <p className="text-slate-600">
            There are currently no active pre-orders in the system.
          </p>
        </div>
      )}
    </div>
  );
}
