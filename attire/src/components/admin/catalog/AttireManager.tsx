"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import ImageUpload from "./ImageUpload";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  badges: string[];
  original_price: number | null;
  stock_count: number;
  in_stock: boolean;
  subcategory: string | null;
  categories?: { name: string };
  allow_preorder?: boolean;
  estimated_restock_date?: string | null;
  estimated_delivery_days?: number | null;
  preorder_count?: number;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  subcategories?: Subcategory[];
}

export default function AttireManager() {
  const { addToast, showApiError } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in_stock" | "out_of_stock" | "low_stock"
  >("all");
  const [saleFilter, setSaleFilter] = useState<"all" | "on_sale" | "regular">(
    "all"
  );
  const [highlightFilter, setHighlightFilter] = useState<
    "all" | "new" | "bestseller"
  >("all");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    sizes: [] as string[],
    colors: [] as { name: string; hex: string }[],
    in_stock: true,
    images: [] as string[],
    original_price: "",
    badges: [] as string[],
    stock_count: "0",
    allow_preorder: false,
    estimated_restock_date: "",
    estimated_delivery_days: "",
  });

  // Local input states for comma-separated fields
  const [sizeInput, setSizeInput] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#000000");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // ... existing fetchData logic
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/catalog/attire/products"),
        fetch("/api/admin/catalog/attire/categories"),
      ]);

      const pData = await pRes.json();
      const cData = await cRes.json();

      setProducts(pData.products || []);
      setCategories(cData.categories || []);
    } catch (error) {
      console.error("Error fetching attire data:", error);
      showApiError(error, "Failed to fetch catalog data");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const initialSizes = product.sizes || [];
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        category: product.category || "",
        subcategory: product.subcategory || "",
        sizes: initialSizes,
        colors: product.colors || [],
        in_stock: product.in_stock,
        images: product.images || [],
        original_price: product.original_price?.toString() || "",
        badges: product.badges || [],
        stock_count: product.stock_count?.toString() || "0",
        allow_preorder: product.allow_preorder || false,
        estimated_restock_date: product.estimated_restock_date || "",
        estimated_delivery_days:
          product.estimated_delivery_days?.toString() || "",
      });
      setSizeInput(initialSizes.join(", "));
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category: categories[0]?.id || "",
        subcategory: "",
        sizes: [],
        colors: [],
        in_stock: true,
        images: [],
        original_price: "",
        badges: [],
        stock_count: "0",
        allow_preorder: false,
        estimated_restock_date: "",
        estimated_delivery_days: "",
      });
      setSizeInput("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Stock consistency validation
    const stockCount = parseInt(formData.stock_count) || 0;
    if (stockCount > 0 && !formData.in_stock) {
      addToast(
        'Products with stock count > 0 must be marked as "In Stock"',
        "error"
      );
      return;
    }

    // Price consistency validation
    const price = parseFloat(formData.price) || 0;
    const originalPrice = formData.original_price
      ? parseFloat(formData.original_price)
      : null;
    if (originalPrice !== null && originalPrice <= price) {
      addToast(
        "Original Price must be greater than current Price to create a Sale",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const url = editingProduct
        ? `/api/admin/catalog/attire/products/${editingProduct.id}`
        : "/api/admin/catalog/attire/products";

      const response = await fetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          original_price: formData.original_price
            ? parseFloat(formData.original_price)
            : null,
          stock_count: parseInt(formData.stock_count) || 0,
          estimated_delivery_days: formData.estimated_delivery_days
            ? parseInt(formData.estimated_delivery_days)
            : null,
          estimated_restock_date: formData.estimated_restock_date || null,
          id: editingProduct
            ? undefined
            : formData.name.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (!response.ok) throw response;

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      showApiError(error, "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(`/api/admin/catalog/attire/products/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw response;
      addToast("Product deleted successfully", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      showApiError(error, "Failed to delete product");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;
    const matchesSubcategory =
      !subcategoryFilter || product.subcategory === subcategoryFilter;

    const isOnSale = (product.original_price ?? 0) > product.price;
    const matchesSale =
      saleFilter === "all" ||
      (saleFilter === "on_sale" && isOnSale) ||
      (saleFilter === "regular" && !isOnSale);

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in_stock" &&
        product.in_stock &&
        product.stock_count > 0) ||
      (stockFilter === "out_of_stock" &&
        (!product.in_stock || product.stock_count <= 0)) ||
      (stockFilter === "low_stock" &&
        product.in_stock &&
        product.stock_count > 0 &&
        product.stock_count <= 10);

    const matchesHighlight =
      highlightFilter === "all" ||
      (highlightFilter === "new" && (product.badges || []).includes("new")) ||
      (highlightFilter === "bestseller" &&
        (product.badges || []).includes("bestseller"));

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSubcategory &&
      matchesSale &&
      matchesStock &&
      matchesHighlight
    );
  });

  const activeCategory = categories.find((c) => c.id === formData.category);
  const availableSubcategories = activeCategory?.subcategories || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs font-medium"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSubcategoryFilter("");
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs font-medium"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
          >
            <option value="all">Stock: All</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤10)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs font-medium"
            value={saleFilter}
            onChange={(e) => setSaleFilter(e.target.value as any)}
          >
            <option value="all">Sale: All</option>
            <option value="on_sale">On Sale</option>
            <option value="regular">Regular Price</option>
          </select>

          <select
            className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs font-medium"
            value={highlightFilter}
            onChange={(e) => setHighlightFilter(e.target.value as any)}
          >
            <option value="all">Badge: All</option>
            <option value="new">New Arrivals</option>
            <option value="bestseller">Best Sellers</option>
          </select>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap text-sm"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {(stockFilter !== "all" ||
        saleFilter !== "all" ||
        highlightFilter !== "all" ||
        categoryFilter !== "") && (
        <div className="flex items-center gap-2 flex-wrap pb-2">
          <span className="text-xs text-slate-400">Active Admin Filters:</span>
          {categoryFilter && (
            <FilterBadge
              label={`Category: ${categories.find((c) => c.id === categoryFilter)?.name}`}
              onClear={() => setCategoryFilter("")}
            />
          )}
          {stockFilter !== "all" && (
            <FilterBadge
              label={`Stock: ${stockFilter.replace("_", " ")}`}
              onClear={() => setStockFilter("all")}
            />
          )}
          {saleFilter !== "all" && (
            <FilterBadge
              label={`Sale: ${saleFilter === "on_sale" ? "Yes" : "No"}`}
              onClear={() => setSaleFilter("all")}
            />
          )}
          {highlightFilter !== "all" && (
            <FilterBadge
              label={`Badge: ${highlightFilter}`}
              onClear={() => setHighlightFilter("all")}
            />
          )}
          <button
            onClick={() => {
              setCategoryFilter("");
              setStockFilter("all");
              setSaleFilter("all");
              setHighlightFilter("all");
              setSearchTerm("");
            }}
            className="text-xs text-secondary hover:text-secondary/80 font-medium"
          >
            Reset All
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-300" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden group shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={() => handleOpenModal(product)}
                    className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-secondary"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.badges?.includes("new") && (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      NEW
                    </span>
                  )}
                  {product.badges?.includes("bestseller") && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      BEST SELLER
                    </span>
                  )}
                  {product.original_price &&
                    product.original_price > product.price && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                        SALE
                      </span>
                    )}
                </div>
                {!product.in_stock && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 pointer-events-none">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full px-2">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-primary truncate flex-1">
                    {product.name}
                  </h3>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-secondary">
                      ${product.price}
                    </span>
                    {product.original_price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ${product.original_price}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2 truncate capitalize">
                  {categories.find((c) => c.id === product.category)?.name ||
                    "General"}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap gap-1">
                    {product.sizes?.map((size) => (
                      <span
                        key={size}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded",
                      product.stock_count > 10
                        ? "bg-slate-100 text-slate-600"
                        : product.stock_count > 0
                          ? "bg-amber-100 text-amber-600"
                          : "bg-red-100 text-red-600"
                    )}
                  >
                    Stock: {product.stock_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Product Name
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Price ($)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Original Price ($){" "}
                    <span className="text-[10px] text-slate-400 ml-1">
                      (Optional - for Sale)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        original_price: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Stock Count
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={formData.stock_count}
                    onChange={(e) => {
                      const val = e.target.value;
                      const count = parseInt(val) || 0;
                      setFormData({
                        ...formData,
                        stock_count: val,
                        // Auto-check in_stock if count becomes > 0
                        in_stock: count > 0 ? true : formData.in_stock,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        subcategory: "",
                      })
                    }
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Subcategory
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:opacity-50"
                    value={formData.subcategory}
                    onChange={(e) =>
                      setFormData({ ...formData, subcategory: e.target.value })
                    }
                    disabled={!availableSubcategories.length}
                  >
                    <option value="">None</option>
                    {availableSubcategories.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Pre-Order Fields */}
                <div className="col-span-2 border-t border-slate-200 pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Pre-Order Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        Estimated Restock Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:opacity-50 disabled:bg-slate-50"
                        value={formData.estimated_restock_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimated_restock_date: e.target.value,
                          })
                        }
                        disabled={!formData.allow_preorder}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        Estimated Delivery Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 14"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:opacity-50 disabled:bg-slate-50"
                        value={formData.estimated_delivery_days}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimated_delivery_days: e.target.value,
                          })
                        }
                        disabled={!formData.allow_preorder}
                      />
                      <p className="text-xs text-slate-500">
                        Days after restock date
                      </p>
                    </div>
                    {editingProduct &&
                      editingProduct.preorder_count !== undefined &&
                      editingProduct.preorder_count > 0 && (
                        <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">
                              Current Pre-Orders:
                            </span>{" "}
                            {editingProduct.preorder_count}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Sizes (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="S, M, L, XL"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={sizeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSizeInput(val);
                      setFormData({
                        ...formData,
                        sizes: val
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      });
                    }}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Product Images
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.images.map((url, index) => (
                      <ImageUpload
                        key={index}
                        bucket="attire"
                        value={url}
                        onChange={(newUrl: string) => {
                          const newImages = [...formData.images];
                          if (newUrl) {
                            newImages[index] = newUrl;
                          } else {
                            newImages.splice(index, 1);
                          }
                          setFormData({ ...formData, images: newImages });
                        }}
                      />
                    ))}
                    {formData.images.length < 6 && (
                      <ImageUpload
                        bucket="attire"
                        onChange={(newUrl) => {
                          if (newUrl) {
                            setFormData({
                              ...formData,
                              images: [...formData.images, newUrl],
                            });
                          }
                        }}
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    First image will be used as the thumbnail. Max 6 images.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Or paste an image URL..."
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const url = input.value.trim();
                          if (url && formData.images.length < 6) {
                            setFormData({
                              ...formData,
                              images: [...formData.images, url],
                            });
                            input.value = "";
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement)
                          .previousElementSibling as HTMLInputElement;
                        const url = input.value.trim();
                        if (url && formData.images.length < 6) {
                          setFormData({
                            ...formData,
                            images: [...formData.images, url],
                          });
                          input.value = "";
                        }
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-200 text-sm"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Color Management */}
                <div className="col-span-2 space-y-3">
                  <label className="text-sm font-medium text-slate-700">
                    Available Colors
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-1 pr-2 py-1 rounded-full group"
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {color.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newColors = [...formData.colors];
                            newColors.splice(idx, 1);
                            setFormData({ ...formData, colors: newColors });
                          }}
                          className="p-0.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Midnight Blue)"
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        value={colorName}
                        onChange={(e) => setColorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        type="color"
                        className="w-10 h-8 p-0 border border-slate-200 rounded outline-none cursor-pointer"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!colorName.trim()) return;
                        setFormData({
                          ...formData,
                          colors: [
                            ...formData.colors,
                            { name: colorName.trim(), hex: colorHex },
                          ],
                        });
                        setColorName("");
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Add colors one by one with their name and pick a hex value.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="in_stock"
                    className="rounded border-slate-300 text-secondary focus:ring-rose-500"
                    checked={formData.in_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, in_stock: e.target.checked })
                    }
                  />
                  <label htmlFor="in_stock" className="text-sm text-slate-700">
                    In Stock
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_preorder"
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    checked={formData.allow_preorder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allow_preorder: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="allow_preorder"
                    className="text-sm text-amber-700 font-medium"
                  >
                    Allow Pre-Orders
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_new"
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={formData.badges.includes("new")}
                    onChange={(e) => {
                      const newBadges = e.target.checked
                        ? [...formData.badges, "new"]
                        : formData.badges.filter((b) => b !== "new");
                      setFormData({ ...formData, badges: newBadges });
                    }}
                  />
                  <label
                    htmlFor="is_new"
                    className="text-sm text-emerald-700 font-medium"
                  >
                    New Arrival
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_best_seller"
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    checked={formData.badges.includes("bestseller")}
                    onChange={(e) => {
                      const newBadges = e.target.checked
                        ? [...formData.badges, "bestseller"]
                        : formData.badges.filter((b) => b !== "bestseller");
                      setFormData({ ...formData, badges: newBadges });
                    }}
                  />
                  <label
                    htmlFor="is_best_seller"
                    className="text-sm text-amber-700 font-medium"
                  >
                    Best Seller
                  </label>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBadge({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
      {label}
      <button
        onClick={onClear}
        className="hover:text-secondary transition-colors"
      >
        <X size={10} />
      </button>
    </span>
  );
}
