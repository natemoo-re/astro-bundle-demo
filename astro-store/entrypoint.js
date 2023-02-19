const PREFIX = "{%PREFIX%}";
const NAMESPACE = "{%NAMESPACE%}";
const dictionary =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary = dictionary.length;

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
  let result = "";

  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : ""; // It it's negative, start with Z, which isn't in the dictionary

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
  if (path.includes("[hash]") && content) {
    const h = hash(content);
    return `${PREFIX}${path.replaceAll("[hash]", h)}`;
  }
  return `${PREFIX}${path}`;
}

export class Store {
  constructor(namespace) {
    this.ns = namespace;
  }

  async put(path, content) {
    const name = generateName(`namepsaces/${this.ns}/${path}`, content);
    await globalThis[NAMESPACE].cache.set(name, content, {
      expires: Date.now() + 60_000,
    });
    return name;
  }

  async putWithCache(path, generate) {
    const name = `${PREFIX}namespaces/${this.ns}/${path}`;
    if (globalThis[NAMESPACE].cache.has(name)) return name;
    // Immediately start processing the cache
    return globalThis[NAMESPACE].cache.setPromise(name, generate, { expires: Date.now() + 60_000 }).then(() => name);
  }
}
