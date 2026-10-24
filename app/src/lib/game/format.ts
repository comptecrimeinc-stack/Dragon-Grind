const SUFFIXES = ['', 'k', 'M', 'Md', 'Bn', 'Bd', 'Tn', 'Tr', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];

/** Formate un grand nombre à la française : « 1,5 k », « 12 M », « 3,2e45 ». */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return n === Infinity ? '∞' : '0';
  if (n < 0) return '−' + formatNumber(-n);
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1).replace('.', ',') : String(Math.floor(n));
  if (n >= 1e42) return n.toExponential(2).replace('.', ',').replace('e+', 'e');
  const i = Math.min(Math.floor(Math.log10(n) / 3), SUFFIXES.length - 1);
  return (
    (n / Math.pow(1000, i))
      .toFixed(2)
      .replace(/\.?0+$/g, '')
      .replace('.', ',') +
    ' ' +
    SUFFIXES[i]
  );
}

/** Pluriel simple : « 1 braise », « 3 braises ». */
export function plural(n: number, word: string): string {
  return n + ' ' + word + (n > 1 ? 's' : '');
}

/** Ratio vers pourcentage entier : 0,25 → 25. */
export function percent(x: number): number {
  return Math.round(x * 100);
}

/** Multiplicateur à deux décimales avec virgule : 1.6 → « 1,60 ». */
export function decimal2(x: number): string {
  return x.toFixed(2).replace('.', ',');
}

/** Une décimale avec virgule, sans « ,0 » inutile : 8.4 → « 8,4 », 6 → « 6 ». */
export function decimal1(x: number): string {
  return x.toFixed(1).replace(/\.0$/, '').replace('.', ',');
}

/** Durée en « 2 h 05 min » / « 12 min ». */
export function formatDuration(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

/** Échappement HTML pour tout texte injecté dans du balisage (SVG généré, etc.). */
export function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const ADVENTURE_UNITS = ['k', 'M', 'Md', 'Bn', 'T'];

/** Format compact de l'aventure : « 1 234 », « 12,5 k », « 3 M ». */
export function formatAdventure(value: number): string {
  let n = Math.max(0, Number(value) || 0);
  if (n < 1000) return Math.floor(n).toLocaleString('fr-FR');
  let i = -1;
  while (n >= 1000 && i < ADVENTURE_UNITS.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(n < 10 ? 1 : 0).replace('.', ',') + ' ' + ADVENTURE_UNITS[i];
}
