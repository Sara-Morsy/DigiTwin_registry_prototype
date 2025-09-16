import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  // GitHub Pages URL for your repo
  site: 'https://Sara-Morsy.github.io/DigiTwin_registry_prototype/',
  // Base path = repo name
  base: '/DigiTwin_registry_prototype/',
  integrations: [tailwind(), react()],
});
