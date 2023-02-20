import { Store } from 'astro:store'

const store = new Store('form');
export async function post({ request, site }) {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries())
    const location = request.headers.get('referer') ?? site;

    await store.set(`[hash].json`, JSON.stringify(data, null, 2))
    return new Response(null, { status: 301, headers: { location } });
}

export async function get() {
    const data = store.getAll();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
}
