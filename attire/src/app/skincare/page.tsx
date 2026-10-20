'use client';

/**
 * Pure Skincare & Body Care Storefront
 *
 * Route: /skincare
 * Manifesto: Your skin deserves the raw, gentle nourishment of the earth...
 */

import React from 'react';
import StorefrontView from '@/components/storefront/StorefrontView';

export default function SkincareStorefrontPage() {
  return (
    <StorefrontView
      serviceId="skincare"
      title="Pure Skincare & Body Care"
      titleAm="ንጹህ የቆዳ እና የሰውነት እንክብካቤ"
      tagline="Raw, Gentle Nourishment of the Earth"
      taglineAm="ከተፈጥሮ የተገኘ ያልተበረዘ እንክብካቤ"
      manifesto="Your skin deserves the raw, gentle nourishment of the earth. Formulated with unrefined botanicals and clean ingredients, our body care collection avoids harsh chemicals and synthetic additives, providing gentle, healthy care safe for sensitive skin and growing families."
      manifestoAm="ቆዳዎ የመሬቱን ያልተበረዘ የተፈጥሮ እንክብካቤ ይገባዋል። ከንጹህ እፅዋት ንጥረነገሮች የተዘጋጀው የሰውነት እንክብካቤ ስብስባችን ጎጂ ኬሚካሎችን ያስወግዳል፤ ለስሱ ቆዳ እና ለሚያድጉ ቤተሰቦች አስተማማኝ ነው።"
      heroImage="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1920&h=1080&fit=crop"
      subcategories={[
        { id: 'raw-butters', name: 'Raw Butters', nameAm: 'ያልተበረዙ ቅቤዎች' },
        { id: 'face-oils', name: 'Herbal Face & Body Oils', nameAm: 'የእፅዋት ዘይቶች' },
        { id: 'soaps', name: 'Artisan Soaps', nameAm: 'የእጅ ሳሙናዎች' },
        { id: 'balms', name: 'Rescue Balms', nameAm: 'የሰውነት ቅባቶች' },
        { id: 'mother-baby', name: 'Mother & Baby Care', nameAm: 'የእናት እና ህጻን' },
      ]}
      purityBadges={[
        { text: '100% Unrefined Botanicals', textAm: '100% ያልተበረዙ እፅዋት' },
        { text: 'Zero Synthetic Additives', textAm: 'ያለ ሰው ሰራሽ ኬሚካሎች' },
        { text: 'Safe for Sensitive Skin', textAm: 'ለስሱ ቆዳ አስተማማኝ' },
        { text: 'Cruelty-Free & Clean', textAm: 'ንጹህ እና ተፈጥሯዊ' },
      ]}
    />
  );
}
