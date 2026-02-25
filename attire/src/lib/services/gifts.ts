import { withRetry } from '../supabase/utils';

export interface GiftPackage {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    contents: string[];
    image: string | null;
    created_at?: string;
}

/**
 * Fetch all gift packages from the public API
 */
export async function getGiftPackages(): Promise<GiftPackage[]> {
    return withRetry(async () => {
        const response = await fetch('/api/gifts', {
            cache: 'no-store' // Ensure we get fresh data
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch gift packages');
        }
        
        const data = await response.json();
        return data.packages || [];
    });
}

/**
 * Fetch a single gift package (simulated from our public list since we only have a bulk API for now)
 */
export async function getGiftPackageById(id: string): Promise<GiftPackage | null> {
    const packages = await getGiftPackages();
    return packages.find(pkg => pkg.id === id) || null;
}
