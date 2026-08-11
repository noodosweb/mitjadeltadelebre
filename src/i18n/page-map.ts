export type Locale = 'ca' | 'es';

// Mapeo slug -> ruta por idioma. El català és el idioma per defecte i es queda a l'arrel
// (mai s'ha de canviar aquesta URL, ja està indexada). El castellà viu sota /es/.
export const pageMap: Record<string, Record<Locale, string>> = {
	home: { ca: '/', es: '/es/' },
	cookies: { ca: '/politica-cookies', es: '/es/politica-cookies' },
};

export function localized(slug: string, lang: Locale): string {
	return pageMap[slug]?.[lang] ?? `/${lang}/`;
}
