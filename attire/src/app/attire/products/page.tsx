'use client';

/**
 * Product Listing Page
 * 
 * Displays all products with filtering, sorting, and search functionality.
 * Features responsive filter sidebar and product grid.
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { Product, Category, FilterOptions, SortOption } from '@/types';
import { getProducts, getCategories } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import FilterPanel from '@/components/filters/FilterPanel';
import SortDropdown from '@/components/filters/SortDropdown';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

function ProductsContent() {
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const { categories, categoriesLoading } = useApp();
    const [loading, setLoading] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);
    const [filters, setFilters] = useState<FilterOptions>({});
    const [sortOption, setSortOption] = useState<SortOption>('popularity');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const { addToCart, toggleCart } = useCart();
    const { addToast, searchQuery } = useApp();

    // Categories are now managed globally in AppContext

    // 2. Sync URL params to local state
    useEffect(() => {
        const category = searchParams.get('category');
        const subcategory = searchParams.get('subcategory');
        const filter = searchParams.get('filter');
        const sale = searchParams.get('sale');
        const sort = searchParams.get('sort');

        setFilters(prev => {
            const newFilters: FilterOptions = { ...prev };

            // 1. Category & Subcategory
            newFilters.category = category || undefined;
            newFilters.subcategory = subcategory || undefined;

            // 2. Highlights (Mutually exclusive sections from landing page)
            if (filter === 'new') {
                newFilters.badges = ['new'];
            } else if (filter === 'bestseller') {
                newFilters.badges = ['bestseller'];
            } else if (filter === null) {
                // Only clear if the parameter is explicitly missing from a new navigation
                newFilters.badges = undefined;
            }

            // 3. Sale status
            if (sale === 'true') {
                newFilters.onSale = true;
            } else if (sale === null) {
                newFilters.onSale = undefined;
            }

            // Only update if actually different to avoid unnecessary cycles
            const isDifferent =
                prev.category !== newFilters.category ||
                prev.subcategory !== newFilters.subcategory ||
                JSON.stringify(prev.badges) !== JSON.stringify(newFilters.badges) ||
                prev.onSale !== newFilters.onSale;

            return isDifferent ? newFilters : prev;
        });

        if (sort) {
            setSortOption(sort as SortOption);
        }
    }, [searchParams]);

    // 3. Fetch products whenever filters or sort changes
    useEffect(() => {
        const controller = new AbortController();
        console.log('Attire Products: performFetch triggered', { filters, sortOption });

        const performFetch = async () => {
            setLoading(true);
            try {
                console.log('Attire Products: fetching products...');
                const result = await getProducts(filters, sortOption, 1, 24, controller.signal);

                // If the signal was aborted, result will be a fallback/error from withRetry
                // but we should still double check if it's the one we wanted
                if (!controller.signal.aborted) {
                    console.log('Attire Products: fetch success', { count: result.data.length, total: result.total });
                    setProducts(result.data);
                    setTotalProducts(result.total);
                    setLoading(false);
                }
            } catch (error: any) {
                if (error?.name === 'AbortError' || controller.signal.aborted) {
                    console.log('Attire Products: fetch aborted');
                    return;
                }
                console.error('Attire Products: fetch error', error?.message || error);
                addToast('Failed to load products', 'error');
                setLoading(false);
            }
        };

        performFetch();

        return () => {
            console.log('Attire Products: cleanup (aborting fetch)');
            controller.abort();
        };
    }, [filters, sortOption, addToast]);

    // Filter products by search query (client-side)
    const displayedProducts = searchQuery
        ? products.filter(
            (p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products;

    // Quick add handler
    const handleQuickAdd = (product: Product) => {
        if (product.sizes[0] && product.colors[0]) {
            addToCart(product, product.sizes[0], product.colors[0], 1);
            addToast(`${product.name} added to cart!`, 'success');
            toggleCart();
        }
    };

    // Count active filters
    const activeFilterCount =
        (filters.category ? 1 : 0) +
        (filters.subcategory ? 1 : 0) +
        (filters.sizes?.length || 0) +
        (filters.priceRange ? 1 : 0) +
        (filters.onSale ? 1 : 0) +
        (filters.badges?.length || 0);

    return (
        <div className="min-h-screen bg-white">
            {/* Page Header */}
            <div className="bg-slate-50 border-b border-slate-200">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">
                        {filters.category
                            ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
                            : 'All Products'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                Loading...
                            </span>
                        ) : `${totalProducts} products`}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Desktop Filter Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <FilterPanel
                                categories={categories}
                                filters={filters}
                                onFilterChange={setFilters}
                            />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6">
                            {/* Mobile filter button */}
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-400 transition-colors"
                            >
                                <SlidersHorizontal size={18} />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Active filters (desktop) */}
                            <div className="hidden lg:flex items-center gap-2 flex-wrap">
                                {filters.category && (
                                    <FilterTag
                                        label={filters.category}
                                        onRemove={() => setFilters({ ...filters, category: undefined, subcategory: undefined })}
                                    />
                                )}
                                {filters.subcategory && (
                                    <FilterTag
                                        label={filters.subcategory}
                                        onRemove={() => setFilters({ ...filters, subcategory: undefined })}
                                    />
                                )}
                                {filters.sizes?.map((size) => (
                                    <FilterTag
                                        key={size}
                                        label={`Size: ${size}`}
                                        onRemove={() =>
                                            setFilters({
                                                ...filters,
                                                sizes: filters.sizes?.filter((s) => s !== size),
                                            })
                                        }
                                    />
                                ))}
                                {filters.onSale && (
                                    <FilterTag
                                        label="On Sale"
                                        onRemove={() => setFilters({ ...filters, onSale: undefined })}
                                    />
                                )}
                                {filters.badges?.map((badge) => (
                                    <FilterTag
                                        key={badge}
                                        label={badge === 'new' ? 'New Arrival' : 'Best Seller'}
                                        onRemove={() =>
                                            setFilters({
                                                ...filters,
                                                badges: filters.badges?.filter((b) => b !== badge),
                                            })
                                        }
                                    />
                                ))}
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={() => setFilters({})}
                                        className="text-sm text-secondary hover:text-secondary/80"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Sort dropdown */}
                            <SortDropdown value={sortOption} onChange={setSortOption} />
                        </div>

                        {/* Product Grid */}
                        {loading ? (
                            <ProductGridSkeleton count={12} />
                        ) : displayedProducts.length === 0 ? (
                            <EmptyState
                                title="No products found"
                                description="Try adjusting your filters or search terms."
                                onClear={() => setFilters({})}
                            />
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6">
                                {displayedProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onQuickAdd={handleQuickAdd}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div className="absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-white animate-slide-in-left">
                        <FilterPanel
                            categories={categories}
                            filters={filters}
                            onFilterChange={setFilters}
                            onClose={() => setShowMobileFilters(false)}
                            isMobile
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Wrap with Suspense for useSearchParams
export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8"><ProductGridSkeleton count={12} /></div>}>
            <ProductsContent />
        </Suspense>
    );
}

/**
 * Active filter tag component
 */
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
            {label}
            <button onClick={onRemove} className="hover:text-secondary">
                <X size={14} />
            </button>
        </span>
    );
}

/**
 * Empty state component
 */
function EmptyState({
    title,
    description,
    onClear,
}: {
    title: string;
    description: string;
    onClear: () => void;
}) {
    return (
        <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Filter size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
            <p className="text-slate-500 mb-6">{description}</p>
            <Button variant="outline" onClick={onClear}>
                Clear Filters
            </Button>
        </div>
    );
}
