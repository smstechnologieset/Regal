/**
 * Input Component
 * 
 * Reusable form input with label, error state, and icon support.
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-all duration-200',
                            'placeholder:text-slate-400',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            error
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {(error || helperText) && (
                    <p
                        className={cn(
                            'mt-1.5 text-sm',
                            error ? 'text-red-600' : 'text-slate-500'
                        )}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
