import {
  ASC_CAP,
  CLAW_CAP,
  DRAGON_DEX,
  ITEMS,
  LINEAGES,
  PRODUCTION_MILESTONES,
  REBIRTH_CAP,
  RELICS,
  STAGES,
  SYSTEM_UNLOCKS,
  TITAN_CAP,
  ZONE_COUNT,
  type TabId
} from './constants';
import { discoveredDexCount, itemCount, stageIndex } from './economy';
import { formatNumber as f, plural } from './format';
import type { Fx } from './fx';
import type { GameState } from './state';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  ok: (S: GameState) => boolean;
}

function buildAchievements(): Achievement[] {
  const list: Achievement[] = [];
  const add = (id: string, name: string, desc: string, ok: (S: GameState) => boolean) => list.push({ id, name, desc, ok });
  const tapNames = ['Premier souffle', 'Flamme vive', 'Brasier', 'Haleine d’enfer', 'Tempête de feu', 'Souffle des anciens', 'Respiration du monde'];
  [10, 100, 1e3, 5e3, 2e4, 5e4, 1e5].forEach((n, i) => add('t' + n, tapNames[i], f(n) + ' souffles', (S) => S.taps >= n));
  const manaNames = ['Étincelle', 'Fiole de mana', 'Réservoir arcanique', 'Rivière de mana', 'Océan de mana', 'Nébuleuse', 'Cœur du cosmos'];
  [1e3, 1e5, 1e8, 1e10, 1e12, 1e13, 1e14].forEach((n, i) => add('o' + n, manaNames[i], f(n) + ' mana au total', (S) => S.life >= n));
  STAGES.slice(1).forEach((s, i) => add('e' + (i + 1), 'Évolution : ' + s.name, 'Faire grandir son dragon jusqu’à ce stade', (S) => stageIndex(S) >= i + 1));
  ITEMS.slice(1).forEach((it) => {
    add('g' + it.id, it.name, 'En posséder un', (S) => itemCount(S, it) >= 1);
    [25, 100].forEach((n) => add('m' + it.id + n, it.name + ' ×' + n, 'En posséder ' + n, (S) => itemCount(S, it) >= n));
  });
  [10, 50].forEach((n) => add('all' + n, 'Armée complète ×' + n, n + ' de chaque unité', (S) => ITEMS.slice(1).every((it) => itemCount(S, it) >= n)));
  [5, 15, 30, 60].forEach((n) => add('c' + n, 'Griffes niveau ' + n, 'Améliorer les griffes ' + n + ' fois', (S) => S.claw >= n));
  [1, 3, 6, 10, 15, 20].forEach((n) => add('r' + n, 'Renaissances : ' + n, plural(n, 'renaissance') + ' au total', (S) => S.rk >= n));
  [1, 3, 5, 8, 10].forEach((n) => add('a' + n, 'Ascensions : ' + n, plural(n, 'ascension'), (S) => S.asc >= n));
  const totalTalents = (S: GameState) => Object.values(S.tal).reduce((a, b) => a + b, 0);
  [5, 15, 30].forEach((n) => add('x' + n, 'Érudit des arcanes ' + n, n + ' niveaux d’arcanes', (S) => totalTalents(S) >= n));
  [1, 5, 10].forEach((n) => add('s' + n, 'Étoiles : ' + n, 'Posséder ' + plural(n, 'étoile'), (S) => S.stars >= n));
  return list;
}

export const ACHIEVEMENTS = buildAchievements();

/** Débloque les succès atteints. Renvoie le nombre de nouveaux succès. */
export function checkAchievements(S: GameState, fx: Fx): number {
  let count = 0;
  for (const a of ACHIEVEMENTS) {
    if (!S.ach[a.id] && a.ok(S)) {
      S.ach[a.id] = 1;
      count++;
      fx.toast('Succès : ' + a.name + ' (+1 %)');
    }
  }
  return count;
}

/** Conditions de déblocage des lignées visuelles (indice 0 toujours disponible). */
export const LINEAGE_UNLOCKS: ({ desc: string; ok: (S: GameState) => boolean } | null)[] = [
  null,
  { desc: 'atteindre le stade Jeune Dragon', ok: (S) => stageIndex(S) >= 1 },
  { desc: 'faire 1 renaissance', ok: (S) => S.rk >= 1 },
  { desc: 'atteindre le stade Dragon ailé', ok: (S) => stageIndex(S) >= 3 },
  { desc: 'faire 1 ascension', ok: (S) => S.asc >= 1 },
  { desc: 'atteindre le stade Grand dragon d’Europe', ok: (S) => stageIndex(S) >= 5 },
  { desc: 'vaincre 10 titans', ok: (S) => S.bossKills >= 10 }
];

export const lineageUnlocked = (S: GameState, i: number): boolean => i === 0 || !!S.vu[i];

export function checkLineages(S: GameState, fx: Fx): boolean {
  let changed = false;
  LINEAGE_UNLOCKS.forEach((u, i) => {
    if (u && !S.vu[i] && u.ok(S)) {
      S.vu[i] = 1;
      changed = true;
      fx.toast('Nouvelle lignée débloquée : ' + LINEAGES[i].name);
    }
  });
  return changed;
}

/** Prochaine lignée à débloquer et sa condition, ou null si toutes le sont. */
export function nextLineage(S: GameState): { name: string; condition: string } | null {
  const n = LINEAGE_UNLOCKS.findIndex((u, i) => u && !S.vu[i]);
  return n < 0 ? null : { name: LINEAGES[n].name, condition: LINEAGE_UNLOCKS[n]!.desc };
}

export function selectLineage(S: GameState, i: number, fx: Fx): boolean {
  if (!lineageUnlocked(S, i)) {
    fx.toast('Verrouillée : ' + LINEAGE_UNLOCKS[i]!.desc);
    return false;
  }
  S.v = i;
  return true;
}

/** Onglets accessibles selon le mana total. */
export function tabUnlocked(S: GameState, tab: TabId): boolean {
  const rule = SYSTEM_UNLOCKS.find((u) => u.tab === tab);
  return !rule || (S.life || 0) >= rule.life;
}

export interface CompletionRow {
  icon: string;
  name: string;
  value: number;
  max: number;
}

export function completionRows(S: GameState): CompletionRow[] {
  const adv = S.adventure;
  return [
    { icon: '⚔️', name: 'Titans vaincus', value: Math.min(S.boss || 0, TITAN_CAP), max: TITAN_CAP },
    { icon: '🐲', name: 'Lignées découvertes', value: discoveredDexCount(S), max: DRAGON_DEX.length },
    { icon: '🗺️', name: 'Zones de l’expédition', value: Math.min(adv?.unlocked || 1, ZONE_COUNT), max: ZONE_COUNT },
    { icon: '💠', name: 'Reliques réunies', value: S.relicOwned.length, max: RELICS.length },
    { icon: '🔥', name: 'Renaissances', value: Math.min(S.rk || 0, REBIRTH_CAP), max: REBIRTH_CAP },
    { icon: '⭐', name: 'Ascensions', value: Math.min(S.asc || 0, ASC_CAP), max: ASC_CAP },
    { icon: '🐾', name: 'Griffes runiques', value: Math.min(S.claw || 0, CLAW_CAP), max: CLAW_CAP },
    { icon: '✨', name: 'Sceaux de production', value: PRODUCTION_MILESTONES.filter((x) => (S.rk || 0) >= x.rank).length, max: PRODUCTION_MILESTONES.length }
  ];
}

/** Avancement global (0–1) : moyenne des lignes du grand livre. */
export function completionRatio(S: GameState): number {
  const rows = completionRows(S);
  return rows.reduce((a, r) => a + Math.min(1, r.value / Math.max(1, r.max)), 0) / rows.length;
}

/** Compte des succès pour les cadres héraldiques : forge + aventure. */
export function heraldryAchievementCount(S: GameState): { total: number; main: number; adventure: number } {
  const main = Object.values(S.ach).filter(Boolean).length;
  const adventure = Object.values(S.adventure?.achievements || {}).filter(Boolean).length;
  return { total: main + adventure, main, adventure };
}
