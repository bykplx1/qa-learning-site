import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import type { SatoriOptions } from 'satori';

const require = createRequire(import.meta.url);

let cache: SatoriOptions['fonts'] | null = null;

export async function loadFonts(): Promise<SatoriOptions['fonts']> {
  if (cache) return cache;
  const root = dirname(require.resolve('@fontsource/inter/package.json'));
  const [regular, bold] = await Promise.all([
    readFile(resolve(root, 'files', 'inter-latin-400-normal.woff')),
    readFile(resolve(root, 'files', 'inter-latin-700-normal.woff')),
  ]);
  cache = [
    { name: 'Inter', data: regular, weight: 400, style: 'normal' },
    { name: 'Inter', data: bold, weight: 700, style: 'normal' },
  ];
  return cache;
}
