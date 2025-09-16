
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://example.com', // change for GitHub Pages
  integrations: [tailwind(), react()],
});
