/**
 * Repairs UTF-8 text that was corrupted by the Windows-1252 double-encoding bug.
 *
 * Root cause: The qa-vault markdown files were saved with correct UTF-8 bytes, but at
 * some point each byte in the range 0x80–0xFF was misread as a Windows-1252 code unit
 * and stored back as UTF-8.  For example, the em-dash (U+2014, bytes E2 80 94) was
 * decoded byte-by-byte via Windows-1252 into â + € + " and re-stored as valid UTF-8.
 *
 * The inverse operation: for every character whose code point maps to a single byte in
 * Windows-1252, collect that byte, then re-decode the resulting byte array as UTF-8.
 * Characters that are already plain ASCII (0x00–0x7F) are passed through unchanged.
 */

// Windows-1252 special block (0x80–0x9F) → Unicode code points.
// Only entries that differ from plain Latin-1 are listed; the rest of the table is
// identity-mapped (code point == byte value) for 0x00–0x7F and 0xA0–0xFF.
const WIN1252_SPECIAL: ReadonlyMap<number, number> = new Map([
  [0x20ac, 0x80], // € → 0x80
  [0x201a, 0x82], // ‚ → 0x82
  [0x0192, 0x83], // ƒ → 0x83
  [0x201e, 0x84], // „ → 0x84
  [0x2026, 0x85], // … → 0x85
  [0x2020, 0x86], // † → 0x86
  [0x2021, 0x87], // ‡ → 0x87
  [0x02c6, 0x88], // ˆ → 0x88
  [0x2030, 0x89], // ‰ → 0x89
  [0x0160, 0x8a], // Š → 0x8A
  [0x2039, 0x8b], // ‹ → 0x8B
  [0x0152, 0x8c], // Œ → 0x8C
  [0x017d, 0x8e], // Ž → 0x8E
  [0x2018, 0x91], // ' → 0x91
  [0x2019, 0x92], // ' → 0x92
  [0x201c, 0x93], // " → 0x93
  [0x201d, 0x94], // " → 0x94
  [0x2022, 0x95], // • → 0x95
  [0x2013, 0x96], // – → 0x96 (en-dash)
  [0x2014, 0x97], // — → 0x97 (em-dash)
  [0x02dc, 0x98], // ˜ → 0x98
  [0x2122, 0x99], // ™ → 0x99
  [0x0161, 0x9a], // š → 0x9A
  [0x203a, 0x9b], // › → 0x9B
  [0x0153, 0x9c], // œ → 0x9C
  [0x017e, 0x9e], // ž → 0x9E
  [0x0178, 0x9f], // Ÿ → 0x9F
]);

// fatal: true makes decode() throw on invalid sequences rather than substituting U+FFFD.
// This is essential: a single high byte (e.g. 0x97 from em-dash) that is not part of
// a valid multi-byte sequence must cause the fallback, not silently return garbage.
const decoder = new TextDecoder('utf-8', { fatal: true });
const encoder = new TextEncoder();

/**
 * Returns true when `str` contains any character that indicates
 * Windows-1252 double-encoding (i.e. a code point that maps to a byte
 * in the 0x80–0x9F Windows-1252 special block, or a Latin-1 supplement
 * char in 0xA0–0xFF used as a raw byte placeholder).
 *
 * Fast pre-check so we avoid rebuilding the byte array for clean files.
 */
function looksCorrupted(str: string): boolean {
  for (const char of str) {
    const cp = char.codePointAt(0)!;
    // WIN-1252 special block chars are a strong signal
    if (WIN1252_SPECIAL.has(cp)) return true;
    // Latin-1 supplement (U+00C2–U+00EF) appearing before a WIN-1252 char
    // is also a signal; but to keep this fast we only check the special block.
  }
  return false;
}

/**
 * Reverse the Windows-1252 double-encoding in `str`.
 *
 * Each character's code point is mapped back to its Windows-1252 byte value.
 * Code points that are not encodable as a single Windows-1252 byte are
 * re-serialised as UTF-8 bytes (i.e. already-correct high-Unicode chars pass through).
 * The accumulated byte array is then decoded as UTF-8.
 *
 * If the result would not be valid UTF-8, the original string is returned unchanged.
 */
export function repairWin1252(str: string): string {
  if (!looksCorrupted(str)) return str;

  const bytes: number[] = [];
  for (const char of str) {
    const cp = char.codePointAt(0)!;
    // Identity map: ASCII (0x00–0x7F) and Latin-1 supplement (0xA0–0xFF)
    if (cp <= 0x7f || (cp >= 0xa0 && cp <= 0xff)) {
      bytes.push(cp);
    } else {
      // Check WIN-1252 special block
      const b = WIN1252_SPECIAL.get(cp);
      if (b !== undefined) {
        bytes.push(b);
      } else {
        // True high-Unicode character — encode as UTF-8 bytes
        for (const byte of encoder.encode(char)) {
          bytes.push(byte);
        }
      }
    }
  }

  try {
    return decoder.decode(new Uint8Array(bytes));
  } catch {
    // Byte sequence is not valid UTF-8 — corruption pattern didn't match, keep original
    return str;
  }
}
