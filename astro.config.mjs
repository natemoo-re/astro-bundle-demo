import { defineConfig } from 'astro/config';
import bundle from './astro-bundle/index.js';
import netlify from "@astrojs/netlify/functions";

// https://astro.build/config
export default defineConfig({
  integrations: [bundle()],
  output: "server",
  adapter: netlify()
});
