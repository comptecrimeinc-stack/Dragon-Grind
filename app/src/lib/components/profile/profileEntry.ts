import { RIVALS } from '#lib/game/constants.ts';
import { localRank, type Hero, type PlayerScore, type WorldPlayer } from '#lib/game/leaderboard.ts';

export type EntryKind = 'me' | 'hero' | 'npc' | 'world';

/** Fiche affichée sur une carte de profil. */
export interface ProfileEntry {
  kind: EntryKind;
  name: string;
  dragon: string;
  title: string;
  life: number;
  kills: number;
  rk: number;
  asc: number;
  frame?: string;
  rank: number | null;
}

interface Sources {
  me: PlayerScore;
  heroes: Hero[];
  world: WorldPlayer[] | null;
}

/** Retrouve la fiche d'un joueur cliqué dans un classement. */
export function findEntry(kind: EntryKind, name: string, dragon: string, { me, heroes, world }: Sources): ProfileEntry | null {
  if (kind === 'me') return { kind, ...me, title: 'Forgeron de cette forge', rank: localRank(me.life, heroes, me.name) };
  if (kind === 'npc') {
    const r = RIVALS.find((x) => x.name === name);
    return r ? { kind, name: r.name, dragon: r.dragon, title: r.title, life: r.life, kills: r.kills, rk: 0, asc: 0, rank: localRank(r.life, heroes, '') } : null;
  }
  if (kind === 'hero') {
    const h = heroes.find((x) => x.name === name);
    return h ? { kind, name: h.name, dragon: h.dragon, title: 'Héros inscrit sur cet appareil', life: h.life, kills: h.kills, rk: h.rk, asc: h.asc, frame: h.frame, rank: localRank(h.life, heroes, h.name) } : null;
  }
  const list = world ?? [];
  const w = list.find((x) => x.name === name && (x.dragon || '') === dragon) ?? list.find((x) => x.name === name);
  if (!w) return { kind, name: name || 'Anonyme', dragon, title: 'Forgeron du classement mondial', life: 0, kills: 0, rk: 0, asc: 0, rank: null };
  return {
    kind,
    name: w.name,
    dragon: w.dragon || '',
    title: 'Forgeron du classement mondial',
    life: w.life || 0,
    kills: w.kills || 0,
    rk: w.rk || 0,
    asc: w.asc || 0,
    frame: w.frame,
    rank: 1 + list.filter((x) => (x.life || 0) > (w.life || 0)).length
  };
}
