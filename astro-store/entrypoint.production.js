import Keyv from "@keyv/mysql";
import { lookup } from 'mrmime';

const cache = new Keyv({ uri: "{%URL%}", namespace: 'astro:store' })
const PREFIX = "{%PREFIX%}"
const NAMESPACE = "{%NAMESPACE%}";
const dictionary = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY';
const binary = dictionary.length;

// Noop connection errors during prerender
cache.on('error', () => {})

function bitwise(str) {
	let hash = 0;
	if (str.length === 0) return hash;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		hash = (hash << 5) - hash + ch;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

export function hash(text) {
	let num;
	let result = '';

	let integer = bitwise(text);
	const sign = integer < 0 ? 'Z' : ''; // It it's negative, start with Z, which isn't in the dictionary

	integer = Math.abs(integer);

	while (integer >= binary) {
		num = integer % binary;
		integer = Math.floor(integer / binary);
		result = dictionary[num] + result;
	}

	if (integer > 0) {
		result = dictionary[integer] + result;
	}

	return sign + result;
}

function generateName(path, content) {
    if (path.includes('[hash]') && content) {
        const h = hash(content);
        return `${PREFIX}${path.replaceAll('[hash]', h)}`;
    }
    return `${PREFIX}${path}`;
}

const day = 24 * 3600 * 1000;
class LocalStore {
  constructor(namespace) {
    this.ns = namespace;
  }

  async get(path) {
    const name = generateName(`namespaces/${this.ns}/${path}`);
    return await globalThis[NAMESPACE].cache.get(name);
  }

  async set(path, content) {
    const name = generateName(`namespaces/${this.ns}/${path}`, content);
    await globalThis[NAMESPACE].cache.set(name, content, {
      expires: Date.now() + day,
      asset: true
    });
    return name;
  }

  async setWithCache(path, generate) {
    const name = `${PREFIX}namespaces/${this.ns}/${path}`;
    if (globalThis[NAMESPACE].cache.has(name)) return name;
    // Immediately start processing the cache
    return globalThis[NAMESPACE].cache.setPromise(name, generate, { expires: Date.now() + day, asset: true }).then(() => name);
  }
}

const processing = new Set();
export class Store {
  constructor(namespace, { asset = false } = {}) {
    this.ns = namespace;
    if (asset && globalThis[NAMESPACE]) {
      this.local = new LocalStore(namespace);
    }
  }

  #local(method, ...args) {
    if (!this.local) return;
    try {
      return this.local[method](...args)
    } catch {}
  }

  async get(path) {
    const local = await this.#local('get', path);
    if (local) return local;

    const name = generateName(`namespaces/${this.ns}/${path}`);
    return await cache.get(name);
  }

  async set(path, content) {
    const local = await this.#local('set', path, content);
    if (local) return local;

    const name = generateName(`namespaces/${this.ns}/${path}`, content);
    await cache.set(name, content);
    return name;
  }

  async setWithCache(path, generate) {
    const local = await this.#local('setWithCache', path, generate);
    if (local) return local;

    const name = `${PREFIX}namespaces/${this.ns}/${path}`;
    if (await cache.has(name) || processing.has(name)) return name;
    processing.add(name);
    // Immediately start processing the cache
    return cache.set(name, await generate()).then(() => name);
  }
}

export const get = async ({ url: { pathname }, params }) => {
  if (!(await cache.has(pathname))) return new Response(JSON.stringify({ pathname, params }), { status: 404 });
  const data = await cache.get(pathname);
  const contentType = lookup(pathname);

  return new Response(data, { status: 200, headers: { 'Content-Type': contentType } });
}
