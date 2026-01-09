/**
 * Admin Messages Page
 * 
 * Server component wrapper that forces dynamic rendering.
 */

export const dynamic = 'force-dynamic';

import AdminMessagesClient from './AdminMessagesClient';

export default function AdminMessagesPage() {
    return <AdminMessagesClient />;
}
