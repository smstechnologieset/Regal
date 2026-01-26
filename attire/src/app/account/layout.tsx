"use client";

/**
 * Account Layout
 *
 * Wraps all /account pages with sidebar navigation.
 * Shows different options for regular users vs admins.
 */

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  Home
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

const userNavItems = [
  { name: "Overview", href: "/account", icon: User },
  { name: "My Orders", href: "/account/orders", icon: Package },
  { name: "Messages", href: "/account/messages", icon: MessageSquare },
  { name: "Settings", href: "/account/settings", icon: Settings },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut, isAdmin, user, isLoading } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = React.useState(0);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Use window.location.href for a full refresh to ensure all cookies and state are cleared
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
      // Force redirect anyway to clear UI
      window.location.href = "/";
    }
  };

  // Close sidebar on navigation
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoading && !user && !isLoggingOut) {
      router.push("/login?redirect=" + encodeURIComponent(pathname));
      return;
    }

    // If user is admin, they don't belong in the /account section
    if (!isLoading && user && isAdmin && !isLoggingOut) {
      router.push("/admin");
    }
  }, [user, isLoading, isAdmin, router, pathname, isLoggingOut]);

  // Fetch unread message count
  React.useEffect(() => {
    async function fetchUnreadCount() {
      if (!user) return;

      const supabase = getSupabaseClient();

      // Get all conversations for user
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id);

      if (!conversations || conversations.length === 0) {
        setUnreadMessageCount(0);
        return;
      }

      // Count unread messages across all conversations
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in(
          "conversation_id",
          conversations.map((c: { id: string }) => c.id)
        )
        .eq("read", false)
        .neq("sender_id", user.id);

      setUnreadMessageCount(count || 0);
    }

    fetchUnreadCount();

    // Set up real-time subscription for new messages
    if (user) {
      const supabase = getSupabaseClient();
      const channel = supabase
        .channel("unread-messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          () => {
            // Refetch count when messages change
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600">
          <Menu size={24} />
        </button>
        <span className="font-bold text-secondary tracking-tight">REGAL ACCOUNT</span>
        <div className="w-10"></div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0 lg:h-auto lg:bg-transparent lg:w-72 flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="bg-white lg:rounded-2xl shadow-xl lg:shadow-sm border-r lg:border border-slate-200 overflow-hidden sticky top-0 lg:top-24 h-full lg:h-auto">
              {/* Sidebar Header (Mobile Only) */}
              <div className="lg:hidden p-6 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-secondary">MENU</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                  <X size={20} />
                </button>
              </div>

              {/* User Info */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {profile?.full_name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary truncate">
                      {profile?.full_name || "User"}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">
                      {profile?.role === "admin" ? "Administrator" : "Member"}
                    </p>
                  </div>
                </div>

                {/* Admin Dashboard Link */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="mt-4 flex items-center justify-between p-3 bg-primary text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard size={18} />
                      Access Dashboard
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>

              {/* Navigation */}
              <nav className="p-4">
                <ul className="space-y-1">
                  {userNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                            ? "bg-rose-50 text-rose-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                            }`}
                        >
                          <item.icon size={20} />
                          <span className="flex-1">{item.name}</span>
                          {item.name === "Messages" && unreadMessageCount > 0 && (
                            <span className="bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {unreadMessageCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Bottom Actions */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    <Home size={20} />
                    Back to Home
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
