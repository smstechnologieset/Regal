import { en, TranslationKey } from "./en";
import { am } from "./am";

export type Locale = "en" | "am";

export const translations: Record<Locale, TranslationKey> = {
  en,
  am,
};

export { en, am };
export type { TranslationKey };
