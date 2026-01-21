'use client';

/**
 * Account Layout
 * 
 * Wraps all /account pages with sidebar navigation.
 * Shows different options for regular users vs admins.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    User,
    Package,
    MessageSquare,
    Settings,
    LogOut,
    LayoutDashboard,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const userNavItems = [
    { name: 'Overview', href: '/account', icon: User },
    { name: 'My Orders', href: '/account/orders', icon: Package },
    { name: 'Messages', href: '/account/messages', icon: MessageSquare },
    { name: 'Settings', href: '/account/settings', icon: Settings },
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

    const handleSignOut = async () => {
        try {
            setIsLoggingOut(true);
            await signOut();
            // Use window.location.href for a full refresh to ensure all cookies and state are cleared
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out failed:', error);
            // Force redirect anyway to clear UI
            window.location.href = '/';
        }
    };

    // Redirect if not logged in
    React.useEffect(() => {
        if (!isLoading && !user && !isLoggingOut) {
            router.push('/login?redirect=' + encodeURIComponent(pathname));
            return;
        }

        // If user is admin, they don't belong in the /account section
        if (!isLoading && user && isAdmin && !isLoggingOut) {
            router.push('/admin');
        }
    }, [user, isLoading, isAdmin, router, pathname, isLoggingOut]);

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
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                            {/* User Info */}
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                        {profile?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-primary truncate">
                                            {profile?.full_name || 'User'}
                                        </h3>
                                        <p className="text-sm text-slate-500 truncate">
                                            {profile?.role === 'admin' ? 'Administrator' : 'Member'}
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
                                                        ? 'bg-rose-50 text-rose-700'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                                                        }`}
                                                >
                                                    <item.icon size={20} />
                                                    {item.name}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Sign Out */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
                                    >
                                        <LogOut size={20} />
                                        Sign Out
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
