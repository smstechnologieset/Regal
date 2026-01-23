"use client";

/**
 * Admin Dashboard Overview
 *
 * Main admin dashboard with statistics and quick actions.
 * Uses secure API endpoints for data fetching.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Users,
  Package,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ShoppingBag,
  Calendar,
  Heart,
  UtensilsCrossed,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import PreOrderAnalytics from "@/components/admin/analytics/PreOrderAnalytics";

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalUsers: number;
  activeOrders: number;
  unreadMessages: number;
  ordersByService: {
    attire: number;
    events: number;
    bridal: number;
    catering: number;
  };
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  service_type: string;
  created_at: string;
  profiles?: { full_name: string | null };
}

export default function AdminDashboard() {
  const { showApiError } = useApp();
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalUsers: 0,
    activeOrders: 0,
    unreadMessages: 0,
    ordersByService: { attire: 0, events: 0, bridal: 0, catering: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");

        if (!response.ok) throw response;

        const data = await response.json();

        setStats({
          totalRevenue: data.totalRevenue,
          monthlyRevenue: data.monthlyRevenue,
          totalUsers: data.totalUsers,
          activeOrders: data.activeOrders,
          unreadMessages: data.unreadMessages,
          ordersByService: data.ordersByService,
        });

        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        showApiError(err, "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      change: "+12.5%",
    },
    {
      label: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-blue-500",
      change: "+8.2%",
    },
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-purple-500",
      change: "+5.1%",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders.toLocaleString(),
      icon: Package,
      color: "bg-amber-500",
    },
  ];

  const serviceCards = [
    {
      name: "Attire",
      count: stats.ordersByService.attire,
      icon: ShoppingBag,
      color: "text-secondary bg-rose-50",
    },
    {
      name: "Events",
      count: stats.ordersByService.events,
      icon: Calendar,
      color: "text-blue-600 bg-blue-50",
    },
    {
      name: "Bridal",
      count: stats.ordersByService.bridal,
      icon: Heart,
      color: "text-pink-600 bg-pink-50",
    },
    {
      name: "Catering",
      count: stats.ordersByService.catering,
      icon: UtensilsCrossed,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-slate-600">
          Welcome back! Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white`}
              >
                <stat.icon size={24} />
              </div>
              {stat.change && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-primary">
              {loading ? "..." : stat.value}
            </p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Orders by Service */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-6">
          Orders by Service
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceCards.map((service) => (
            <Link
              key={service.name}
              href={`/admin/orders?service=${service.name.toLowerCase()}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.color}`}
              >
                <service.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {loading ? "..." : service.count}
                </p>
                <p className="text-sm text-slate-500">{service.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pre-Order Analytics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">
            Pre-Order Analytics
          </h2>
          <Link
            href="/admin/orders?tab=preorders"
            className="text-sm text-secondary hover:text-secondary/80 flex items-center gap-1"
          >
            Manage Pre-Orders <ArrowUpRight size={14} />
          </Link>
        </div>
        <PreOrderAnalytics />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-secondary hover:text-secondary/80 flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Package size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-primary text-sm">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.profiles?.full_name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary text-sm">
                      ${order.total}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {order.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No orders yet</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-primary mb-6">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/messages"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="text-secondary" size={20} />
                <span className="font-medium text-primary">View Messages</span>
              </div>
              {stats.unreadMessages > 0 && (
                <span className="bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full">
                  {stats.unreadMessages}
                </span>
              )}
            </Link>
            <Link
              href="/admin/orders?status=pending"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-amber-200 hover:bg-amber-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Clock className="text-amber-600" size={20} />
                <span className="font-medium text-primary">Pending Orders</span>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Users className="text-purple-600" size={20} />
                <span className="font-medium text-primary">Manage Users</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
