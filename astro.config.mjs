// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://mitjadeltadelebre.com',
	i18n: {
		defaultLocale: 'ca',
		locales: ['ca', 'es'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
