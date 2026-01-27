'use client';

/**
 * Admin Settings Page
 * 
 * Allows administrators to update their email and reset their password.
 */

import React, { useState } from 'react';
import { User, Mail, Lock, Key, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
    const { profile, user, updateProfile } = useAuth();
    const { addToast } = useApp();
    const supabase = getSupabaseClient();

    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        email: user?.email || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [savedProfile, setSavedProfile] = useState(false);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSavedProfile(false);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingProfile(true);

        const { error } = await updateProfile({
            full_name: formData.full_name,
        });

        if (error) {
            addToast(error.message, 'error');
        } else {
            addToast('Profile updated successfully!', 'success');
            setSavedProfile(true);
        }

        setIsLoadingProfile(false);
    };

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || formData.email === user?.email) {
            addToast('Please enter a new email address', 'error');
            return;
        }

        setIsLoadingEmail(true);

        try {
            const { error } = await supabase.auth.updateUser({
                email: formData.email,
            });

            if (error) throw error;

            addToast('Confirmation email sent! Please check your inbox.', 'success');
        } catch (error: any) {
            addToast(error.message || 'Failed to update email', 'error');
        }

        setIsLoadingEmail(false);
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast('Passwords do not match', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            addToast('Password must be at least 6 characters', 'error');
            return;
        }

        setIsLoadingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword,
            });

            if (error) throw error;

            addToast('Password updated successfully!', 'success');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            addToast(error.message || 'Failed to update password', 'error');
        }

        setIsLoadingPassword(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-primary">Admin Settings</h1>
                <p className="text-slate-600">Manage your administrator account settings</p>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-primary">Profile Information</h2>
                </div>

                <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                            {formData.full_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="font-medium text-primary">{formData.full_name || 'Admin'}</p>
                            <p className="text-sm text-slate-500">Administrator</p>
                        </div>
                    </div>

                    {/* Full Name */}
                    <Input
                        label="Full Name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleProfileChange}
                        placeholder="Your name"
                        leftIcon={<User size={18} />}
                    />

                    {/* Save Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        {savedProfile ? (
                            <span className="flex items-center gap-2 text-emerald-600 text-sm">
                                <CheckCircle size={18} />
                                Changes saved
                            </span>
                        ) : (
                            <span></span>
                        )}
                        <Button type="submit" isLoading={isLoadingProfile}>
                            <Save size={18} className="mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>

            {/* Email Management */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-primary">Email Address</h2>
                    <p className="text-sm text-slate-500 mt-1">Update your login email address</p>
                </div>

                <form onSubmit={handleEmailUpdate} className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Email Verification Required</p>
                            <p>You'll need to confirm your new email address via a confirmation link sent to your inbox.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Current Email
                        </label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                            <Mail size={18} />
                            {user?.email}
                        </div>
                    </div>

                    <Input
                        label="New Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        placeholder="new.email@example.com"
                        leftIcon={<Mail size={18} />}
                    />

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button type="submit" isLoading={isLoadingEmail}>
                            <Mail size={18} className="mr-2" />
                            Update Email
                        </Button>
                    </div>
                </form>
            </div>

            {/* Password Reset */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-primary">Change Password</h2>
                    <p className="text-sm text-slate-500 mt-1">Update your account password</p>
                </div>

                <form onSubmit={handlePasswordReset} className="p-6 space-y-6">
                    <Input
                        label="New Password"
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        leftIcon={<Lock size={18} />}
                    />

                    <Input
                        label="Confirm New Password"
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        leftIcon={<Key size={18} />}
                    />

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button type="submit" isLoading={isLoadingPassword}>
                            <Lock size={18} className="mr-2" />
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-primary">Account Details</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <div>
                            <p className="font-medium text-primary">Account Type</p>
                            <p className="text-sm text-slate-500">Your account role</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                            Administrator
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-primary">Member Since</p>
                            <p className="text-sm text-slate-500">When you joined Regal</p>
                        </div>
                        <span className="text-slate-600">
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
