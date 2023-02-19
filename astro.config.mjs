import { defineConfig } from 'astro/config';
import store from './astro-store/index.js';

// https://astro.build/config
export default defineConfig({
  integrations: [store()]
});
