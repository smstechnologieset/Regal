"use client";

/**
 * Notification Dropdown Component
 *
 * Displays list of notifications in a dropdown panel.
 * Groups notifications by date and provides mark as read functionality.
 */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Package,
  Bell,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import type { Notification } from "@/context/NotificationContext";

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  // Group notifications by date
  const groupedNotifications = groupByDate(notifications.slice(0, 10));

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare size={18} className="text-blue-600" />;
      case "order_status":
        return <Package size={18} className="text-purple-600" />;
      default:
        return <Bell size={18} className="text-slate-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed left-4 right-4 top-30 md:absolute md:right-0 md:left-auto md:top-auto md:w-96 md:mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-primary">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="animate-spin w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600 mb-1">
              No notifications
            </p>
            <p className="text-xs text-slate-500">You're all caught up!</p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([dateGroup, notifs]) => (
            <div key={dateGroup}>
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {dateGroup}
                </p>
              </div>
              {notifs.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${!notification.read ? "bg-blue-50" : ""
                    }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                          className={`text-sm ${!notification.read ? "font-semibold text-primary" : "font-medium text-slate-700"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-100">
          <Link
            href="/account/notifications"
            onClick={onClose}
            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}

// Helper function to group notifications by date
function groupByDate(
  notifications: Notification[]
): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.created_at);
    const notifDay = new Date(
      notifDate.getFullYear(),
      notifDate.getMonth(),
      notifDate.getDate()
    );

    let group: string;
    if (notifDay.getTime() === today.getTime()) {
      group = "Today";
    } else if (notifDay.getTime() === yesterday.getTime()) {
      group = "Yesterday";
    } else if (notifDay >= thisWeek) {
      group = "This Week";
    } else {
      group = "Older";
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
  });

  return groups;
}
