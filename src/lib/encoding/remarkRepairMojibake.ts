import { visit } from 'unist-util-visit';
import type { Root, Text } from 'mdast';
import { repairWin1252 } from './repair.js';

/**
 * Remark plugin that repairs Windows-1252 double-encoding mojibake in every
 * text node of the mdast tree.
 *
 * This is needed because the qa-vault source files contain content that was
 * saved with correct UTF-8 bytes (em-dash, arrows, curly quotes, etc.) but
 * were then corrupted at some point by a tool that misread each raw byte as a
 * Windows-1252 code unit and re-stored the result as UTF-8.  Astro reads the
 * source files as UTF-8, producing unicode strings where each mojibake char
 * cluster must be reversed to recover the original glyph.
 *
 * The repair is idempotent for content that does not contain the characteristic
 * WIN-1252 special block code points (U+20AC, U+2013, U+2014, U+2018/9,
 * U+201C/D, U+2020, etc.).
 */
export function remarkRepairMojibake() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text) => {
      node.value = repairWin1252(node.value);
    });
  };
}
