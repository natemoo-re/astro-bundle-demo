import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE_FILE = `cache.json`;

export class BundleCache {
	#cacheDir;
	#cacheFile;
	#cache = {};

	constructor(dir) {
		this.#cacheDir = dir;
		this.#cacheFile = this.#toAbsolutePath(CACHE_FILE);
		this.init();
	}

	#toAbsolutePath(file) {
		return new URL(path.join(this.#cacheDir.toString(), file));
	}

	init() {
		try {
			const str = fs.readFileSync(this.#cacheFile, 'utf-8');
			this.#cache = JSON.parse(str);
		} catch {
			// noop
			// debug({ message: 'no cache file found', level: this.#logLevel });
		}
	}

	async finalize() {
		for (const [file, { expires }] of Object.entries(this.#cache)) {
			if (expires < Date.now()) {
				delete this.#cache[file];
			}
		}
		try {
			await fs.promises.mkdir(path.dirname(fileURLToPath(this.#cacheFile)), { recursive: true });
			await fs.promises.writeFile(this.#cacheFile, JSON.stringify(this.#cache));
		} catch {
			// noop
			// warn({ message: 'could not save the cache file', level: this.#logLevel });
		}
	}

	async get(file) {
		if (!this.has(file)) {
			return undefined;
		}

		try {
			const filepath = this.#toAbsolutePath(file);
			
			return await fs.promises.readFile(filepath);
		} catch {
			// warn({ message: `could not load cached file for "${file}"`, level: this.#logLevel });
			return undefined;
		}
	}

	async set(file, buffer, opts) {
		try {
			const filepath = this.#toAbsolutePath(file);
			await fs.promises.mkdir(path.dirname(fileURLToPath(filepath)), { recursive: true });
			await fs.promises.writeFile(filepath, buffer);

			this.#cache[file] = opts;
		} catch {
			// noop
			// warn({ message: `could not save cached copy of "${file}"`, level: this.#logLevel });
		}
	}

	has(file) {
		if (!(file in this.#cache)) {
			return false;
		}

		const { expires } = this.#cache[file];

		return expires > Date.now();
	}
}
