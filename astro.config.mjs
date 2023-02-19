import { defineConfig } from 'astro/config';
import bundle from './astro-bundle/index.js';

// https://astro.build/config
export default defineConfig({
    integrations: [bundle()]
});
