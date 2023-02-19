declare module "astro:bundle" {
    type FilePath = `@${string}/${string}.${string}`;
    export function hash(text: string): string;

    export async function emitAsset(path: FilePath, content: string): Promise<string>

    export async function emitCachedAsset(key: FilePath, generateAsset: () => Promise<string>): Promise<string>
}
