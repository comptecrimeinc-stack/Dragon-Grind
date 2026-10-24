import { RIVALS } from './constants';

/** Héros inscrit sur cet appareil (une fiche par nom de joueur). */
export interface Hero {
  id: string;
  name: string;
  dragon: string;
  frame: string;
  life: number;
  kills: number;
  rk: number;
  asc: number;
  createdAt?: number;
  lastSeen?: number;
}

/** Joueur du classement mondial (format de la fonction Netlify). */
export interface WorldPlayer {
  name: string;
  dragon?: string;
  frame?: string;
  life?: number;
  kills?: number;
  rk?: number;
  asc?: number;
}

export interface PlayerScore {
  name: string;
  dragon: string;
  frame: string;
  life: number;
  kills: number;
  rk: number;
  asc: number;
}

const nameKey = (name: unknown): string => String(name ?? '').trim().toLowerCase();

/** Déduplique par nom en gardant la fiche la plus récente. */
export function dedupeHeroes(raw: unknown): Hero[] {
  if (!Array.isArray(raw)) return [];
  const map = new Map<string, Hero>();
  for (const h of raw as Hero[]) {
    if (!h || !h.name) continue;
    const k = nameKey(h.name);
    const prev = map.get(k);
    if (!prev || (h.lastSeen || 0) >= (prev.lastSeen || 0)) map.set(k, h);
  }
  return [...map.values()];
}

/** Inscrit ou met à jour le joueur : une fiche unique, scores maximaux conservés. */
export function upsertHero(list: Hero[], me: PlayerScore, now = Date.now()): Hero[] {
  const key = nameKey(me.name);
  const same = list.filter((h) => nameKey(h.name) === key);
  const others = list.filter((h) => nameKey(h.name) !== key);
  const merged: Hero = {
    id: key,
    name: me.name,
    dragon: me.dragon,
    frame: me.frame,
    life: Math.max(me.life, ...same.map((h) => h.life || 0)),
    kills: Math.max(me.kills, ...same.map((h) => h.kills || 0)),
    rk: Math.max(me.rk, ...same.map((h) => h.rk || 0)),
    asc: Math.max(me.asc, ...same.map((h) => h.asc || 0)),
    createdAt: same[0]?.createdAt ?? now,
    lastSeen: now
  };
  return [...others, merged].sort((a, b) => (b.life || 0) - (a.life || 0)).slice(0, 24);
}

export type Metric = 'life' | 'kills' | 'rk';

export interface BoardRow {
  rank: number;
  name: string;
  value: number;
  dragon: string;
  kind: 'me' | 'hero' | 'npc';
}

/** Renaissances prêtées aux rivaux : dérivées de leur mana (ils n'ont pas de vraie partie). */
const rivalRebirths = (life: number): number => Math.max(0, Math.floor(Math.log10(Math.max(10, life))) - 2);

/** Classement local d'une métrique : rivaux, héros de l'appareil et le joueur, une ligne par nom. */
export function boardRows(metric: Metric, me: PlayerScore, heroes: Hero[]): BoardRow[] {
  const meKey = nameKey(me.name);
  const seen = new Set<string>();
  const rows: Omit<BoardRow, 'rank'>[] = [];
  for (const r of RIVALS) {
    const k = nameKey(r.name);
    if (k === meKey || seen.has(k)) continue;
    seen.add(k);
    const value = metric === 'life' ? r.life : metric === 'kills' ? r.kills : rivalRebirths(r.life);
    rows.push({ name: r.name, value, dragon: r.dragon, kind: 'npc' });
  }
  for (const h of heroes) {
    const k = nameKey(h.name);
    if (!k || k === meKey || seen.has(k)) continue;
    seen.add(k);
    rows.push({ name: h.name, value: h[metric] || 0, dragon: h.dragon, kind: 'hero' });
  }
  rows.push({ name: me.name, value: me[metric], dragon: me.dragon, kind: 'me' });
  rows.sort((a, b) => (b.value || 0) - (a.value || 0));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Rang du joueur parmi rivaux et autres héros, selon le mana total. */
export function localRank(life: number, heroes: Hero[], meName: string): number {
  const meKey = nameKey(meName);
  const others = heroes.filter((h) => nameKey(h.name) !== meKey).map((h) => h.life || 0);
  return 1 + [...RIVALS.map((r) => r.life), ...others].filter((v) => v > life).length;
}

/** Rival que le joueur vient de dépasser lorsque son rang s'améliore. */
export function rivalJustPassed(life: number) {
  return RIVALS[RIVALS.filter((r) => r.life > life).length] ?? null;
}

export const isMe = (name: string, meName: string): boolean => nameKey(name) === nameKey(meName);
