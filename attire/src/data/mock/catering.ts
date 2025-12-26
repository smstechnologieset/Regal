export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number; // For individual items or per guest add-on
    category: 'appetizer' | 'main' | 'dessert' | 'drink' | 'station';
    dietary?: ('gf' | 'v' | 'vg' | 'df')[];
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

export const cateringPackages: CateringPackage[] = [
    {
        id: 'pkg-buffet-classic',
        name: 'Classic Buffet',
        description: 'A crowd-pleasing selection of international favorites served buffet style.',
        pricePerGuest: 45,
        minGuests: 30,
        includes: ['2 Appetizers', '3 Main Courses', '2 Sides', 'Dessert Station', 'Soft Drinks'],
        image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
    },
    {
        id: 'pkg-plated-gold',
        name: 'Gold Plated Service',
        description: 'Elegant 3-course sit-down dinner with table service.',
        pricePerGuest: 85,
        minGuests: 10,
        includes: ['Plated Salad/Soup', 'Choice of Entree', 'Plated Dessert', 'Coffee & Tea Service'],
        image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
    },
    {
        id: 'pkg-stations-royal',
        name: 'Royal Live Stations',
        description: 'Interactive cooking stations offering fresh sushi, carving, and pasta.',
        pricePerGuest: 110,
        minGuests: 50,
        includes: ['3 Live Stations', 'Roaming Canapés', 'Dessert Bar', 'Premium Mocktails'],
        image: 'https://images.unsplash.com/photo-1547924475-650f0980489c?w=800&h=600&fit=crop',
    },
];

export const menuItems: MenuItem[] = [
    {
        id: 'app-bruschetta',
        name: 'Heirloom Tomato Bruschetta',
        description: 'Toasted baguette with basil pesto, heirloom tomatoes, and balsamic glaze.',
        price: 0,
        category: 'appetizer',
        dietary: ['v', 'vg'],
        image: 'https://images.unsplash.com/photo-1572695157363-bc31c5d53163?w=600&fit=crop',
    },
    {
        id: 'main-salmon',
        name: 'Pan-Seared Salmon',
        description: 'Atlantic salmon with lemon butter sauce and asparagus.',
        price: 0,
        category: 'main',
        dietary: ['gf', 'df'],
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=600&fit=crop',
    },
    {
        id: 'main-steak',
        name: 'Filet Mignon',
        description: 'Tenderloin steak with rosemary reduction.',
        price: 0,
        category: 'main',
        dietary: ['gf'],
        image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&fit=crop',
    },
    {
        id: 'dessert-tiramisu',
        name: 'Classic Tiramisu',
        description: 'Espresso-soaked ladyfingers with mascarpone cream.',
        price: 0,
        category: 'dessert',
        dietary: ['v'],
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&fit=crop',
    },
];
