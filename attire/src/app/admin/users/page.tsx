"use client";

/**
 * Admin Users Management Page
 *
 * Full user management features:
 * - Search by name, email, or phone
 * - Create new user modal (email, password, name, phone, role)
 * - Ban / Unban users
 * - Delete user with confirmation modal
 * - Admin privilege toggle
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Shield,
  User,
  UserPlus,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

interface UserProfile {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  avatar_url?: string | null;
  isBanned?: boolean;
}

export default function AdminUsersPage() {
  const { addToast, showApiError } = useApp();
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create User Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Delete User Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw response;
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      showApiError(err, "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [showApiError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Toggle Admin Role
  const toggleUserRole = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, role: newRole }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
      addToast(
        `User role updated to ${newRole === "admin" ? "Admin" : "Standard User"}`,
        "success"
      );
    } catch (err: any) {
      console.error("Error updating user role:", err);
      showApiError(err, err.message || "Failed to update role");
    }
  };

  // Toggle Ban / Unban
  const toggleBanUser = async (targetUser: UserProfile) => {
    const newBanStatus = !targetUser.isBanned;
    const actionName = newBanStatus ? "ban" : "unban";

    if (!confirm(`Are you sure you want to ${actionName} this user?`)) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          isBanned: newBanStatus,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to ${actionName} user`);
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isBanned: newBanStatus } : u
        )
      );
      addToast(
        `User ${newBanStatus ? "banned" : "unbanned"} successfully`,
        "success"
      );
    } catch (err: any) {
      console.error(`Error ${actionName}ning user:`, err);
      showApiError(err, err.message || `Failed to ${actionName} user`);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create user");
      }

      addToast("User created successfully", "success");
      setCreateModalOpen(false);
      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "user",
      });
      await fetchUsers();
    } catch (err: any) {
      console.error("Error creating user:", err);
      showApiError(err, err.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userToDelete.id }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete user");
      }

      addToast("User deleted permanently", "success");
      setDeleteModalOpen(false);
      setUserToDelete(null);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    } catch (err: any) {
      console.error("Error deleting user:", err);
      showApiError(err, err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Users</h1>
          <p className="text-slate-600 text-sm">
            Manage user accounts, credentials, banning, and role privileges
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<UserPlus size={18} />}
          variant="primary"
          className="shadow-xs"
        >
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="all">All Roles</option>
            <option value="user">Standard Users</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-500 mt-4 text-sm">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-4">User</th>
                  <th className="text-left px-6 py-4">Contact</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Role</th>
                  <th className="text-left px-6 py-4">Joined</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCurrentSelf = currentAuthUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-[#F9F8F6] transition-colors ${
                        u.isBanned ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xs ${
                              u.role === "admin"
                                ? "bg-[#1E3A8A]"
                                : "bg-[#D4AF37]"
                            }`}
                          >
                            {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {u.full_name || "Unnamed User"}
                              {isCurrentSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold uppercase">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">
                              #{u.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="space-y-0.5 text-xs">
                          {u.email && (
                            <p className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Mail size={12} className="text-slate-400" />
                              {u.email}
                            </p>
                          )}
                          {u.phone ? (
                            <p className="flex items-center gap-1.5 text-slate-500">
                              <Phone size={12} className="text-slate-400" />
                              {u.phone}
                            </p>
                          ) : (
                            <span className="text-slate-400">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <Ban size={12} />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle size={12} />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role === "admin" ? (
                            <Shield size={12} />
                          ) : (
                            <User size={12} />
                          )}
                          {u.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Admin */}
                          {!isCurrentSelf && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleUserRole(u.id, u.role)}
                              className="text-xs px-2.5 py-1"
                            >
                              {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                            </Button>
                          )}

                          {/* Toggle Ban */}
                          {!isCurrentSelf && (
                            <button
                              onClick={() => toggleBanUser(u)}
                              title={u.isBanned ? "Unban User" : "Ban User"}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isBanned
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-amber-600 hover:bg-amber-50"
                              }`}
                            >
                              <Ban size={16} />
                            </button>
                          )}

                          {/* Delete User */}
                          {!isCurrentSelf && (
                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteModalOpen(true);
                              }}
                              title="Delete User Account"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No users found matching your criteria.
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-primary font-serif font-bold text-lg">
                <UserPlus size={20} />
                <span>Create New User</span>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sara Bekele"
                  value={createForm.full_name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, full_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+251 900 000 000"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-primary hover:bg-[#172554] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2 shadow-xs"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  Delete User Account?
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong>{userToDelete.full_name || userToDelete.email || "this user"}</strong>?
                  All associated profile data will be permanently wiped. This action cannot be undone.
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
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2 shadow-xs"
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
