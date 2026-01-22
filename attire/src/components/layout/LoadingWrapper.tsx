'use client';

import React, { useState, useEffect } from 'react';
import Loader from "@/components/ui/Loader";

/**
 * LoadingWrapper Component
 * 
 * Handles the initial mounting state of the application to show
 * the custom Loader during hydration.
 * Includes a small delay to ensure the loader is visible for a premium feel.
 */
export default function LoadingWrapper({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Add a small artificial delay to ensure the loader is visible 
        // and the transition isn't just a flicker.
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1600);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
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
