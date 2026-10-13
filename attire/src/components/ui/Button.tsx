/**
 * Button Component
 * 
 * Reusable button with multiple variants and sizes.
 * Supports loading state and icon placement.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantStyles = {
    primary: 'bg-primary text-[#FDFBF7] hover:bg-[#3D4D40] focus:ring-primary shadow-sm hover:shadow',
    secondary: 'bg-secondary text-[#2B2D2F] font-semibold hover:bg-[#B8944D] focus:ring-secondary shadow-sm hover:shadow',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-[#FDFBF7] focus:ring-primary',
    ghost: 'bg-transparent text-foreground hover:bg-[#F4EFEA] focus:ring-primary',
    danger: 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-700',
};

const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && 'w-full',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                leftIcon
            )}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
}
