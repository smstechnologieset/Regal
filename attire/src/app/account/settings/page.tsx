'use client';

/**
 * Account Settings Page
 * 
 * Allows users to update their profile information.
 */

import React, { useState } from 'react';
import { User, Mail, Phone, Camera, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
    const { profile, user, updateProfile } = useAuth();
    const { addToast } = useApp();

    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaved(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await updateProfile({
            full_name: formData.full_name,
            phone: formData.phone,
        });

        if (error) {
            addToast(error.message, 'error');
        } else {
            addToast('Profile updated successfully!', 'success');
            setSaved(true);
        }

        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-primary">Account Settings</h1>
                <p className="text-slate-600">Manage your profile and preferences</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-primary">Profile Information</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {formData.full_name?.charAt(0) || 'U'}
                            </div>
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                        <div>
                            <p className="font-medium text-primary">Profile Photo</p>
                            <p className="text-sm text-slate-500">Click the camera icon to upload</p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Input
                            label="Full Name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Your name"
                            leftIcon={<User size={18} />}
                        />
                        <Input
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+251 912 345 678"
                            leftIcon={<Phone size={18} />}
                        />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email Address
                        </label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                            <Mail size={18} />
                            {user?.email}
                            <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                Cannot be changed
                            </span>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        {saved ? (
                            <span className="flex items-center gap-2 text-emerald-600 text-sm">
                                <CheckCircle size={18} />
                                Changes saved
                            </span>
                        ) : (
                            <span></span>
                        )}
                        <Button type="submit" isLoading={isLoading}>
                            <Save size={18} className="mr-2" />
                            Save Changes
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
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile?.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                            }`}>
                            {profile?.role === 'admin' ? 'Administrator' : 'Member'}
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
