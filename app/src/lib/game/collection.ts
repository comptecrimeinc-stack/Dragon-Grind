import { DEX_TO_DRAGON, DRAGON_DEX, EGG_TAPS_TO_HATCH, MAX_GAME_VALUE, SANCTUARIES } from './constants';
import { bumpAdventureDaily } from './adventure';
import { ensureDaily } from './daily';
import { addMana, discoveredDexCount, bounded, sps } from './economy';
import { formatNumber as f } from './format';
import type { Fx } from './fx';
import type { AdventureState, GameState } from './state';

export const eggsOpened = (S: GameState): number => Math.max(0, Math.floor(S.eggsOpened || 0));
export const eggPrice = (S: GameState): number => Math.min(MAX_GAME_VALUE, Math.ceil(1000 * Math.pow(2.15, Math.min(eggsOpened(S), 500))));
export const eggWarmth = (S: GameState): number => Math.min(1, Math.max(0, S.eggWarm || 0));
export const dexComplete = (S: GameState): boolean => discoveredDexCount(S) >= DRAGON_DEX.length;

/** Achète un œuf et le place en couvaison. */
export function startIncubation(S: GameState, fx: Fx): boolean {
  const price = eggPrice(S);
  if (eggWarmth(S) > 0 || dexComplete(S) || S.gold < price) return false;
  S.gold -= price;
  S.eggWarm = 1 / EGG_TAPS_TO_HATCH;
  fx.toast('L’œuf est en couvaison : tapote-le dans la Collection pour le réchauffer !');
  return true;
}

/** Réchauffe l'œuf ; il éclot au quinzième tapotement. Renvoie true à l'éclosion. */
export function warmEgg(S: GameState, fx: Fx, now = Date.now(), rng = Math.random): boolean {
  const warm = eggWarmth(S);
  if (warm <= 0) return false;
  S.eggWarm = Math.min(1, warm + 1 / EGG_TAPS_TO_HATCH);
  if (S.eggWarm < 1 - 1e-9) return false;
  S.eggWarm = 0;
  hatchEgg(S, fx, now, rng);
  return true;
}

/** Éclosion : 72 % de chances de révéler une lignée manquante tant qu'il en reste. */
export function hatchEgg(S: GameState, fx: Fx, now = Date.now(), rng = Math.random): string {
  fx.sound('hatch');
  const price = eggPrice(S);
  S.eggsOpened = eggsOpened(S) + 1;
  const missing = DRAGON_DEX.filter((d) => !S.dragonDex[d.id]);
  const chosen = missing.length && rng() < 0.72 ? missing[Math.floor(rng() * missing.length)] : DRAGON_DEX[Math.floor(rng() * DRAGON_DEX.length)];
  const previous = S.dragonDex[chosen.id] || 0;
  S.dragonDex[chosen.id] = previous + 1;
  const reward = previous ? Math.max(1, Math.floor(price * 0.18)) : Math.max(100, Math.floor(price * 0.35));
  addMana(S, reward);
  ensureDaily(S, now);
  S.daily.progress.egg = (S.daily.progress.egg || 0) + 1;
  const a = S.adventure;
  if (a) {
    const dragonId = DEX_TO_DRAGON[Number(chosen.id)];
    if (previous) a.fragments += 5;
    else if (dragonId && !a.owned.includes(dragonId)) {
      a.owned.push(dragonId);
      a.levels[dragonId] = 1;
    }
    bumpAdventureDaily(a, 'eggs', now);
  }
  fx.toast(
    previous
      ? chosen.name + ' découvert à nouveau : +' + f(reward) + ' mana et 5 fragments d’aventure !'
      : 'Éclosion ! Nouveau dragon ' + chosen.name + ' · +1,2 % de production permanent'
  );
  return chosen.id;
}

export function restoreSanctuary(S: GameState, id: string, fx: Fx): boolean {
  const z = SANCTUARIES.find((x) => x.id === id);
  if (!z || S.sanctuaries[id] || S.gold < z.cost) return false;
  S.gold = Math.max(0, S.gold - z.cost);
  S.sanctuaries[id] = 1;
  fx.toast(z.name + ' restauré · +3 % de production permanente');
  return true;
}

export interface WorldSecret {
  id: string;
  icon: string;
  name: string;
  hint: string;
  reward: string;
  condition: (S: GameState) => boolean;
  grant: (a: AdventureState) => void;
}

export const WORLD_SECRETS: WorldSecret[] = [
  {
    id: 'crystalGrotto', icon: '💎', name: 'Grotte aux cristaux',
    hint: 'Un passage s’ouvre après avoir débloqué 3 zones d’aventure.', reward: '15 fragments d’aventure et 10 matériaux',
    condition: (S) => (S.adventure?.unlocked || 0) >= 3,
    grant: (a) => { a.fragments += 15; a.materials += 10; }
  },
  {
    id: 'forgottenNest', icon: '🥚', name: 'Nid oublié',
    hint: 'Les traces du nid apparaissent après 3 éclosions.', reward: '20 fragments d’aventure',
    condition: (S) => eggsOpened(S) >= 3,
    grant: (a) => { a.fragments += 20; }
  },
  {
    id: 'ancientArchive', icon: '📜', name: 'Archives des anciens',
    hint: 'Les archives deviennent accessibles après 5 victoires contre des boss d’aventure.', reward: '25 fragments et 20 matériaux',
    condition: (S) => (S.adventure?.bossWins || 0) >= 5,
    grant: (a) => { a.fragments += 25; a.materials += 20; }
  }
];

export function revealSecret(S: GameState, id: string, fx: Fx): boolean {
  const secret = WORLD_SECRETS.find((x) => x.id === id);
  if (!secret || S.secrets[id] || !secret.condition(S) || !S.adventure) return false;
  secret.grant(S.adventure);
  S.secrets[id] = 1;
  fx.toast('Secret découvert : ' + secret.name + ' !');
  return true;
}

export type SurpriseKind = 'meteor' | 'ember' | 'shard';

export function rollSurprise(rng = Math.random): SurpriseKind {
  const r = rng();
  return r < 0.55 ? 'meteor' : r < 0.85 ? 'ember' : 'shard';
}

export const SURPRISE_ICONS: Record<SurpriseKind, string> = { meteor: '☄️', ember: '🔥', shard: '🌠' };

/** Récompense d'une surprise de la forge attrapée à temps. */
export function collectSurprise(S: GameState, kind: SurpriseKind, fx: Fx, now = Date.now(), rng = Math.random): void {
  fx.sound('collect');
  ensureDaily(S, now);
  S.daily.progress.surp = (S.daily.progress.surp || 0) + 1;
  S.evCaught = (S.evCaught || 0) + 1;
  if (kind === 'meteor') {
    const g = bounded(Math.max(60, Math.ceil(sps(S, now) * (60 + rng() * 120))));
    addMana(S, g);
    fx.toast('☄️ Météorite de mana capturée : +' + f(g) + ' mana !');
  } else if (kind === 'ember') {
    const g = 2 + Math.floor(rng() * 3);
    S.embers += g;
    S.eAll += g;
    fx.toast('🔥 Comète de braises capturée : +' + g + ' braises pour tes talents !');
  } else {
    const g = 1 + Math.floor(rng() * 2);
    S.relicShards += g;
    fx.toast('🌠 Étoile filante capturée : +' + g + ' fragment' + (g > 1 ? 's' : '') + ' de relique !');
  }
}
