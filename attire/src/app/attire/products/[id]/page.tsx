'use client';

/**
 * Product Detail Page
 * 
 * Displays full product information with image gallery, selectors, and add to cart.
 * Includes related products section.
 */

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Star,
    Heart,
    Share2,
    Truck,
    RefreshCw,
    ShieldCheck,
    ChevronRight,
    Minus,
    Plus,
    X,
    ShoppingBag
} from 'lucide-react';
import { Product } from '@/types';
import { getProductById, getRelatedProducts } from '@/lib/api';
import ImageGallery from '@/components/product/ImageGallery';
import SizeSelector from '@/components/product/SizeSelector';
import ColorSelector from '@/components/product/ColorSelector';
import ProductCard from '@/components/product/ProductCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { useApp } from '@/context/AppContext';
import { formatPrice, calculateDiscount, cn } from '@/lib/utils';

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<Product['colors'][0] | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const { addToCart, toggleCart } = useCart();
    const { addToast } = useApp();

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const productData = await getProductById(id);
                if (!productData) {
                    router.push('/404');
                    return;
                }
                setProduct(productData);

                // Set default selections
                if (productData.colors.length > 0) {
                    setSelectedColor(productData.colors[0]);
                }

                // Fetch related products
                const related = await getRelatedProducts(id, 4);
                setRelatedProducts(related);
            } catch (error) {
                console.error('Error fetching product:', error);
                addToast('Failed to load product', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, router, addToast]);

    // Handle add to cart
    const handleAddToCart = () => {
        if (!product || !selectedSize || !selectedColor) {
            addToast('Please select size and color', 'warning');
            return;
        }

        addToCart(product, selectedSize, selectedColor, quantity);
        addToast(`${product.name} added to cart!`, 'success');
        toggleCart();
    };

    // Handle buy now
    const handleBuyNow = () => {
        if (!product || !selectedSize || !selectedColor) {
            addToast('Please select size and color', 'warning');
            return;
        }

        addToCart(product, selectedSize, selectedColor, quantity);
        router.push('/attire/checkout');
    };

    // Quick add for related products
    const handleQuickAdd = (relatedProduct: Product) => {
        if (relatedProduct.sizes[0] && relatedProduct.colors[0]) {
            addToCart(relatedProduct, relatedProduct.sizes[0], relatedProduct.colors[0], 1);
            addToast(`${relatedProduct.name} added to cart!`, 'success');
            toggleCart();
        }
    };

    if (loading) {
        return <ProductDetailSkeleton />;
    }

    if (!product) {
        return null;
    }

    const discount = product.originalPrice
        ? calculateDiscount(product.originalPrice, product.price)
        : 0;

    return (
        <div className="min-h-screen bg-white">
            {/* Breadcrumb */}
            <div className="bg-slate-50 border-b border-slate-200">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/attire" className="text-slate-500 hover:text-slate-900">
                            Home
                        </Link>
                        <ChevronRight size={14} className="text-slate-400" />
                        <Link href="/attire/products" className="text-slate-500 hover:text-slate-900">
                            Products
                        </Link>
                        <ChevronRight size={14} className="text-slate-400" />
                        <Link
                            href={`/attire/products?category=${product.category}`}
                            className="text-slate-500 hover:text-slate-900 capitalize"
                        >
                            {product.category}
                        </Link>
                        <ChevronRight size={14} className="text-slate-400" />
                        <span className="text-slate-900 font-medium truncate max-w-[200px]">
                            {product.name}
                        </span>
                    </nav>
                </div>
            </div>

            {/* Product Section */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div className="relative">
                        <ImageGallery images={product.images} productName={product.name} />
                        {discount > 0 && product.inStock && (
                            <div className="absolute top-4 right-4 z-10">
                                <span className="bg-rose-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                    -{discount}% OFF
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="lg:py-4">
                        {/* Badges */}
                        {product.badges.length > 0 && (
                            <div className="flex gap-2 mb-4">
                                {product.badges.map((badge) => (
                                    <Badge key={badge} type={badge} size="md" />
                                ))}
                            </div>
                        )}

                        {/* Title & Rating */}
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                            {product.name}
                        </h1>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className={cn(
                                            i < Math.floor(product.rating)
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-slate-300'
                                        )}
                                    />
                                ))}
                                <span className="ml-1 text-sm font-medium text-slate-700">
                                    {product.rating}
                                </span>
                            </div>
                            <span className="text-sm text-slate-500">
                                {product.reviewCount} reviews
                            </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl font-bold text-slate-900">
                                {formatPrice(product.price)}
                            </span>
                            {product.originalPrice && (
                                <>
                                    <span className="text-xl text-slate-400 line-through">
                                        {formatPrice(product.originalPrice)}
                                    </span>
                                    <span className="px-2 py-1 bg-rose-100 text-rose-600 text-sm font-semibold rounded">
                                        -{discount}%
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Color Selector */}
                        <div className="mb-6">
                            <ColorSelector
                                colors={product.colors}
                                selectedColor={selectedColor}
                                onSelect={setSelectedColor}
                            />
                        </div>

                        {/* Size Selector */}
                        <div className="mb-6">
                            <SizeSelector
                                sizes={product.sizes}
                                selectedSize={selectedSize}
                                onSelect={setSelectedSize}
                            />
                        </div>

                        {/* Quantity */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                Quantity
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                    disabled={quantity <= 1}
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 h-10 text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    min="1"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Stock Status & Urgency */}
                        <div className="mb-6">
                            {!product.inStock || (product.stockCount ?? 0) <= 0 ? (
                                <div className="flex items-center gap-2 text-rose-600 font-semibold bg-rose-50 px-3 py-2 rounded-lg w-fit">
                                    <X size={18} />
                                    <span>Out of Stock</span>
                                </div>
                            ) : (product.stockCount ?? 0) <= 10 ? (
                                <div className="flex items-center gap-2 text-amber-600 font-bold bg-amber-50 px-3 py-2 rounded-lg w-fit animate-pulse">
                                    <ShoppingBag size={18} />
                                    <span>Only {product.stockCount} left! - Order soon</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                    <ShieldCheck size={18} />
                                    <span>In Stock ({product.stockCount} available)</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-8">
                            <Button
                                fullWidth
                                size="lg"
                                variant="secondary"
                                onClick={handleAddToCart}
                                disabled={!product.inStock || (product.stockCount ?? 0) <= 0}
                            >
                                Add to Cart
                            </Button>
                            <Button
                                fullWidth
                                size="lg"
                                onClick={handleBuyNow}
                                disabled={!product.inStock || (product.stockCount ?? 0) <= 0}
                            >
                                Buy Now
                            </Button>
                            <button
                                onClick={() => setIsWishlisted(!isWishlisted)}
                                className={cn(
                                    'flex-shrink-0 w-12 h-12 flex items-center justify-center border rounded-lg transition-colors',
                                    isWishlisted
                                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                                )}
                            >
                                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className="text-center">
                                <Truck size={20} className="mx-auto mb-1 text-slate-600" />
                                <span className="text-xs text-slate-600">Free Shipping</span>
                            </div>
                            <div className="text-center">
                                <RefreshCw size={20} className="mx-auto mb-1 text-slate-600" />
                                <span className="text-xs text-slate-600">30-Day Returns</span>
                            </div>
                            <div className="text-center">
                                <ShieldCheck size={20} className="mx-auto mb-1 text-slate-600" />
                                <span className="text-xs text-slate-600">Secure Payment</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16 pt-12 border-t border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">
                            You May Also Like
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                    onQuickAdd={handleQuickAdd}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

/**
 * Loading skeleton for product detail page
 */
function ProductDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image skeleton */}
                <div className="aspect-[3/4] bg-slate-200 rounded-xl animate-pulse" />

                {/* Content skeleton */}
                <div className="space-y-4">
                    <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-6 w-1/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-10 w-1/3 bg-slate-200 rounded animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2 pt-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="w-12 h-10 rounded bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                    <div className="flex gap-3 pt-6">
                        <div className="flex-1 h-12 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="flex-1 h-12 bg-slate-200 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
