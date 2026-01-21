'use client';

/**
 * SortDropdown Component
 * 
 * Dropdown for sorting products by various criteria.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SortOption } from '@/types';
import { cn } from '@/lib/utils';

interface SortDropdownProps {
    value: SortOption;
    onChange: (option: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = sortOptions.find((opt) => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: SortOption) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
            >
                <span>Sort: {selectedOption?.label}</span>
                <ChevronDown
                    size={16}
                    className={cn('transition-transform', isOpen && 'rotate-180')}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-fade-in">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={cn(
                                'flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors',
                                value === option.value
                                    ? 'bg-slate-100 text-primary'
                                    : 'text-slate-700 hover:bg-slate-50'
                            )}
                        >
                            {option.label}
                            {value === option.value && (
                                <Check size={16} className="text-primary" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
