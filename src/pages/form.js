import { Store } from 'astro:store'

const store = new Store('form');
export async function post({ request, site }) {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries())
    const location = request.headers.get('referer') ?? site;
    
    const submittedAt = new Date().toISOString();
    const [y,m,d] = submittedAt.split('T')[0].split('-');
    await store.set(`${y}/${m}/${d}/[hash]`, JSON.stringify(data, null, 2))
    return new Response(null, { status: 301, headers: { location } });
}
