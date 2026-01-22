"use client";

/**
 * Notifications Page
 *
 * Full notifications page with filtering, pagination, and delete functionality.
 */

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, MessageSquare, Package, Trash2, CheckCheck } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

type NotificationType = "all" | "message" | "order";

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const [filter, setFilter] = useState<NotificationType>(
    (searchParams.get("type") as NotificationType) || "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const itemsPerPage = 20;

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    return notif.type === filter;
  });

  // Paginate
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Update URL when filter changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") {
      params.set("type", filter);
    }
    const newUrl = params.toString()
      ? `/account/notifications?${params.toString()}`
      : "/account/notifications";
    router.replace(newUrl);
  }, [filter, router]);

  const handleFilterChange = (newFilter: NotificationType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingIds((prev) => new Set(prev).add(id));
    await deleteNotification(id);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare size={20} className="text-blue-500" />;
      case "order":
        return <Package size={20} className="text-green-500" />;
      default:
        return <Bell size={20} className="text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Notifications
          </h1>
          <p className="text-slate-600">
            Stay updated with your orders and messages
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => handleFilterChange("message")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "message"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Messages (
                {notifications.filter((n) => n.type === "message").length})
              </button>
              <button
                onClick={() => handleFilterChange("order")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "order"
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Orders ({notifications.filter((n) => n.type === "order").length}
                )
              </button>
            </div>

            {/* Mark All Read */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {paginatedNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Bell size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No notifications
            </h3>
            <p className="text-slate-600">
              {filter === "all"
                ? "You're all caught up! No new notifications."
                : `No ${filter} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white rounded-lg shadow-sm border transition-all cursor-pointer group ${
                  !notif.read
                    ? "border-blue-200 bg-blue-50/30"
                    : "border-slate-200 hover:border-slate-300"
                } ${deletingIds.has(notif.id) ? "opacity-50" : ""}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          {notif.title}
                          {!notif.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </h3>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm">{notif.message}</p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      disabled={deletingIds.has(notif.id)}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
