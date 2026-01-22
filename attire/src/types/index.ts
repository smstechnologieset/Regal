/**
 * Type definitions for the Attire e-commerce application
 * These types define the shape of data throughout the application
 * and ensure type safety when working with products, cart, and user data.
 */

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For sale items
  category: string;
  subcategory?: string;
  sizes: string[];
  colors: ProductColor[];
  images: string[];
  badges: ProductBadge[];
  rating: number;
  reviewCount: number;
  popularity: number; // For sorting
  createdAt: string; // ISO date string
  inStock: boolean;
  stockCount?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export type ProductBadge = 'new' | 'sale' | 'bestseller' | 'limited';

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: ProductColor;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

// Filter types
export interface FilterOptions {
  category?: string;
  subcategory?: string;
  sizes?: string[];
  colors?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  inStock?: boolean;
  onSale?: boolean;
  badges?: ProductBadge[];
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popularity';

// User types (for auth UI)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// Order types
export interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'cod'; // Cash on delivery
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

// API response types (for future backend integration)
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Event Types
export interface EventPackage {
  id: string;
  title: string;
  description: string;
  type: EventType;
  priceStart: number;
  features: string[];
  image: string;
  capacity?: string; // e.g., "50-100 guests"
  popular?: boolean;
}

export type EventType = 'wedding' | 'birthday' | 'corporate' | 'graduation' | 'social';

export interface EventRequest {
  id: string;
  userId?: string;
  eventType: EventType | 'custom';
  budget: number;
  guestCount: number;
  date: string;
  features: string[];
  name?: string;
  email?: string;
  phone?: string;
  details?: string;
  status: 'pending' | 'reviewing' | 'proposal_sent' | 'accepted' | 'rejected';
  createdAt: string;
}

export type FeatureOption = {
  id: string;
  label: string;
  category: 'venue' | 'catering' | 'decoration' | 'entertainment' | 'other';
};

// Bridal Types
export interface BridalGown {
  id: string;
  name: string;
  designer: string;
  style: string;
  silhouette: string;
  priceRent: number;
  priceBuy: number;
  sizes: string[];
  images: string[];
  description: string;
  isNew?: boolean;
}

export interface BridalService {
  id: string;
  title: string;
  description: string;
  priceStart: number;
  duration: string; // "2 hours"
  type: 'makeup' | 'hair' | 'full-styling' | 'fitting';
  image: string;
}

export interface BridalAccessory {
  id: string;
  name: string;
  category: 'veil' | 'jewelry' | 'headpiece' | 'shoes' | 'clutch';
  priceRent: number;
  priceBuy: number;
  images: string[];
  description: string;
  isNew?: boolean;
}

export interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

// Catering Types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'appetizer' | 'main' | 'dessert' | 'drink' | 'station';
  dietary?: string[];
  image: string;
}

export interface CateringPackage {
  id: string;
  name: string;
  description: string;
  pricePerGuest: number;
  minGuests: number;
  includes: string[];
  image: string;
}
