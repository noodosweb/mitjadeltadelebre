export type ConsentCategories = {
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
};

type StoredConsent = {
  version: 1;
  categories: ConsentCategories;
  decidedAt: string;
};

const STORAGE_KEY = "cookie-consent-v1";
export const OPEN_EVENT = "revisor-web:open-consent";

declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

// CRÍTICO: gtag.js exige el objeto "arguments" nativo, no un array normal — con un array el
// dataLayer parece sano pero ningún hit llega jamás a Google (mismo detalle que
// src/lib/analytics.ts y consent-mode-contrato.md). No lo "limpies" con rest params.
function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params -- hace falta el "arguments" real, no args
  window.dataLayer.push(arguments as unknown as unknown[]);
}

export function getStoredConsent(): ConsentCategories | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== 1) return null;
    return parsed.categories;
  } catch {
    return null;
  }
}

export function saveConsent(categories: ConsentCategories) {
  const stored: StoredConsent = {
    version: 1,
    categories,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

// Mapeo categoría→señal del contrato compartido (fijo): Estadístiques→analytics_storage;
// Màrqueting→ad_storage+ad_user_data+ad_personalization; Funcional/Preferències→sin señal.
export function applyConsent(categories: ConsentCategories) {
  window.gtag?.("consent", "update", {
    analytics_storage: categories.statistics ? "granted" : "denied",
    ad_storage: categories.marketing ? "granted" : "denied",
    ad_user_data: categories.marketing ? "granted" : "denied",
    ad_personalization: categories.marketing ? "granted" : "denied",
  });
}

// Contrato compartido: un solo bootstrap por proyecto. Si el núcleo ya existe (window.gtag
// definido — creado por src/lib/analytics.ts del revisor analitica, caso A), NO se reescribe el
// consent default: solo se restaura el estado guardado sobre él.
export function initConsent() {
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag = gtag;
  }
  const stored = getStoredConsent();
  if (stored) {
    applyConsent(stored);
  }
}

// Reabre el panel desde cualquier punto del sitio (p. ej. el enlace "Configuració de cookies"
// del footer).
export function openConsentPanel() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}
