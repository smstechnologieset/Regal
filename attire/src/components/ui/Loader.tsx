'use client';

import React from 'react';

/**
 * Loader Component
 * 
 * Animated speeder loader for page transitions and data fetching.
 */
const Loader = () => {
    return (
        <div className="relative w-full min-h-[140px] flex items-center justify-center overflow-hidden py-4">
            <div className="relative w-48 h-28 overflow-hidden flex items-center justify-center">
                <div className="loader">
                    <span>
                        <span /><span /><span /><span />
                    </span>
                    <div className="base">
                        <span />
                        <div className="face" />
                    </div>
                </div>
                <div className="longfazers">
                    <span /><span /><span /><span />
                </div>
            </div>
        </div>
    );
};

export default Loader;
