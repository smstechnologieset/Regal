/**
 * Admin Orders Page
 * 
 * Server component wrapper with Suspense for client component.
 */

import { Suspense } from 'react';
import AdminOrdersClient from './AdminOrdersClient';

export const dynamic = 'force-dynamic';

function OrdersLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={<OrdersLoading />}>
            <AdminOrdersClient />
        </Suspense>
    );
}
