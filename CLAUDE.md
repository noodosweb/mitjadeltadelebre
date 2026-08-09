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
després per nginx sense llegir cap `env`. El consentiment es gestiona amb
`updateAnalyticsConsent()` a `src/lib/analytics.ts`, encara sense connectar (no hi ha banner
de cookies implementat).
<!-- revisor-web:analitica:gsc-verificado-externo -->
Search Console verificat per registre TXT al DNS (mètode extern, sense rastre al codi).
<!-- revisor-web:analitica:despliegue-dokploy -->
Desplegat a producció via Dokploy: `PUBLIC_GA4_MEASUREMENT_ID` configurada a la pestanya
Build-time Arguments del servei (build-time, no runtime). Verificat en producció el
2026-08-09 (event `page_view` real a GA4 Tiempo real/DebugView).
Per al tractament complet: `/revisor-web:revisar analitica`.
<!-- /revisor-web:analitica -->

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
