'use client';

/**
 * FilterPanel Component
 * 
 * Sidebar filter panel for product listing page.
 * Includes category, size, color, and price range filters.
 */

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Category, FilterOptions } from '@/types';
import { SIZES, COLORS } from '@/data/mock/products';
import { SIZES } from '@/data/mock/products';
import { cn, formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface FilterPanelProps {
    categories: Category[];
    filters: FilterOptions;
    categories: Category[];
    onFilterChange: (filters: FilterOptions) => void;
    onClose?: () => void;
    isMobile?: boolean;
}

export default function FilterPanel({
    categories,
    filters,
    categories,
    onFilterChange,
    onClose,
    isMobile = false,
}: FilterPanelProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>([
        'category',
        'size',
        'price',
    ]);

    const toggleSection = (section: string) => {
        setExpandedSections((prev) =>
            prev.includes(section)
                ? prev.filter((s) => s !== section)
                : [...prev, section]
        );
    };

    const handleCategoryChange = (categorySlug: string) => {
        onFilterChange({
            ...filters,
            category: filters.category === categorySlug ? undefined : categorySlug,
            subcategory: undefined,
        });
    };

    const handleSubcategoryChange = (subcategorySlug: string) => {
        onFilterChange({
            ...filters,
            subcategory: filters.subcategory === subcategorySlug ? undefined : subcategorySlug,
        });
    };

    const handleSizeToggle = (size: string) => {
        const currentSizes = filters.sizes || [];
        const newSizes = currentSizes.includes(size)
            ? currentSizes.filter((s) => s !== size)
            : [...currentSizes, size];
        onFilterChange({
            ...filters,
            sizes: newSizes.length > 0 ? newSizes : undefined,
        });
    };



    const handlePriceChange = (min: number, max: number) => {
        onFilterChange({
            ...filters,
            priceRange: { min, max },
        });
    };

    const clearAllFilters = () => {
        onFilterChange({});
    };

    const hasActiveFilters =
        filters.category ||
        (filters.sizes && filters.sizes.length > 0) ||
        filters.priceRange;

    return (
        <div className={cn('bg-white', isMobile && 'h-full overflow-y-auto')}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="text-sm text-rose-600 hover:text-rose-700"
                        >
                            Clear all
                        </button>
                    )}
                    {isMobile && onClose && (
                        <button onClick={onClose} className="p-1">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Category Filter */}
                <FilterSection
                    title="Category"
                    isExpanded={expandedSections.includes('category')}
                    onToggle={() => toggleSection('category')}
                >
                    <div className="space-y-2">
                        {categories.map((category) => (
                            <div key={category.id} className="space-y-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={filters.category === category.slug}
                                        onChange={() => handleCategoryChange(category.slug)}
                                        className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                                    />
                                    <span className={cn(
                                        "text-sm transition-colors",
                                        filters.category === category.slug ? "text-slate-900 font-medium" : "text-slate-700 group-hover:text-slate-900"
                                    )}>
                                        {category.name}
                                    </span>
                                </label>
                                
                                {/* Subcategories */}
                                {filters.category === category.slug && category.subcategories && category.subcategories.length > 0 && (
                                    <div className="ml-6 space-y-1 pt-1 pb-2 border-l border-slate-100 pl-4">
                                        {category.subcategories.map((sub) => (
                                            <label
                                                key={sub.slug}
                                                className="flex items-center gap-2 cursor-pointer group/sub"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={filters.subcategory === sub.slug}
                                                    onChange={() => handleSubcategoryChange(sub.slug)}
                                                    className="w-3.5 h-3.5 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                                                />
                                                <span className={cn(
                                                    "text-xs transition-colors",
                                                    filters.subcategory === sub.slug ? "text-slate-900 font-medium" : "text-slate-500 group-hover/sub:text-slate-700"
                                                )}>
                                                    {sub.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <label
                                key={category.id}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    checked={filters.category === category.slug}
                                    onChange={() => handleCategoryChange(category.slug)}
                                    className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                                />
                                <span className="text-sm text-slate-700">{category.name}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Size Filter */}
                <FilterSection
                    title="Size"
                    isExpanded={expandedSections.includes('size')}
                    onToggle={() => toggleSection('size')}
                >
                    <div className="flex flex-wrap gap-2">
                        {SIZES.map((size) => (
                            <button
                                key={size}
                                onClick={() => handleSizeToggle(size)}
                                className={cn(
                                    'min-w-[40px] h-9 px-2 text-sm font-medium rounded border transition-colors',
                                    filters.sizes?.includes(size)
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </FilterSection>



                {/* Price Filter */}
                <FilterSection
                    title="Price Range"
                    isExpanded={expandedSections.includes('price')}
                    onToggle={() => toggleSection('price')}
                >
                    <div className="space-y-3">
                        {[
                            { label: 'Under $50', min: 0, max: 50 },
                            { label: '$50 - $100', min: 50, max: 100 },
                            { label: '$100 - $200', min: 100, max: 200 },
                            { label: 'Over $200', min: 200, max: 999 },
                        ].map((range) => (
                            <label
                                key={range.label}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="price"
                                    checked={
                                        filters.priceRange?.min === range.min &&
                                        filters.priceRange?.max === range.max
                                    }
                                    onChange={() => handlePriceChange(range.min, range.max)}
                                    className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                                />
                                <span className="text-sm text-slate-700">{range.label}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* In Stock Filter */}
                <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.inStock === true}
                            onChange={(e) =>
                                onFilterChange({
                                    ...filters,
                                    inStock: e.target.checked ? true : undefined,
                                })
                            }
                            className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                        />
                        <span className="text-sm text-slate-700">In stock only</span>
                    </label>
                </div>
            </div>

            {/* Mobile apply button */}
            {isMobile && (
                <div className="sticky bottom-0 p-4 bg-white border-t border-slate-200">
                    <Button fullWidth onClick={onClose}>
                        Apply Filters
                    </Button>
                </div>
            )}
        </div>
    );
}

/**
 * Collapsible filter section
 */
function FilterSection({
    title,
    isExpanded,
    onToggle,
    children,
}: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-slate-200 pb-4">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full py-2 text-left"
            >
                <span className="font-medium text-slate-900">{title}</span>
                {isExpanded ? (
                    <ChevronUp size={18} className="text-slate-500" />
                ) : (
                    <ChevronDown size={18} className="text-slate-500" />
                )}
            </button>
            {isExpanded && <div className="pt-2">{children}</div>}
        </div>
    );
}
