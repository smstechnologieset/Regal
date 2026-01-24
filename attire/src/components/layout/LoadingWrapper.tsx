'use client';

import React, { useState, useEffect } from 'react';
import Loader from "@/components/ui/Loader";
import { useApp } from '@/context/AppContext';

/**
 * LoadingWrapper Component
 * 
 * Handles the initial mounting state of the application to show
 * the custom Loader during hydration.
 * Includes a small delay to ensure the loader is visible for a premium feel.
 */
export default function LoadingWrapper({ children }: { children: React.ReactNode }) {
    const [timerDone, setTimerDone] = useState(false);
    const { isAppBootstrapReady } = useApp();

    useEffect(() => {
        // Essential visual delay (1.6s)
        const timer = setTimeout(() => {
            setTimerDone(true);
        }, 1600);

        return () => clearTimeout(timer);
    }, []);

    // App is "loading" if the visual timer hasn't finished OR the core data isn't ready
    const isLoading = !timerDone || !isAppBootstrapReady;

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
                <div className="flex flex-col items-center gap-4">
                    <Loader />
                    <span className="text-secondary font-bold tracking-[0.3em] text-sm md:text-base animate-pulse">
                        REGAL
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {children}
        </div>
    );
}
