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

// Cablea el banner (`CookieConsentBanner.astro`) contra el DOM ya renderizado por sus IDs
// fijos. Vive aquí, no en el <script> del componente, para poder testear la interacción real
// (clicks, checkboxes, reapertura) con jsdom en vez de solo las funciones de persistencia en
// aislamiento — un bug de wiring (listener no adjuntado, checkbox leído mal) no lo detecta un
// test que solo llama a saveConsent() directamente.
export function mountCookieBanner(): void {
  const banner = document.getElementById("cookie-banner") as HTMLElement | null;
  const modal = document.getElementById("cookie-modal") as HTMLElement | null;
  if (!banner || !modal) return;

  // Idempotente: si ya se cableó este banner (p. ej. doble montaje en dev), no dupliques listeners.
  if (banner.dataset.consentMounted === "true") return;
  banner.dataset.consentMounted = "true";

  const prefsInput = document.getElementById("cookie-cat-preferencies") as HTMLInputElement;
  const statsInput = document.getElementById("cookie-cat-estadistiques") as HTMLInputElement;
  const marketingInput = document.getElementById("cookie-cat-marketing") as HTMLInputElement;

  const hideBanner = () => {
    banner.hidden = true;
  };
  const showBanner = () => {
    banner.hidden = false;
  };
  const openModal = () => {
    const stored = getStoredConsent();
    prefsInput.checked = stored?.categories.preferencies ?? false;
    statsInput.checked = stored?.categories.estadistiques ?? false;
    marketingInput.checked = stored?.categories.marketing ?? false;
    modal.hidden = false;
  };
  const closeModal = () => {
    modal.hidden = true;
  };

  document.getElementById("cookie-accept")?.addEventListener("click", () => {
    acceptAll();
    hideBanner();
  });

  document.getElementById("cookie-reject")?.addEventListener("click", () => {
    rejectAll();
    hideBanner();
  });

  document.getElementById("cookie-customize")?.addEventListener("click", openModal);
  document.getElementById("cookie-modal-close")?.addEventListener("click", closeModal);
  document.getElementById("cookie-modal-backdrop")?.addEventListener("click", closeModal);

  document.getElementById("cookie-modal-save")?.addEventListener("click", () => {
    saveConsent({
      preferencies: prefsInput.checked,
      estadistiques: statsInput.checked,
      marketing: marketingInput.checked,
    });
    closeModal();
    hideBanner();
  });

  document.getElementById("reopen-cookie-settings")?.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

  if (getStoredConsent()) {
    initConsent();
  } else {
    showBanner();
  }
}
