'use client';

/**
 * Admin Layout
 * 
 * Wraps all /admin pages with sidebar navigation.
 * Only accessible to users with admin role.
 */

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Package,
    MessageSquare,
    Settings,
    ChevronDown,
    Menu,
    X,
    ShoppingBag,
    Calendar,
    Heart,
    UtensilsCrossed,
    LogOut,
    Home
} from 'lucide-react';
import { useAuth, Profile } from '@/context/AuthContext';

const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Catalog', href: '/admin/catalog', icon: ShoppingBag },
    { name: 'Categories', href: '/admin/catalog/categories', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    {
        name: 'Orders',
        href: '/admin/orders',
        icon: Package,
        children: [
            { name: 'All Orders', href: '/admin/orders' },
            { name: 'Attire', href: '/admin/orders?service=attire', icon: ShoppingBag },
            { name: 'Events', href: '/admin/orders?service=events', icon: Calendar },
            { name: 'Bridal', href: '/admin/orders?service=bridal', icon: Heart },
            { name: 'Catering', href: '/admin/orders?service=catering', icon: UtensilsCrossed },
        ]
    },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

function AdminSidebar({
    sidebarOpen,
    setSidebarOpen,
    pathname,
    profile,
    handleSignOut
}: {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    pathname: string;
    profile: Profile | null;
    handleSignOut: () => void;
}) {
    const searchParams = useSearchParams();
    const [ordersExpanded, setOrdersExpanded] = useState(pathname.includes('/admin/orders'));

    const currentPath = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');

    return (
        <>
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-50
                transform transition-transform duration-300 lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <Link href="/admin" className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
                            REGAL
                        </span>
                        <span className="text-xs bg-rose-600 px-2 py-0.5 rounded-full">Admin</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {profile?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{profile?.full_name || 'Admin'}</p>
                            <p className="text-xs text-slate-400">Administrator</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);

                        if (item.children) {
                            return (
                                <div key={item.name}>
                                    <button
                                        onClick={() => setOrdersExpanded(!ordersExpanded)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <item.icon size={20} />
                                            {item.name}
                                        </span>
                                        <ChevronDown size={16} className={`transition-transform ${ordersExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                    {ordersExpanded && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${currentPath === child.href
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    {child.icon && <child.icon size={16} />}
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-800 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                        <Home size={20} />
                        Back to Site
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

function SidebarFallback() {
    return (
        <aside className="fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 animate-pulse" />
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        // Use window.location.href for a full refresh to ensure all cookies and state are cleared
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-50">
                <button onClick={() => setSidebarOpen(true)} className="p-2">
                    <Menu size={24} />
                </button>
                <span className="font-bold text-lg">Admin Dashboard</span>
                <div className="w-10"></div>
            </header>

            <Suspense fallback={<SidebarFallback />}>
                <AdminSidebar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    pathname={pathname}
                    profile={profile}
                    handleSignOut={handleSignOut}
                />
            </Suspense>

            {/* Main Content */}
            <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
