<!-- revisor-web:metadatos -->
## Metadatos SEO
La pàgina `/` (única ruta) porta `title`, `description` i `jsonLd` propis al
`<head>` de `index.astro`, basats en el seu contingut real. Títol home: `Marca
— Títol`. Si s'afegeixen noves pàgines, seguir el mateix patró (interiors:
`Títol — Marca`) i mantenir title/description únics entre pàgines. Per al
tractament complet: `/revisor-web:revisar metadatos`.
<!-- /revisor-web:metadatos -->

<!-- revisor-web:analitica -->
## Analítica — GA4 i Search Console
L'ID de mesurament de GA4 viu en una variable d'entorn (`PUBLIC_GA4_MEASUREMENT_ID`), mai
hardcodejat — es passa com a Build Arg de Docker (veure `Dockerfile`), no com a variable
d'entorn de runtime: el lloc és estàtic i el `npm run build` es fa dins la imatge, servit
després per nginx sense llegir cap `env`. `src/lib/analytics.ts` és autosuficient (bootstrap
propi de `window.gtag` guardat amb `if (!window.gtag)`); el consentiment el gestiona per
categories `src/lib/consent.ts`, amb el seu propi bootstrap equivalent — veure bloc
`revisor-web:consentimiento`.
<!-- revisor-web:analitica:gsc-verificado-externo -->
Search Console verificat per registre TXT al DNS (mètode extern, sense rastre al codi).
<!-- revisor-web:analitica:despliegue-dokploy -->
Desplegat a producció via Dokploy: `PUBLIC_GA4_MEASUREMENT_ID` configurada a la pestanya
Build-time Arguments del servei (build-time, no runtime). Verificat en producció el
2026-08-09 (event `page_view` real a GA4 Tiempo real/DebugView).
Per al tractament complet: `/revisor-web:revisar analitica`.
<!-- /revisor-web:analitica -->

<!-- revisor-web:consentimiento -->
## Consentiment de cookies
El consentiment es gestiona per categories (Funcional sempre activa, sense checkbox;
Preferències, Estadístiques i Màrqueting commutables) a `src/lib/consent.ts` — mòdul
autosuficient, no depèn de `src/lib/analytics.ts` (cadascun comprova/crea el seu propi
bootstrap `window.gtag` amb `if (!window.gtag)`, contracte compartit). Estat a `localStorage`
`cookie-consent-v1`. Banner `src/components/CookieConsentBanner.astro`: panell únic amb les
categories sempre visibles (sense modal separat) i tres botons (Rebutjar/Desar/Acceptar-ho tot);
es reobre disparant `openConsentPanel()` (event `revisor-web:open-consent`) des del botó
«Configuració de cookies» del `Footer.astro`. Estadístiques governa `analytics_storage`;
Màrqueting governa `ad_storage`/`ad_user_data`/`ad_personalization` (sense cap cookie de
màrqueting real encara). Colors del banner: custom properties `--cookie-*` a l'arrel del
component. Pàgina `/politica-cookies` amb el detall.
Per al tractament complet: `/revisor-web:revisar consentimiento`.
<!-- /revisor-web:consentimiento -->

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
