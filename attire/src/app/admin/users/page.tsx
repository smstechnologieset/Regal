'use client';

/**
 * Admin Users Management Page
 * 
 * Lists all users with filtering and management actions.
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Mail, Shield, User } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface UserProfile {
    id: string;
    full_name: string | null;
    phone: string | null;
    role: string;
    created_at: string;
    email?: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        async function fetchUsers() {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setUsers(data);
            }
            setLoading(false);
        }

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = !search ||
            user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.phone?.includes(search);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const toggleUserRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Users</h1>
                    <p className="text-slate-600">Manage user accounts and permissions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto"></div>
                        <p className="text-slate-500 mt-4">Loading users...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">User</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Phone</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Role</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Joined</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.full_name || 'Unknown'}</p>
                                                    <p className="text-sm text-slate-500">{user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {user.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleUserRole(user.id, user.role)}
                                            >
                                                {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No users found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
