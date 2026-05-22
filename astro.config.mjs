import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build
export default defineConfig({
  // Live production site. GitHub Pages is served from a custom domain
  // (public/CNAME → gethubbly.app), so `base` stays at the root.
  site: 'https://gethubbly.app',
  base: '/',
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    // Inline small stylesheets to cut a render-blocking request.
    inlineStylesheets: 'auto',
  },
  image: {
    // Allow Astro's <Image> to optimise the app icon + screenshots.
    responsiveStyles: true,
  },
});
