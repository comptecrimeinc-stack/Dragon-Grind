import {
  ASC_CAP,
  CLAW_CAP,
  DEX_BONUS,
  SANCTUARY_BONUS,
  ITEM_CAP_DEFAULT,
  MAX_GAME_VALUE,
  PRODUCTION_MILESTONES,
  REBIRTH_CAP,
  RELICS,
  STAGES,
  STAR_BRAISE_THRESHOLD,
  ITEMS,
  type AscPathId,
  type Item,
  type Relic,
  type RelicEffectKind
} from './constants';
import type { GameState } from './state';

/** Ramène toute valeur dans [0, MAX_GAME_VALUE] ; l'infini positif devient le plafond. */
export function bounded(n: number): number {
  if (Number.isFinite(n)) return Math.max(0, Math.min(MAX_GAME_VALUE, n));
  return n > 0 ? MAX_GAME_VALUE : 0;
}

/** Ajoute du mana aux trois compteurs (disponible, cycle, total). */
export function addMana(S: GameState, n: number): void {
  const v = bounded(n);
  S.gold = bounded(bounded(S.gold) + v);
  S.run = bounded(bounded(S.run) + v);
  S.life = bounded(bounded(S.life) + v);
}

export const talentLevel = (S: GameState, id: string): number => S.tal[id] || 0;
export const itemCap = (it: Item): number => (it.id === 'claw' ? CLAW_CAP : ITEM_CAP_DEFAULT);
export const itemCount = (S: GameState, it: Item): number => (it.id === 'claw' ? S.claw : S.u[it.id] || 0);

/** Coût cumulé de `q` exemplaires supplémentaires (suite géométrique). */
export function itemCost(S: GameState, it: Item, q: number): number {
  const g = it.growth * 1.035;
  const discount = Math.max(0.55, 1 - 0.02 * talentLevel(S, 'pact'));
  return Math.min(MAX_GAME_VALUE, Math.ceil((1.35 * it.base * Math.pow(g, itemCount(S, it)) * (Math.pow(g, q) - 1)) / (g - 1) * discount));
}

/** Plus grande quantité achetable avec le mana actuel, sans dépasser `free` places restantes. */
export function maxAffordable(S: GameState, it: Item, free: number): number {
  if (!(free > 0)) return 0;
  let lo = 0;
  let hi = free;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (itemCost(S, it, mid) <= S.gold) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export const talentCost = (base: number, level: number): number => Math.ceil(base * Math.pow(1.7, level));

export const achievementCount = (S: GameState): number => Object.keys(S.ach).length;

/** Bonus de production apporté par chaque braise, selon le nombre de renaissances. */
export const perEmber = (ranks: number): number => 0.06 + 0.008 * Math.min(ranks, 10) + 0.003 * Math.max(0, ranks - 10);

/** Bonus de production apporté par chaque étoile. */
export const starValue = (S: GameState): number => 0.25 + 0.05 * S.asc + 0.02 * (S.ascTal.eternal || 0);

export function prestigeProduction(S: GameState): number {
  let value = 1;
  for (const m of PRODUCTION_MILESTONES) if ((S.rk || 0) >= m.rank) value = m.mult;
  return value;
}

export const nextProductionMilestone = (S: GameState) => PRODUCTION_MILESTONES.find((m) => (S.rk || 0) < m.rank) ?? null;

export const oathLevel = (S: GameState, id: AscPathId): number => (S.path === id ? S.pathLoy || 0 : 0);

export const equippedRelics = (S: GameState): Relic[] => RELICS.filter((r) => S.relicEquip[r.slot] === r.id);
export const setCount = (S: GameState, id: string): number => equippedRelics(S).filter((r) => r.set === id).length;
export const relicEffect = (S: GameState, kind: RelicEffectKind): Relic | undefined => equippedRelics(S).find((r) => r.effect === kind);
export const hasRelic = (S: GameState, id: string): boolean => S.relicOwned.includes(id);

export const discoveredDexCount = (S: GameState): number => Object.keys(S.dragonDex).filter((k) => S.dragonDex[k] > 0).length;
export const restoredSanctuaries = (S: GameState): number => Object.keys(S.sanctuaries).filter((k) => S.sanctuaries[k]).length;

/** Multiplicateur global : braises, succès, étoiles, talents, reliques, codex, sanctuaires, serment. */
export function multiplier(S: GameState): number {
  return bounded(
    (1 + S.eAll * perEmber(S.ranks) * 0.65) *
      (1 + 0.006 * achievementCount(S)) *
      (1 + S.stars * starValue(S) * 0.7) *
      (1 + 0.12 * talentLevel(S, 'vein')) *
      (1 + (relicEffect(S, 'production')?.value || 0)) *
      (setCount(S, 'archon') >= 2 ? 1.08 : 1) *
      (1 + DEX_BONUS * discoveredDexCount(S)) *
      (1 + SANCTUARY_BONUS * restoredSanctuaries(S)) *
      (1 + 0.25 * oathLevel(S, 'archmage'))
  );
}

/** Mana de base par souffle, avant griffes. */
export const breathPower = (S: GameState): number => bounded(multiplier(S) * (1 + 0.25 * talentLevel(S, 'eye')) * prestigeProduction(S));

/** Production passive hors bonus temporaires. */
export function baseSps(S: GameState): number {
  const raw = ITEMS.reduce((a, it) => a + (it.sps || 0) * itemCount(S, it), 0);
  return bounded(raw * multiplier(S) * (1 + 0.08 * (S.ascTal.archmage || 0)) * prestigeProduction(S));
}

export const surgeFactor = (S: GameState): number => (setCount(S, 'archon') >= 3 ? 7 : 5);

/** Production passive effective (Surcharge arcanique comprise). */
export function sps(S: GameState, now = Date.now()): number {
  const buff = now < (S.buffUntil || 0) ? (setCount(S, 'archon') >= 3 ? 3 : 2.5) : 1;
  return bounded(baseSps(S) * buff);
}

/** Mana gagné par souffle (sans combo). */
export const clickValue = (S: GameState): number =>
  bounded((1 + S.claw) * breathPower(S) * (1 + 0.12 * (S.ascTal.devourer || 0)) * (1 + 0.25 * oathLevel(S, 'devourer')));

/** Mana à récolter dans le cycle pour la prochaine renaissance. */
export const rebirthThreshold = (S: GameState): number => Math.min(MAX_GAME_VALUE, 10000 * Math.pow(2.55, S.ranks));

export function emberGain(S: GameState): number {
  if (S.ranks >= REBIRTH_CAP) return 0;
  const q = S.run / rebirthThreshold(S);
  return q < 1 ? 0 : Math.floor(Math.sqrt(q) * (1 + 0.25 * Math.min(S.ranks, 8)) * (1 + 0.15 * oathLevel(S, 'eternal')));
}

export function starGain(S: GameState): number {
  if (S.asc >= ASC_CAP || S.ranks < 4) return 0;
  return Math.floor(Math.sqrt(S.eAll / STAR_BRAISE_THRESHOLD) * (1 + 0.3 * oathLevel(S, 'void')));
}

export const fragmentsForStars = (stars: number): number => Math.max(1, Math.floor(Math.sqrt(stars)));

export function stageIndex(S: GameState): number {
  let k = 0;
  STAGES.forEach((s, i) => {
    if (S.life >= s.threshold) k = i;
  });
  return k;
}

/** Avancement (0–1, échelle logarithmique) vers le stade suivant. */
export function stageProgress(S: GameState): number {
  const k = stageIndex(S);
  const next = STAGES[k + 1];
  if (!next) return 1;
  const lo = Math.log10(STAGES[k].threshold + 10);
  return Math.max(0, Math.min(1, (Math.log10(S.life + 10) - lo) / (Math.log10(next.threshold + 10) - lo)));
}
