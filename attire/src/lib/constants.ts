/**
 * Global application constants
 */

// Currency + shipping (all amounts in ETB)
export const CURRENCY = 'ETB';
// Orders at or above this subtotal ship free; otherwise SHIPPING_FEE applies.
export const FREE_SHIPPING_THRESHOLD = 2000;
export const SHIPPING_FEE = 150;

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const COLORS = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Gray', hex: '#6B7280' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Beige', hex: '#D4B896' },
    { name: 'Brown', hex: '#78350F' },
    { name: 'Green', hex: '#059669' },
    { name: 'Blue', hex: '#2563EB' },
];

export const EVENT_TYPES = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'social', label: 'Social Gathering' },
];

export const COMMON_FEATURES = [
    { id: 'photo', label: 'Photography', category: 'other' },
    { id: 'video', label: 'Videography', category: 'other' },
    { id: 'dj', label: 'DJ / Music', category: 'entertainment' },
    { id: 'live-band', label: 'Live Band', category: 'entertainment' },
    { id: 'flowers', label: 'Floral Decoration', category: 'decoration' },
    { id: 'lighting', label: 'Mood Lighting', category: 'decoration' },
    { id: 'cake', label: 'Custom Cake', category: 'catering' },
    { id: 'full-catering', label: 'Full Catering Service', category: 'catering' },
    { id: 'venue', label: 'Venue Booking', category: 'venue' },
];

export const CATERING_CATEGORIES = [
    { value: 'appetizer', label: 'Appetizers' },
    { value: 'main', label: 'Main Courses' },
    { value: 'dessert', label: 'Desserts' },
    { value: 'drink', label: 'Drinks' },
    { value: 'station', label: 'Live Stations' },
];

export const BRIDAL_SILHOUETTES = [
    'Ball Gown',
    'A-Line',
    'Mermaid',
    'Sheath',
    'Empire',
    'Mini',
];

export const GIFT_CATEGORIES = [
    { value: 'birthday', label: 'Birthday' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'partner', label: 'Partner/Anniversary' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'wedding', label: 'Wedding Gift' },
    { value: 'other', label: 'Other' }
];

