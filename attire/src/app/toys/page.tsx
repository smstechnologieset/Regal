'use client';

/**
 * Grounded Childhood Toys Storefront
 *
 * Route: /toys
 * Manifesto: We believe in preserving the sweetness and reality of childhood...
 */

import React from 'react';
import StorefrontView from '@/components/storefront/StorefrontView';

export default function ToysStorefrontPage() {
  return (
    <StorefrontView
      serviceId="toys"
      title="Grounded Childhood Toys"
      titleAm="ትሁት እና እውነተኛ የልጆች አሻንጉሊቶች"
      tagline="Preserving the Sweetness & Reality of Childhood"
      taglineAm="የልጅነትን ጣፋጭነት እና እውነታ መጠበቅ"
      manifesto="We believe in preserving the sweetness and reality of childhood. Our modest, realistic dolls are designed without exaggerated features or modern makeup, wearing classic full-coverage clothing. They offer children a grounded reflection of real beauty, fostering healthy self-acceptance and quiet self-worth."
      manifestoAm="የልጅነትን ጣፋጭነት እና እውነታ በመጠበቅ እናምናለን። ልከኛ እና እውነተኛ አሻንጉሊቶቻችን ያለተጋነነ ውበት ወይም ዘመናዊ ሜካፕ የተሰሩ ሲሆኑ ሙሉ ሽፋን ያላቸው ክላሲክ ልብሶችን ይለብሳሉ። ለልጆች የእውነተኛ ውበት ነጸብራቅ በመስጠት ጤናማ ራስን መቀበልን ያዳብራሉ።"
      heroImage="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&h=1080&fit=crop"
      subcategories={[
        { id: 'modest-dolls', name: 'Modest Heirloom Dolls', nameAm: 'ልከኛ የጨርቅ አሻንጉሊቶች' },
        { id: 'doll-clothing', name: 'Doll Wardrobes & Sets', nameAm: 'የአሻንጉሊት ልብሶች' },
        { id: 'wooden-toys', name: 'Natural Wooden Toys', nameAm: 'የእንጨት መጫወቻዎች' },
        { id: 'keepsakes', name: 'Heirloom Keepsakes', nameAm: 'የልጅነት ትዝታዎች' },
      ]}
      purityBadges={[
        { text: 'Modest & Realistic Features', textAm: 'ልከኛ እና እውነተኛ ገጽታ' },
        { text: 'Classic Full-Coverage Attire', textAm: 'ሙሉ ሽፋን ያለው ክላሲክ አለባበስ' },
        { text: 'Organic Cotton & Solid Wood', textAm: 'ኦርጋኒክ ጥጥ እና ንጹህ እንጨት' },
        { text: 'Nurturing Quiet Self-Worth', textAm: 'ጤናማ ራስን መቀበልን የሚያዳብር' },
      ]}
    />
  );
}
