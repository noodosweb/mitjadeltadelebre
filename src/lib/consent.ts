import { updateAnalyticsConsent } from "./analytics";

const STORAGE_KEY = "cookie-consent-v1";

export interface ConsentCategories {
  funcional: true;
  preferencies: boolean;
  estadistiques: boolean;
  marketing: boolean;
}

interface StoredConsent {
  version: 1;
  categories: ConsentCategories;
  decidedAt: string;
}

export function getStoredConsent(): StoredConsent | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

export function saveConsent(
  categories: Omit<ConsentCategories, "funcional">
): void {
  const stored: StoredConsent = {
    version: 1,
    categories: { funcional: true, ...categories },
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  updateAnalyticsConsent({
    estadistiques: categories.estadistiques,
    marketing: categories.marketing,
  });
}

export function acceptAll(): void {
  saveConsent({ preferencies: true, estadistiques: true, marketing: true });
}

export function rejectAll(): void {
  saveConsent({ preferencies: false, estadistiques: false, marketing: false });
}

// Al arrancar: si ya hay una decisión guardada, aplícala al núcleo de analitica (gtag ya
// arrancó con consent default 'denied' en initAnalytics()); si no hay decisión, no toques
// nada — el banner es quien pedirá la decisión.
export function initConsent(): void {
  const stored = getStoredConsent();
  if (!stored) return;
  updateAnalyticsConsent({
    estadistiques: stored.categories.estadistiques,
    marketing: stored.categories.marketing,
  });
}
