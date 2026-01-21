'use client';

import React from 'react';

/**
 * Loader Component
 * 
 * A premium, animated loader used for initial page loads and 
 * data fetching states across the platform.
 * Styles are defined in globals.css for maximum compatibility.
 */
const Loader = () => {
    return (
        <div className="flex items-center justify-center min-h-[100px] w-full">
            <div className="loader-wrapper">
                <div className="loader" />
            </div>
        </div>
    );
}

export default Loader;
