/**
 * Moteur de traduction « à la gettext » : le texte français sert de clé.
 *
 * Les dictionnaires associent une phrase française à sa traduction ; les nombres y
 * sont remplacés par `{n}`. Une phrase composée (« A · B », « A : B ») est traduite
 * morceau par morceau quand elle n'a pas d'entrée propre.
 */
export type Dictionary = Record<string, string>;

// Un nombre (avec son éventuel suffixe de grandeur : « 1,5 k », « 3 Md ») ou un chiffre romain.
const NUM = /((?:\d[\d\s\u202f.,]*\d|\d)(?: (?:k|M|Md|Bn|Bd|Tn|Tr|Qa|Qi|Sx|Sp|Oc|No)(?!\p{L}))?|\b[IVX]{1,4}\b)(?:re|ère|er|ème|e)?(?!\p{L})/gu;
const SENTENCE_SPLIT = /( · | ! |\. |\? |; | — )/;
const ACHIEVEMENT_PREFIX = 'Succès : ';

/** Forme « gabarit » d'une phrase : ses nombres remplacés par `{n}` (clé des dictionnaires). */
export const toTemplate = (s: string): string => s.replace(NUM, '{n}');

export function createTranslator(map: Dictionary | null, onMiss?: (s: string) => void): (s: string) => string {
  if (!map) return (s) => s;
  const prefixKeys = Object.keys(map)
    .filter((k) => k.length >= 3 && k !== 'Dragon')
    .sort((a, b) => b.length - a.length);
  const suffixKeys = Object.keys(map)
    .filter((k) => k.length >= 8)
    .sort((a, b) => b.length - a.length);

  function lookup(c: string): string | undefined {
    if (c.startsWith(ACHIEVEMENT_PREFIX)) {
      const rest = c.slice(ACHIEVEMENT_PREFIX.length);
      return (map!['Succès (notification)'] || 'Achievement') + ': ' + (lookup(rest) ?? rest);
    }
    const exact = map![c];
    if (exact !== undefined) return exact;

    const numbers: string[] = [];
    const template = c.replace(NUM, (_x, n: string) => {
      numbers.push(n.trim());
      return '{n}';
    });
    if (numbers.length && map![template] !== undefined) {
      let i = 0;
      return map![template].replace(/\{n\}/g, () => numbers[i++] ?? '');
    }

    if (SENTENCE_SPLIT.test(c)) {
      let hit = false;
      const parts = c.split(SENTENCE_SPLIT).map((x, i) => {
        if (i % 2) return x;
        const t = lookup(x);
        if (t === undefined) return x;
        hit = true;
        return t;
      });
      if (hit) return parts.join('').replace(/ ([!?;,.])/g, '$1');
    }
    if (c.indexOf(' : ') > 0) {
      let hit = false;
      const parts = c.split(' : ').map((x) => {
        const t = lookup(x);
        if (t === undefined) return x;
        hit = true;
        return t;
      });
      if (hit) return parts.join(': ');
    }
    if (/ :$/.test(c)) {
      const t = lookup(c.slice(0, -2));
      if (t !== undefined) return t + ':';
    }
    for (const key of prefixKeys) {
      if (c.startsWith(key) && c.length > key.length && /[\s:!?·]/u.test(c[key.length])) return map![key] + translate(c.slice(key.length));
    }
    for (const key of suffixKeys) {
      const at = c.length - key.length - 1;
      if (at >= 0 && c.endsWith(key) && /[\s:!?·]/u.test(c[at])) return c.slice(0, at + 1) + map![key];
    }
    return undefined;
  }

  function translate(s: string): string {
    const m = s.match(/^([^\p{L}\p{N}]*)([\s\S]*?)(\s*)$/u)!;
    const core = m[2].replace(/[\u00a0\u202f]/g, ' ');
    if (!core) return s;
    const r = lookup(core);
    if (r === undefined) onMiss?.(core);
    return r === undefined ? s : m[1] + r + m[3];
  }

  return translate;
}
