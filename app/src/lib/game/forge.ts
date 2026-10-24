import { ASC_PATHS, ITEMS, OATH_PATHS, RELICS, TALENTS, type AscPathId } from './constants';
import {
  emberGain,
  fragmentsForStars,
  hasRelic,
  itemCap,
  itemCost,
  itemCount,
  maxAffordable,
  perEmber,
  starGain,
  talentCost,
  talentLevel
} from './economy';
import { ensureDaily } from './daily';
import { percent, plural } from './format';
import type { Fx } from './fx';
import type { GameState } from './state';

export type BuyQuantity = 1 | 10 | 50 | 'max';

/** Quantité réellement achetée pour un mode donné (au moins 1 pour l'affichage du prix). */
export function purchaseQuantity(S: GameState, itemId: string, mode: BuyQuantity): number {
  const it = ITEMS.find((x) => x.id === itemId)!;
  const free = itemCap(it) - itemCount(S, it);
  if (mode === 'max') return Math.max(1, maxAffordable(S, it, free));
  return Math.max(1, Math.min(mode, Math.max(free, 1)));
}

export function buyItem(S: GameState, itemId: string, mode: BuyQuantity, fx: Fx, now = Date.now()): boolean {
  const it = ITEMS.find((x) => x.id === itemId);
  if (!it) return false;
  const free = itemCap(it) - itemCount(S, it);
  if (free <= 0) return false;
  const q = mode === 'max' ? maxAffordable(S, it, free) : Math.min(mode, free);
  const cost = itemCost(S, it, q);
  if (q <= 0 || S.gold < cost) return false;
  S.gold -= cost;
  if (it.id === 'claw') S.claw += q;
  else S.u[it.id] = itemCount(S, it) + q;
  ensureDaily(S, now);
  S.daily.progress.buys = (S.daily.progress.buys || 0) + q;
  fx.sound('buy');
  return true;
}

export function buyTalent(S: GameState, talentId: string, now = Date.now()): boolean {
  const t = TALENTS.find((x) => x.id === talentId);
  if (!t) return false;
  const level = talentLevel(S, t.id);
  const cost = talentCost(t.base, level);
  if (level >= t.max || S.embers < cost) return false;
  S.embers -= cost;
  S.tal[t.id] = level + 1;
  ensureDaily(S, now);
  S.daily.progress.tal = (S.daily.progress.tal || 0) + 1;
  return true;
}

/** Forge une relique (puis l'équipe) ou équipe une relique possédée. */
export function forgeOrEquipRelic(S: GameState, relicId: string, fx: Fx): boolean {
  const r = RELICS.find((x) => x.id === relicId);
  if (!r) return false;
  const equipped = S.relicEquip[r.slot] === r.id;
  if (equipped) return false;
  if (!hasRelic(S, r.id)) {
    const slotBusy = !!S.relicEquip[r.slot];
    if ((S.relicShards || 0) < r.cost || slotBusy) return false;
    S.relicShards -= r.cost;
    S.relicOwned.push(r.id);
    S.relicEquip[r.slot] = r.id;
    fx.toast('Relique forgée et équipée : ' + r.name);
    return true;
  }
  S.relicEquip[r.slot] = r.id;
  fx.toast('Relique équipée : ' + r.name);
  return true;
}

/** Remise à zéro du cycle : mana, améliorations et griffes. */
function wipeCycle(S: GameState): void {
  S.gold = 0;
  S.run = 0;
  S.claw = 0;
  S.u = {};
}

export function rebirth(S: GameState, fx: Fx): boolean {
  const gain = emberGain(S);
  if (gain < 1) return false;
  fx.sound('transcend');
  S.embers += gain;
  S.eAll += gain;
  S.ranks++;
  S.rk++;
  wipeCycle(S);
  S.gold = 150 * talentLevel(S, 'gift') * S.ranks;
  fx.toast('Renaissance n°' + S.ranks + ' : +' + plural(gain, 'braise') + ', chaque braise vaut +' + percent(perEmber(S.ranks)) + ' %');
  return true;
}

export function ascend(S: GameState, fx: Fx): boolean {
  const gain = starGain(S);
  if (gain < 1) return false;
  const fragments = fragmentsForStars(gain);
  fx.sound('transcend');
  S.stars += gain;
  S.asc++;
  S.ascPts = (S.ascPts || 0) + fragments;
  wipeCycle(S);
  S.embers = 0;
  S.eAll = 0;
  S.tal = {};
  S.ranks = 0;
  S.skillCd = {};
  S.buffUntil = 0;
  fx.toast('Ascension ! +' + plural(gain, 'étoile') + ' et +' + plural(fragments, 'fragment de transcendance') + ' permanents');
  return true;
}

export const ascPathCost = (level: number): number => level + 1;

export function buyAscPath(S: GameState, id: AscPathId, fx: Fx): boolean {
  const path = ASC_PATHS.find((p) => p.id === id)!;
  const level = S.ascTal[id] || 0;
  const cost = ascPathCost(level);
  if (level >= path.max || (S.ascPts || 0) < cost) return false;
  S.ascPts -= cost;
  S.ascTal[id] = level + 1;
  fx.toast('Voie ' + path.name + ' renforcée · niveau ' + (level + 1));
  return true;
}

export const oathsAvailable = (S: GameState): number => (S.asc || 0) - (S.oaths || 0);

/** Prête serment : la fidélité grandit si l'on renouvelle la même voie, retombe à 1 sinon. */
export function swearOath(S: GameState, id: AscPathId, fx: Fx): boolean {
  if (oathsAvailable(S) <= 0) return false;
  const same = S.path === id;
  S.path = id;
  S.pathLoy = same ? (S.pathLoy || 0) + 1 : 1;
  S.oaths = (S.oaths || 0) + 1;
  const p = OATH_PATHS.find((x) => x.id === id)!;
  fx.sound('transcend');
  fx.toast('Serment scellé : ' + p.name + (same ? ' · fidélité ×' + S.pathLoy : ' — la faveur précédente s’éteint.'));
  return true;
}

/** Libellé du bonus d'un serment au niveau de fidélité donné. */
export function oathEffect(id: AscPathId, level: number): string {
  const p = OATH_PATHS.find((x) => x.id === id)!;
  return p.effect + ' ×' + (1 + p.step * level).toFixed(2).replace('.', ',');
}
