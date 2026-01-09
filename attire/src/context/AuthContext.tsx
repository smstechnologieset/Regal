'use client';

/**
 * Auth Context
 * 
 * Manages authentication state across the application.
 * Provides user session, profile, and auth methods.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface Profile {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isAdmin: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = getSupabaseClient();

    // Fetch user profile
    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            // PGRST116 means no rows were found, which is expected for new users for a split second
            if (error.code === 'PGRST116') {
                return null;
            }

            console.error('Database error fetching profile:', {
                code: error.code,
                message: error.message,
                userId,
                error // Logging the whole error object too
            });
            return null;
        }
        return data as Profile;
    }, [supabase]);

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (user) {
            const profileData = await fetchProfile(user.id);
            setProfile(profileData);
        }
    }, [user, fetchProfile]);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    const profileData = await fetchProfile(currentSession.user.id);
                    setProfile(profileData);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, newSession: Session | null) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    // Small delay to ensure DB trigger has finished if this is a fresh signup
                    const fetchWithRetry = async (id: string, retries = 3) => {
                        for (let i = 0; i < retries; i++) {
                            const data = await fetchProfile(id);
                            if (data) return data;
                            if (i < retries - 1) {
                                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                            }
                        }
                        return null;
                    };

                    if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
                        const profileData = await fetchWithRetry(newSession.user.id);
                        setProfile(profileData);
                    } else {
                        const profileData = await fetchProfile(newSession.user.id);
                        setProfile(profileData);
                    }
                } else {
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    // Sign in with email/password
    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    // Sign up with email/password
    const signUp = async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        // Profile is created automatically via database trigger
        return { error };
    };

    // Sign out
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Supabase signOut error:', error);
        } finally {
            // Always clear local state to prevent UI persistence
            setUser(null);
            setProfile(null);
            setSession(null);
        }
    };

    // Update profile
    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) {
            return { error: new Error('No user logged in') };
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (!error) {
            await refreshProfile();
        }

        return { error: error ? new Error(error.message) : null };
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        isLoading,
        isAdmin: profile?.role === 'admin',
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
