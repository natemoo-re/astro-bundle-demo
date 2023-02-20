declare module "astro:store" {
    export function hash(text: string): string;

    export class Store {
        constructor(namespace: string, opts?: { asset?: boolean });

        async get(path: string): Promise<unknown>;

        async set(path: string, content: string): Promise<string>;
        
        async setWithCache(path: string, content: () => Promise<string>): Promise<string>;
    }
}
