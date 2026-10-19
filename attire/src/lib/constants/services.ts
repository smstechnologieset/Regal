/**
 * Regal Platform Services Constants
 *
 * Defines the canonical list of Regal services, default active states,
 * routes, icons, and bilingual manifestos.
 */

export interface ServiceDefinition {
  id: string;
  nameKey: string;
  defaultName: string;
  nameAm: string;
  taglineKey: string;
  defaultTagline: string;
  taglineAm: string;
  manifesto?: string;
  manifestoAm?: string;
  href: string;
  defaultEnabled: boolean;
  iconName: 'Shirt' | 'Droplets' | 'Smile' | 'BookOpen' | 'UtensilsCrossed' | 'Gift' | 'Heart' | 'Calendar';
  isStore: boolean;
}

export const REGAL_SERVICES: ServiceDefinition[] = [
  {
    id: 'attire',
    nameKey: 'services.attireTitle',
    defaultName: 'Modest & Dignified Attire',
    nameAm: 'ልከኛ እና ክቡር አልባሳት',
    taglineKey: 'services.attireTagline',
    defaultTagline: 'Timeless silhouettes tailored with premium fabrics and modesty.',
    taglineAm: 'ክብርን እና ዉበትን ያገናዘቡ ጥራት ያላቸው አልባሳት።',
    href: '/attire',
    defaultEnabled: true,
    iconName: 'Shirt',
    isStore: true,
  },
  {
    id: 'skincare',
    nameKey: 'services.skincareTitle',
    defaultName: 'Pure Skincare & Body Care',
    nameAm: 'ንጹህ የቆዳ እና የሰውነት እንክብካቤ',
    taglineKey: 'services.skincareTagline',
    defaultTagline: 'Unrefined botanicals and clean ingredients safe for sensitive skin.',
    taglineAm: 'ከተፈጥሮ የተገኙ ንጹህ እና ያልተበረዙ ንጥረነገሮች።',
    manifesto: 'Your skin deserves the raw, gentle nourishment of the earth. Formulated with unrefined botanicals and clean ingredients, our body care collection avoids harsh chemicals and synthetic additives, providing gentle, healthy care safe for sensitive skin and growing families.',
    manifestoAm: 'ቆዳዎ የመሬቱን ያልተበረዘ የተፈጥሮ እንክብካቤ ይገባዋል። ከንጹህ እፅዋት ንጥረነገሮች የተዘጋጀው የሰውነት እንክብካቤ ስብስባችን ጎጂ ኬሚካሎችን ያስወግዳል፤ ለስሱ ቆዳ እና ለሚያድጉ ቤተሰቦች አስተማማኝ ነው።',
    href: '/skincare',
    defaultEnabled: true,
    iconName: 'Droplets',
    isStore: true,
  },
  {
    id: 'toys',
    nameKey: 'services.toysTitle',
    defaultName: 'Grounded Childhood Toys',
    nameAm: 'ትሁት እና እውነተኛ የልጆች አሻንጉሊቶች',
    taglineKey: 'services.toysTagline',
    defaultTagline: 'Modest, realistic dolls and classic toys fostering healthy self-acceptance.',
    taglineAm: 'የተፈጥሮ የልጅነት ውበትን የሚያንፀባርቁ ክላሲክ አሻንጉሊቶች።',
    manifesto: 'We believe in preserving the sweetness and reality of childhood. Our modest, realistic dolls are designed without exaggerated features or modern makeup, wearing classic full-coverage clothing. They offer children a grounded reflection of real beauty, fostering healthy self-acceptance and quiet self-worth.',
    manifestoAm: 'የልጅነትን ጣፋጭነት እና እውነታ በመጠበቅ እናምናለን። ልከኛ እና እውነተኛ አሻንጉሊቶቻችን ያለተጋነነ ውበት ወይም ዘመናዊ ሜካፕ የተሰሩ ሲሆኑ ሙሉ ሽፋን ያላቸው ክላሲክ ልብሶችን ይለብሳሉ። ለልጆች የእውነተኛ ውበት ነጸብራቅ በመስጠት ጤናማ ራስን መቀበልን ያዳብራሉ።',
    href: '/toys',
    defaultEnabled: true,
    iconName: 'Smile',
    isStore: true,
  },
  {
    id: 'journals',
    nameKey: 'services.journalsTitle',
    defaultName: 'Mindful Journals & Reflection Tools',
    nameAm: 'አዕምሮን የሚያንጹ ማስታወሻዎች እና የማሰላሰያ መሳሪያዎች',
    taglineKey: 'services.journalsTagline',
    defaultTagline: 'Structured daily journals to track habits, foster gratitude, and cultivate peace.',
    taglineAm: 'ልማዶችን ለመከታተል፣ ምስጋናን እና ውስጣዊ ሰላምን ለማዳበር የተዘጋጁ።',
    manifesto: 'Living with intention requires space to reflect. Our structured daily journals are designed to help you track habits, align your actions with your personal values, foster daily gratitude, and cultivate personal growth and inner peace.',
    manifestoAm: 'በዓላማ መኖር ለማሰላሰል የተዘጋጀ ቦታ ይጠይቃል። የተዋቀሩ የቀን ማስታወሻዎቻችን ልማዶችን እንዲከታተሉ፣ ድርጊቶችዎን ከግል እሴቶችዎ ጋር እንዲያስተካክሉ እና ውስጣዊ ሰላምን እንዲያዳብሩ የተነደፉ ናቸው።',
    href: '/journals',
    defaultEnabled: true,
    iconName: 'BookOpen',
    isStore: true,
  },
  {
    id: 'catering',
    nameKey: 'services.cateringTitle',
    defaultName: 'Wholesome & Pure Catering',
    nameAm: 'የተመረጡ እና ንጹህ የምግብ ዝግጅቶች',
    taglineKey: 'services.cateringTagline',
    defaultTagline: 'Nourishing culinary experiences prepared with raw, additive-free ingredients.',
    taglineAm: 'ከተጨማሪ ኬሚካሎች ነፃ የሆኑ ተፈጥሯዊ የምግብ ዝግጅቶች።',
    href: '/catering',
    defaultEnabled: true,
    iconName: 'UtensilsCrossed',
    isStore: false,
  },
  {
    id: 'gifts',
    nameKey: 'services.giftsTitle',
    defaultName: 'Regal Gift Packages',
    nameAm: 'የሬጋል የስጦታ እሽጎች',
    taglineKey: 'services.giftsTagline',
    defaultTagline: 'Mindfully curated gift bundles celebrating pure living and special moments.',
    taglineAm: 'ለየት ላሉ አጋጣሚዎች በጥንቃቄ የተዘጋጁ ልዩ የስጦታ እሽጎች።',
    href: '/gifts',
    defaultEnabled: true,
    iconName: 'Gift',
    isStore: false,
  },
  {
    id: 'bridal',
    nameKey: 'services.bridalTitle',
    defaultName: 'Bridal & Modest Gowns',
    nameAm: 'የሙሽራ እና ልከኛ ቀሚሶች',
    taglineKey: 'services.bridalTagline',
    defaultTagline: 'Exclusive bridal collections and custom modest wedding attire.',
    taglineAm: 'ለየት ያሉ የሰርግ እና የክብር አልባሳት ስብስቦች።',
    href: '/bridal',
    defaultEnabled: false, // Turned OFF by default per client instructions
    iconName: 'Heart',
    isStore: false,
  },
  {
    id: 'events',
    nameKey: 'services.eventsTitle',
    defaultName: 'Event Planning & Decor',
    nameAm: 'የዝግጅት አደረጃጀት እና ዲኮር',
    taglineKey: 'services.eventsTagline',
    defaultTagline: 'Bespoke planning and dignified decor for cherished celebrations.',
    taglineAm: 'ለክብረ በዓላት የታሰቡ ውብ የዲኮር እና የአደረጃጀት አገልግሎቶች።',
    href: '/events',
    defaultEnabled: false, // Turned OFF by default per client instructions
    iconName: 'Calendar',
    isStore: false,
  },
];

export const DEFAULT_SERVICES_CONFIG: Record<string, boolean> = REGAL_SERVICES.reduce(
  (acc, service) => {
    acc[service.id] = service.defaultEnabled;
    return acc;
  },
  {} as Record<string, boolean>
);
