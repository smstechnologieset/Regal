"use client";

/**
 * Product Detail Page
 *
 * Displays full product information with image gallery, selectors, and add to cart.
 * Includes related products section.
 */

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ShoppingBag,
} from "lucide-react";
import { Product } from "@/types";
import { getProductById, getRelatedProducts } from "@/lib/api";
import ImageGallery from "@/components/product/ImageGallery";
import SizeSelector from "@/components/product/SizeSelector";
import ColorSelector from "@/components/product/ColorSelector";
import ProductCard from "@/components/product/ProductCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PreOrderButton from "@/components/attire/PreOrderButton";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";
import { isEligibleForPreOrder } from "@/lib/utils/preorderHelpers";

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
  const [selectedColor, setSelectedColor] = useState<
    Product["colors"][0] | null
  >(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addToCart, toggleCart } = useCart();
  const { addToast } = useApp();
  const { isAmharic } = useLanguage();

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const productData = await getProductById(id);
        if (!productData) {
          router.push("/404");
          return;
        }
        setProduct(productData);

        // Set default selections
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }

        // Fetch related products
        const related = await getRelatedProducts(id, 4);
        setRelatedProducts(related);
      } catch (error) {
        console.error("Error fetching product:", error);
        addToast("Failed to load product", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router, addToast]);

  // Live reload if admin modifies product properties (e.g. pre-order, stock)
  useEffect(() => {
    const handleUpdate = async () => {
      const updated = await getProductById(id);
      if (updated) setProduct(updated);
    };
    window.addEventListener("regal_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("regal_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [id]);

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;
    const isOut = !product.inStock || (product.stockCount ?? 0) <= 0;
    if (isOut && !product.allowPreorder) {
      addToast(
        isAmharic ? "ይህ ምርት በአሁኑ ጊዜ አልቋል" : "This product is currently out of stock",
        "warning"
      );
      return;
    }

    if (product.sizes?.length > 0 && !selectedSize) {
      addToast(
        isAmharic ? "እባክዎን መጠን ይምረጡ" : "Please select a size",
        "warning"
      );
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      addToast(
        isAmharic ? "እባክዎን ቀለም ይምረጡ" : "Please select a color",
        "warning"
      );
      return;
    }

    const size = selectedSize || product.sizes?.[0] || "Standard";
    const color =
      selectedColor ||
      product.colors?.[0] || { name: "Default", hex: "#000000" };
    const isPreorder = isEligibleForPreOrder(product);

    addToCart(product, size, color, quantity, isPreorder);
    addToast(
      isPreorder
        ? isAmharic
          ? `${product.name} ለቅድመ-ትዕዛዝ ታክሏል!`
          : `${product.name} added to cart as pre-order!`
        : isAmharic
        ? `${product.name} ወደ ቅርጫት ታክሏል!`
        : `${product.name} added to cart!`,
      "success"
    );
    toggleCart();
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (!product) return;
    const isOut = !product.inStock || (product.stockCount ?? 0) <= 0;
    if (isOut && !product.allowPreorder) {
      addToast(
        isAmharic ? "ይህ ምርት በአሁኑ ጊዜ አልቋል" : "This product is currently out of stock",
        "warning"
      );
      return;
    }

    if (product.sizes?.length > 0 && !selectedSize) {
      addToast(
        isAmharic ? "እባክዎን መጠን ይምረጡ" : "Please select a size",
        "warning"
      );
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      addToast(
        isAmharic ? "እባክዎን ቀለም ይምረጡ" : "Please select a color",
        "warning"
      );
      return;
    }

    const size = selectedSize || product.sizes?.[0] || "Standard";
    const color =
      selectedColor ||
      product.colors?.[0] || { name: "Default", hex: "#000000" };
    const isPreorder = isEligibleForPreOrder(product);

    addToCart(product, size, color, quantity, isPreorder);
    router.push("/attire/checkout");
  };

  // Quick add for related products
  const handleQuickAdd = (relatedProduct: Product) => {
    const size = relatedProduct.sizes?.[0] || "Standard";
    const color =
      relatedProduct.colors?.[0] || { name: "Default", hex: "#000000" };
    const isPreorder = isEligibleForPreOrder(relatedProduct);

    addToCart(relatedProduct, size, color, 1, isPreorder);
    addToast(
      isPreorder
        ? isAmharic
          ? `${relatedProduct.name} ለቅድመ-ትዕዛዝ ታክሏል!`
          : `${relatedProduct.name} added to pre-orders!`
        : isAmharic
        ? `${relatedProduct.name} ወደ ቅርጫት ታክሏል!`
        : `${relatedProduct.name} added to cart!`,
      "success"
    );
    toggleCart();
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

  const storeRoute =
    product.category === "skincare"
      ? { href: "/skincare", label: "Skincare", labelAm: "የቆዳ እንክብካቤ" }
      : product.category === "toys"
      ? { href: "/toys", label: "Toys", labelAm: "የልጆች መጫወቻዎች" }
      : product.category === "journals"
      ? { href: "/journals", label: "Journals", labelAm: "የማስታወሻ ደብተሮች" }
      : { href: "/attire", label: "Attire", labelAm: "ልብስ" };

  const isOutOfStockWithoutPreorder =
    (!product.inStock || (product.stockCount ?? 0) <= 0) &&
    !product.allowPreorder;

  return (
    <div className="min-h-screen bg-[#F9F8F6] w-full max-w-full overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="bg-[#F4EFEA]/80 border-b border-[#E5DFD7] w-full overflow-x-hidden">
        <div className="container mx-auto px-3 sm:px-4 py-3 max-w-7xl">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap">
            <Link
              href={storeRoute.href}
              className="text-slate-500 hover:text-[#1E3A8A] shrink-0"
            >
              {isAmharic ? storeRoute.labelAm : storeRoute.label}
            </Link>
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
            <span className="text-[#111827] font-medium truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 w-full max-w-full min-w-0">
          {/* Image Gallery Column */}
          <div className="relative w-full max-w-full min-w-0">
            <ImageGallery images={product.images} productName={product.name} />
            {discount > 0 && product.inStock && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                <span className="bg-rose-600 text-white text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-md">
                  -{discount}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Product Info Column */}
          <div className="lg:py-2 w-full max-w-full min-w-0 flex flex-col">
            {/* Badges */}
            {product.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                {product.badges.map((badge) => (
                  <Badge key={badge} type={badge} size="sm" />
                ))}
              </div>
            )}

            {/* Title & Rating */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111827] mb-2 sm:mb-3 break-words font-serif leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4 flex-wrap text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className={cn(
                      i < Math.floor(product.rating)
                        ? "text-[#D4AF37] fill-[#D4AF37]"
                        : "text-slate-300"
                    )}
                  />
                ))}
                <span className="ml-1 font-semibold text-slate-700">
                  {product.rating}
                </span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                {product.reviewCount} {isAmharic ? "ግምገማዎች" : "reviews"}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2.5 sm:gap-3 mb-5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-[#1E3A8A]">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-base sm:text-xl text-slate-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs sm:text-sm font-semibold rounded-md">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-600 mb-5 leading-relaxed text-xs sm:text-sm break-words">
              {product.description}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <ColorSelector
                  colors={product.colors}
                  selectedColor={selectedColor}
                  onSelect={setSelectedColor}
                />
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <SizeSelector
                  sizes={product.sizes}
                  selectedSize={selectedSize}
                  onSelect={setSelectedSize}
                />
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <label className="block text-xs sm:text-sm font-semibold text-[#111827] mb-2">
                {isAmharic ? "ብዛት" : "Quantity"}
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                  disabled={quantity <= 1 || isOutOfStockWithoutPreorder}
                >
                  <Minus size={15} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  disabled={isOutOfStockWithoutPreorder}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-14 sm:w-16 h-9 sm:h-10 text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100 text-sm font-semibold"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStockWithoutPreorder}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Stock Status & Urgency */}
            <div className="mb-5">
              {isEligibleForPreOrder(product) ? (
                <div className="flex items-center gap-2 text-[#8C6D28] font-semibold bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl w-fit text-xs sm:text-sm">
                  <RefreshCw size={16} className="animate-spin text-[#8C6D28]" />
                  <span>
                    {isAmharic ? "ለቅድመ-ትዕዛዝ ይገኛል" : "Available for Pre-Order"}
                  </span>
                </div>
              ) : isOutOfStockWithoutPreorder ? (
                <div className="flex items-center gap-2 text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl w-fit text-xs sm:text-sm">
                  <X size={16} />
                  <span>{isAmharic ? "በአሁኑ ጊዜ አልቋል" : "Out of Stock"}</span>
                </div>
              ) : (product.stockCount ?? 0) <= 10 ? (
                <div className="flex items-center gap-2 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl w-fit text-xs sm:text-sm animate-pulse">
                  <ShoppingBag size={16} />
                  <span>
                    {isAmharic
                      ? `ቀሪ ${product.stockCount} ብቻ! - ፈጥነው ይዘዙ`
                      : `Only ${product.stockCount} left! - Order soon`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl w-fit text-xs sm:text-sm">
                  <ShieldCheck size={16} />
                  <span>
                    {isAmharic
                      ? `በክምችት ላይ ይገኛል (${product.stockCount})`
                      : `In Stock (${product.stockCount} available)`}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 w-full">
              {isEligibleForPreOrder(product) ? (
                <>
                  <div className="flex-1 min-w-0">
                    <PreOrderButton
                      product={product}
                      selectedSize={selectedSize}
                      selectedColor={selectedColor}
                      quantity={quantity}
                      fullWidth
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={cn(
                      "shrink-0 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border rounded-xl transition-colors cursor-pointer",
                      isWishlisted
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-slate-300 text-slate-600 hover:border-slate-400"
                    )}
                    aria-label="Wishlist"
                  >
                    <Heart
                      size={18}
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                </>
              ) : isOutOfStockWithoutPreorder ? (
                <>
                  <Button
                    fullWidth
                    size="md"
                    disabled
                    className="flex-1 bg-slate-200 text-slate-500 cursor-not-allowed border-transparent py-3 text-xs sm:text-sm"
                  >
                    {isAmharic ? "በአሁኑ ጊዜ አልቋል" : "Out of Stock"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={cn(
                      "shrink-0 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border rounded-xl transition-colors cursor-pointer",
                      isWishlisted
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-slate-300 text-slate-600 hover:border-slate-400"
                    )}
                    aria-label="Wishlist"
                  >
                    <Heart
                      size={18}
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                    <Button
                      fullWidth
                      size="md"
                      onClick={handleAddToCart}
                      className="bg-[#1E3A8A] hover:bg-[#172554] text-white font-medium py-3 px-2 sm:px-4 text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag size={15} className="shrink-0" />
                      <span className="truncate">{isAmharic ? "ወደ ቅርጫት" : "Add to Cart"}</span>
                    </Button>
                    <Button
                      fullWidth
                      size="md"
                      onClick={handleBuyNow}
                      className="bg-[#D4AF37] hover:bg-[#B4942E] text-[#111827] font-bold py-3 px-2 sm:px-4 text-xs sm:text-sm rounded-xl flex items-center justify-center"
                    >
                      <span className="truncate">{isAmharic ? "አሁን ይግዙ" : "Buy Now"}</span>
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={cn(
                      "shrink-0 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border rounded-xl transition-colors cursor-pointer",
                      isWishlisted
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-slate-300 text-slate-600 hover:border-slate-400"
                    )}
                    aria-label="Wishlist"
                  >
                    <Heart
                      size={18}
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                </>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-2xl border border-[#E5DFD7] w-full min-w-0">
              <div className="text-center min-w-0">
                <Truck size={18} className="mx-auto mb-1 text-slate-600" />
                <span className="text-[11px] sm:text-xs text-slate-600 block truncate">
                  {isAmharic ? "ነፃ መላኪያ" : "Free Shipping"}
                </span>
              </div>
              <div className="text-center min-w-0">
                <RefreshCw size={18} className="mx-auto mb-1 text-slate-600" />
                <span className="text-[11px] sm:text-xs text-slate-600 block truncate">
                  {isAmharic ? "30 ቀን ተመላሽ" : "30-Day Returns"}
                </span>
              </div>
              <div className="text-center min-w-0">
                <ShieldCheck
                  size={18}
                  className="mx-auto mb-1 text-slate-600"
                />
                <span className="text-[11px] sm:text-xs text-slate-600 block truncate">
                  {isAmharic ? "አስተማማኝ ክፍያ" : "Secure Payment"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E5DFD7]">
            <h2 className="text-2xl font-bold font-serif text-[#111827] mb-8">
              {isAmharic ? "ተመሳሳይ ምርቶች" : "You May Also Like"}
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
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"
              />
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-12 h-10 rounded bg-slate-200 animate-pulse"
              />
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
