'use client';

/**
 * Mindful Journals & Reflection Tools Storefront
 *
 * Route: /journals
 * Manifesto: Living with intention requires space to reflect...
 */

import React from 'react';
import StorefrontView from '@/components/storefront/StorefrontView';

export default function JournalsStorefrontPage() {
  return (
    <StorefrontView
      serviceId="journals"
      title="Mindful Journals & Reflection Tools"
      titleAm="አዕምሮን የሚያንጹ ማስታወሻዎች"
      tagline="Living with Intention & Quiet Reflection"
      taglineAm="በዓላማ መኖር እና ማሰላሰል"
      manifesto="Living with intention requires space to reflect. Our structured daily journals are designed to help you track habits, align your actions with your personal values, foster daily gratitude, and cultivate personal growth and inner peace."
      manifestoAm="በዓላማ መኖር ለማሰላሰል የተዘጋጀ ቦታ ይጠይቃል። የተዋቀሩ የቀን ማስታወሻዎቻችን ልማዶችን እንዲከታተሉ፣ ድርጊቶችዎን ከግል እሴቶችዎ ጋር እንዲያስተካክሉ እና ውስጣዊ ሰላምን እንዲያዳብሩ የተነደፉ ናቸው።"
      heroImage="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1920&h=1080&fit=crop"
      subcategories={[
        { id: 'daily-journals', name: 'Daily Reflection & Gratitude', nameAm: 'የዕለት ተዕለት ማስታወሻዎች' },
        { id: 'habit-trackers', name: 'Habit & Alignment Trackers', nameAm: 'የልማድ መከታተያዎች' },
        { id: 'motherhood', name: 'Motherhood Keepsakes', nameAm: 'የእናትነት ማስታወሻዎች' },
        { id: 'planners', name: 'Value Alignment Planners', nameAm: 'የዓላማ ማቀጃዎች' },
      ]}
      purityBadges={[
        { text: 'Archival Bamboo & Cotton Paper', textAm: 'ረጅም ጊዜ የሚቆይ ንጹህ ወረቀት' },
        { text: 'Linen & Genuine Leather Covers', textAm: 'የተልባ ጨርቅ እና የእውነተኛ ቆዳ ሽፋን' },
        { text: 'Guided Daily Values Alignment', textAm: 'እሴትን ያገናዘበ የቀን መመሪያ' },
        { text: 'Undated & Flexible Format', textAm: 'ቀን ያልተገደበበት ምቹ አቀራረብ' },
      ]}
    />
  );
}
