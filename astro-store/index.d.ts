declare module "astro:store" {
    export function hash(text: string): string;

    export class Store {
        constructor(namespace: string);

        async put(path: string, content: string): Promise<string>;
        
        async putWithCache(path: string, content: () => Promise<string>): Promise<string>;
    }
}
