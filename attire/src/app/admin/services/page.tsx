'use client';

/**
 * Admin Services Management Page
 *
 * Route: /admin/services
 * Provides switchboard toggle controls to turn services ON and OFF.
 */

import React from 'react';
import ServiceToggleManager from '@/components/admin/services/ServiceToggleManager';

export default function AdminServicesPage() {
  return (
    <div className="space-y-6">
      <ServiceToggleManager />
    </div>
  );
}
