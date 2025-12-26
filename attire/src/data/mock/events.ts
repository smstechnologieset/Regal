import { EventPackage, FeatureOption } from '@/types';

export const eventPackages: EventPackage[] = [
    // Wedding
    {
        id: 'wedding-classic',
        title: 'Classic Wedding',
        description: 'A beautiful and timeless wedding package perfect for intimate gatherings.',
        type: 'wedding',
        priceStart: 5000,
        features: ['Venue Decoration', 'Basic Catering', 'Photography (4 hours)', 'Sound System'],
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
        capacity: 'Up to 50 guests',
        popular: false,
    },
    {
        id: 'wedding-premium',
        title: 'Royal Wedding',
        description: 'An extravagant celebration with premium services for your special day.',
        type: 'wedding',
        priceStart: 15000,
        features: ['Luxury Venue Decor', 'Premium Catering (3-course)', 'Full Day Photography & Videography', 'Live Band', 'Bridal Suite'],
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
        capacity: '100-200 guests',
        popular: true,
    },

    // Birthday
    {
        id: 'birthday-kids',
        title: 'Magical Kids Party',
        description: 'Fun-filled celebration with games, entertainment, and kid-friendly treats.',
        type: 'birthday',
        priceStart: 800,
        features: ['Themed Decor', 'Magician/Clown', 'Face Painting', 'Snacks & Cake', 'Goodie Bags'],
        image: 'https://images.unsplash.com/photo-1530103862676-de3c9a59af57?w=800&h=600&fit=crop',
        capacity: 'Up to 30 kids',
    },
    {
        id: 'birthday-milestone',
        title: 'Milestone Celebration',
        description: 'Elegant party for 18th, 21st, 50th or any milestone birthday.',
        type: 'birthday',
        priceStart: 2000,
        features: ['Venue Setup', 'DJ/Music', 'Buffet Catering', 'Photography', 'Custom Cake'],
        image: 'https://images.unsplash.com/photo-1533294160622-d5fece760826?w=800&h=600&fit=crop',
        capacity: '50-100 guests',
        popular: true,
    },

    // Corporate
    {
        id: 'corp-conference',
        title: 'Business Conference',
        description: 'Professional setup for successful meetings and conferences.',
        type: 'corporate',
        priceStart: 3000,
        features: ['AV Equipment', 'Seating Arrangement', 'Coffee Breaks & Lunch', 'Stationery'],
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
        capacity: '50-200 attendees',
    },
    {
        id: 'corp-party',
        title: 'Company Gala',
        description: 'Annual dinner or appreciation party for employees and partners.',
        type: 'corporate',
        priceStart: 8000,
        features: ['Ballroom Venue', 'Gourmet Dinner', 'Entertainment', 'Awards Ceremony Setup'],
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
        capacity: '100+ attendees',
    },

    // Graduation
    {
        id: 'grad-party',
        title: 'Graduation Bash',
        description: 'Celebrate your academic achievement in style with family and friends.',
        type: 'graduation',
        priceStart: 1500,
        features: ['Photo Booth', 'DJ', 'Finger Foods', 'Decorations'],
        image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=600&fit=crop',
        capacity: '50 guests',
    },
];

export const commonFeatures: FeatureOption[] = [
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

export const eventTypes = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'social', label: 'Social Gathering' },
];
