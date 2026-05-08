import { createHash } from 'node:crypto';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { renderOgTemplate, type OgInput } from './template';
import { loadFonts } from './fonts';

export const TEMPLATE_VERSION = 1;
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export function computeContentHash(input: OgInput): string {
  const payload = JSON.stringify({
    v: TEMPLATE_VERSION,
    t: input.title,
    c: input.category,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export async function renderOgSvg(input: OgInput): Promise<string> {
  const fonts = await loadFonts();
  return satori(renderOgTemplate(input) as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
}

export interface OgResult {
  png: Buffer;
  svg: string;
  contentHash: string;
}

export async function generateOgPng(input: OgInput): Promise<OgResult> {
  const svg = await renderOgSvg(input);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
  });
  const png = Buffer.from(resvg.render().asPng());
  return { png, svg, contentHash: computeContentHash(input) };
}
