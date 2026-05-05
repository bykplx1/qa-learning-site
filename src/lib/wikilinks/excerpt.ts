const FRONTMATTER_RE = /^﻿?---[\s\S]*?^---\n?/m;
const FENCED_CODE_RE = /^```[\s\S]*?^```\n?/gm;

export function extractExcerpt(markdown: string): string {
  let text = markdown.replace(FRONTMATTER_RE, '').replace(FENCED_CODE_RE, '');

  const lines = text.split('\n');
  const buf: string[] = [];

  for (const line of lines) {
    const t = line.trim();

    if (!t) {
      if (buf.length > 0) break;
      continue;
    }
    if (t.startsWith('#') || t.startsWith('|')) {
      if (buf.length > 0) break;
      continue;
    }
    const bq = t.match(/^>+\s*(.*)/);
    buf.push(bq ? bq[1] : t);
  }

  const plain = buf
    .join(' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]#|]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, t, alias) => alias || t)
    .trim();

  if (plain.length <= 200) return plain;
  const cut = plain.slice(0, 200);
  const sp = cut.lastIndexOf(' ');
  return (sp > 150 ? cut.slice(0, sp) : cut) + '…';
}
