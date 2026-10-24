import { CONTRACT_POOL, CONTRACT_REWARDS, MAX_GAME_VALUE, TITAN_CAP, type ContractId } from './constants';
import { addMana, baseSps, clickValue } from './economy';
import { formatNumber as f } from './format';
import type { Fx } from './fx';
import { freshDaily, type GameState } from './state';

/** Date locale au format AAAA-MM-JJ : les contrats se renouvellent à minuit, heure du joueur. */
export function localDate(now = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Réinitialise les contrats quand la date change. */
export function ensureDaily(S: GameState, now = Date.now()): void {
  const today = localDate(now);
  if (S.daily.date !== today) S.daily = freshDaily(today);
}

/** Trois contrats tirés de façon déterministe à partir de la date (FNV-1a puis LCG). */
export function dailyContractIds(date: string): ContractId[] {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) h = ((h ^ date.charCodeAt(i)) * 16777619) >>> 0;
  const pool = CONTRACT_POOL.map((c) => c.id);
  const ids: ContractId[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % pool.length;
    ids.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return ids;
}

export function contractTarget(S: GameState, id: ContractId): number {
  switch (id) {
    case 'taps':
      return 100;
    case 'buys':
      return 3;
    case 'dmg':
      return Math.max(2500, Math.ceil(baseSps(S) * 120));
    default:
      return 1;
  }
}

export const contractProgress = (S: GameState, id: ContractId): number => Math.max(0, S.daily.progress[id] || 0);

/** Contrat « Chasseur de titans » impossible une fois la chasse achevée. */
export const contractLocked = (S: GameState, id: ContractId): boolean => id === 'boss' && (S.boss || 0) >= TITAN_CAP;

/**
 * Récompense adaptative : un socle pour que les contrats comptent en début de partie,
 * puis la production passive et la puissance des souffles la font évoluer.
 */
export function contractReward(S: GameState, id: ContractId): number {
  const c = CONTRACT_REWARDS[id];
  const base = c.base * (1 + (c.perBoss ? S.boss * c.perBoss : 0) + (c.perKill ? S.bossKills * c.perKill : 0));
  return Math.min(MAX_GAME_VALUE, Math.floor(base + Math.max(0, baseSps(S)) * c.incomeSeconds + Math.max(0, clickValue(S)) * c.breaths));
}

export function claimContract(S: GameState, id: ContractId, fx: Fx, now = Date.now()): boolean {
  ensureDaily(S, now);
  if (S.daily.claimed[id] || contractLocked(S, id) || contractProgress(S, id) < contractTarget(S, id)) return false;
  const reward = contractReward(S, id);
  S.daily.claimed[id] = 1;
  addMana(S, reward);
  const ember = id === 'boss';
  if (ember) {
    S.embers += 1;
    S.eAll += 1;
  }
  fx.toast('Contrat accompli : +' + f(reward) + ' mana' + (ember ? ' et 1 braise' : ''));
  return true;
}
