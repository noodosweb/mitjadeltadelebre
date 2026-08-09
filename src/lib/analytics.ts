declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

// CRÍTICO: gtag.js espera recibir el objeto "arguments" nativo de la llamada (es lo que hace
// el snippet oficial de Google). Si en su lugar se empuja un array normal (p. ej. vía rest
// params `...args` seguido de `push(args)`), el dataLayer sigue creciendo con total
// normalidad — parece que funciona, no hay ningún error — pero gtag.js NUNCA marca el
// consentimiento como "usado" internamente y NINGÚN hit llega jamás a Google, ni antes ni
// después de aceptar cookies. No "limpies" esto usando rest params: usa literalmente `arguments`.
function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params -- hace falta el "arguments" real, no args
  window.dataLayer.push(arguments as unknown as unknown[]);
}

// Contrato compartido (references/consent-mode-contrato.md del plugin): un solo bootstrap y un
// solo consent default por proyecto. Si el núcleo ya existe (window.gtag definido — p. ej. creado
// por el revisor consentimiento), aquí SOLO se registra el tag.
export function initAnalytics() {
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
  window.gtag("js", new Date());
  window.gtag("config", import.meta.env.PUBLIC_GA4_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// Mapeo categoría→señal fijo (contrato compartido, references/consent-mode-contrato.md):
// Estadístiques -> analytics_storage; Màrqueting -> ad_storage + ad_user_data + ad_personalization.
export function updateAnalyticsConsent(categories: {
  estadistiques: boolean;
  marketing: boolean;
}) {
  window.gtag?.("consent", "update", {
    analytics_storage: categories.estadistiques ? "granted" : "denied",
    ad_storage: categories.marketing ? "granted" : "denied",
    ad_user_data: categories.marketing ? "granted" : "denied",
    ad_personalization: categories.marketing ? "granted" : "denied",
  });
}

// gtag('config', ...) solo dispara un page_view automático en la carga inicial del
// documento, y siempre bajo consentimiento 'denied' (Consent Mode v2 empieza así) — ese hit
// queda suprimido para siempre. Este sitio es una única página estática sin router cliente,
// así que no hace falta trackear cambios de ruta: solo dispara esto (a) justo al conceder el
// consentimiento, para el hit inicial ya perdido.
export function trackPageView(path: string) {
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
