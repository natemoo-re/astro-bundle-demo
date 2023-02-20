# **EXPERIMENTAL** `astro:store`

Exploring a simple key/value store primitive exposed as `astro:store`. See [#492](https://github.com/withastro/roadmap/discussions/492).

## Goals

- Provide a key/value store primitive
- Provide an asset storage primitive
- Enable generated asset caching between builds
- Expose a single interface for integrations to persist data/assets
- No lock-in: users bring their own backend database
  - `redis`
  - `mongodb`
  - `sqlite`
  - `postgresql`
  - `mysql`
  - `etcd`
- Abstract away complexities of `static` vs `server` vs `prerender` and `dev` vs `build`

## Example

Simple contact form, persisted to your database of choice.

```js
import { Store } from "astro:store";

// Create a namespaced store
const store = new Store("my-custom-form");

// Handle form submission
export async function post({ request, site }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());

  const { year, month, day } = getYearMonthDay();
  // Persist data to the store
  await store.set(
    `${year}/${month}/${day}/[hash]`,
    JSON.stringify(data, null, 2)
  );

  return new Response();
}

function getYearMonthDay() {
  const [year, month, day] = new Date().toISOString().split("T")[0].split("-");
  return { year, month, day };
}
```

Generate an asset during the build

```astro
---
import { Store } from "astro:store";

const { data } = Astro.props;
// `asset` flag will write static files to disk, if possible
const store = new Store("my-custom-assets", { asset: true });
const assetURL = await store.set("[hash].json", JSON.stringify(data, null, 2));
---

<pre>{assetURL}</pre>
```

Generate a cached asset during the build

```astro
---
import { Store, hash } from "astro:store";

const { data } = Astro.props;
const contents = JSON.stringify(data, null, 2);
const name = `${hash(contents)}.json`;
// `asset` flag will write static files to disk, if possible
const store = new Store("my-custom-assets", { asset: true });
const assetURL = await store.setWithCache(name, contents);
---

<pre>{assetURL}</pre>
```
