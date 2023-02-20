import { defineConfig } from 'astro/config';
import netlify from "@astrojs/netlify/functions";
import store from './astro-store/index.js';

// https://astro.build/config
export default defineConfig({
  integrations: [store()],
  output: "server",
  adapter: netlify()
});
