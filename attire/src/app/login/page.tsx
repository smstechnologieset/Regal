"use client";

/**
 * Login Page
 *
 * Single login page for both users and admins.
 * After login, users go to /account, admins see "Access Dashboard" in their profile.
 */

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useApp();
  const {
    signIn,
    signInWithGoogle,
    signInWithTelegram,
    user,
    isAdmin,
    isLoading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [isTelegramStep, setIsTelegramStep] = useState(false);
  const [telegramCode, setTelegramCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const redirectParams = searchParams.get("redirect");
      if (redirectParams) {
        router.push(redirectParams);
        return;
      }

      // Default redirection based on role
      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    }
  }, [user, authLoading, isAdmin, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: typeof errors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setErrors({ general: error.message });
      setIsLoading(false);
      return;
    }

    addToast("Welcome back!", "success");

    // Redirection is handled by the useEffect once state updates
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    const { error } = await signInWithGoogle();

    if (error) {
      setErrors({ general: error.message });
      setIsGoogleLoading(false);
      return;
    }

    // If successful, user will be redirected to Google
    // No need to set loading false as page will redirect
  };

  const handleTelegramStart = () => {
    const sid = Math.random().toString(36).substring(7);
    setSessionId(sid);
    setIsTelegramStep(true);
    
    // Redirect to bot (In production this would be regal_platform_bot)
    // For now we use the user's bot placeholder
    window.open(`https://t.me/RegalPlatformBot?start=${sid}`, "_blank");
  };

  const handleTelegramVerify = async () => {
    setIsTelegramLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/telegram/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, code: telegramCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Automatically sign in with the returned credentials
      const { error } = await signInWithTelegram(data.email, data.password);

      if (error) {
        throw error;
      }

      addToast("Successfully logged in with Telegram!", "success");
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setIsTelegramLoading(false);
    }
  };

  // Don't render if already logged in
  if (user && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            <span className="text-secondary font-bold text-3xl">REGAL</span>
          </Link>
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* General Error */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={18} />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              leftIcon={<Mail size={18} />}
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-slate-900"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-secondary hover:text-secondary/80"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isTelegramStep}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Telegram Option */}
            {!isTelegramStep ? (
              <button
                type="button"
                onClick={handleTelegramStart}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#24A1DE] border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#24A1DE]/90 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0C5.324 0 0 5.324 0 11.944c0 6.62 5.324 11.944 11.944 11.944 6.621 0 11.944-5.324 11.944-11.944C23.888 5.324 18.565 0 11.944 0zm5.204 15.654l-1.383 6.444c-.1.45-.367.557-.745.344l-5.11-3.763-2.466 2.373c-.274.274-.503.504-.633.504l.363-5.148 9.38-8.47c.408-.363-.088-.564-.633-.195l-11.593 7.29-4.992-1.56c-1.085-.34-.112-1.085.226-1.222l19.504-7.514c.904-.326 1.696.216 1.442 1.45z"/>
                </svg>
                Continue with Telegram
              </button>
            ) : (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-sm font-semibold text-primary">Verification Code</p>
                  <p className="text-xs text-slate-500">Please enter the 6-digit code from Regal Bot</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={telegramCode}
                    onChange={(e) => setTelegramCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full max-w-[200px] text-center text-2xl tracking-[0.5em] font-bold py-2 border-2 border-primary/20 rounded-lg focus:border-primary focus:ring-0 outline-none"
                    placeholder="000000"
                  />
                </div>
                <Button 
                  fullWidth 
                  onClick={handleTelegramVerify} 
                  isLoading={isTelegramLoading}
                  disabled={telegramCode.length !== 6}
                >
                  Verify & Log In
                </Button>
                <button 
                  onClick={() => setIsTelegramStep(false)}
                  className="w-full text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sign Up & Legal Link */}
        <div className="text-center mt-6 space-y-4">
          <p className="text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-secondary hover:text-secondary/80 font-medium"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="hover:text-primary underline px-1">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:text-primary underline px-1">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
