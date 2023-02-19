import fs from "node:fs";
import { lookup } from 'mrmime';

import { BundleCache } from './cache.js';

const namespace = "astro:bundle";
const virtualId = `\0${namespace}`;

/** @type {import('astro').AstroIntegration} */
const integration = () => {
  let cache;
  let config;

  return {
    name: namespace,
    hooks: {
      async "astro:config:setup"({ command, config: _config, updateConfig }) {
        config = _config;
        cache = new BundleCache(new URL('./node_modules/.astro/bundle/', config.root));
        globalThis[namespace] = { cache }

        const prefix = `/${config.build.assets}/`;
        updateConfig({
          vite: {
            plugins: [
              {
                name: namespace,
                enforce: "pre",
                configureServer(server) {
                  return () => server.middlewares.use(async (req, res, next) => {
                    if (!req.url.startsWith(prefix)) return next();
                    if (cache.has(req.url)) {
                      const content = await cache.get(req.url);
                      const type = lookup(req.url) || 'text/plain';
                      res.statusCode = 200;
                      res.setHeader('Content-Type', type);
                      res.end(content);
                      return;
                    }
                    return next();
                  })
                },
                resolveId(id) {
                  if (id === namespace) return virtualId;
                },
                load(id) {
                  if (id !== virtualId) return;

                  if (command === 'build') {
                    const virtualFile = fs.readFileSync(new URL('./entrypoint.production.js', import.meta.url), 'utf8')
                      .replace('"{%URL%}"', "process.env.DB_URL")
                      .replace('{%PREFIX%}', prefix);
                    return virtualFile;
                  } else {
                    const virtualFile = fs.readFileSync(new URL('./entrypoint.js', import.meta.url), 'utf8')
                      .replace('{%NAMESPACE%}', namespace)
                      .replace('{%PREFIX%}', prefix);
                    return virtualFile;
                  }
                },
              },
            ],
          },
        });
      },
      async "astro:build:setup"() {
        cache = new BundleCache(new URL('./node_modules/.astro/bundle/', config.root));
        globalThis[namespace] = { cache };
      },
      async "astro:build:generated"() {
        await cache.finalize();
      },
    },
  };
};

export default integration;
