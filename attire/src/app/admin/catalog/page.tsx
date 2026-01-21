import { Suspense } from 'react';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

function CatalogLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}

export default function AdminCatalogPage() {
    return (
        <Suspense fallback={<CatalogLoading />}>
            <CatalogClient />
        </Suspense>
    );
}
