import { COMBO_MAX, COMBO_WINDOW_MS, MAX_FORGE_CPS } from './constants';
import { countBossInterrupt, damageTitan, syncTitanHp, updateBossEncounter } from './combat';
import { ensureDaily } from './daily';
import { addMana, baseSps, clickValue, sps, talentLevel } from './economy';
import type { Fx } from './fx';
import { checkAchievements, checkLineages } from './progression';
import type { GameState } from './state';

/**
 * Limiteur de cadence des souffles : au plus MAX_FORGE_CPS par seconde glissante.
 * Préserve l'équilibre du jeu face aux autoclickers.
 */
export class TapLimiter {
  private stamps: number[] = [];

  constructor(private readonly maxPerSecond = MAX_FORGE_CPS) {}

  allow(now: number): boolean {
    while (this.stamps.length && now - this.stamps[0] >= 1000) this.stamps.shift();
    if (this.stamps.length >= this.maxPerSecond) return false;
    this.stamps.push(now);
    return true;
  }
}

/** Un souffle sur le dragon : mana (bonus de combo), dégâts au titan, progression des contrats. */
export function breathe(S: GameState, fx: Fx, now = Date.now()): number {
  fx.sound('tap');
  S.combo = S.comboAt && now - S.comboAt < COMBO_WINDOW_MS ? Math.min(COMBO_MAX, (S.combo || 0) + 1) : 1;
  S.comboAt = now;
  const gain = clickValue(S) * (1 + (S.combo - 1) * 0.06);
  addMana(S, gain);
  S.taps++;
  ensureDaily(S, now);
  S.daily.progress.taps = (S.daily.progress.taps || 0) + 1;
  if (S.combo >= 10) S.daily.progress.combo = Math.max(1, S.daily.progress.combo || 0);
  damageTitan(S, gain, 'tap', fx, now);
  countBossInterrupt(S, fx, now);
  return gain;
}

/** Au-delà de cet écart, l'onglet était suspendu : c'est la progression hors ligne qui s'en charge. */
const MAX_TICK_SECONDS = 60;

/** Avance la partie jusqu'à `now` : production passive, dégâts passifs, attaques du titan, déblocages. */
export function tick(S: GameState, fx: Fx, now = Date.now()): void {
  const dt = Math.max(0, Math.min((now - S.t) / 1000, MAX_TICK_SECONDS));
  S.t = now;
  ensureDaily(S, now);
  syncTitanHp(S);
  const penalty = now < (S.bossWeakenUntil || 0) ? 0.5 : 1;
  const gain = sps(S, now) * dt * penalty;
  if (gain > 0) addMana(S, gain);
  S.playMs = (S.playMs || 0) + dt * 1000;
  if (gain > 0 && S.bossHp > 0) damageTitan(S, gain * 0.12, 'passive', fx, now);
  updateBossEncounter(S, fx, now);
  checkAchievements(S, fx);
  checkLineages(S, fx);
}

export const offlineCapSeconds = (S: GameState): number => 8 * 3600 + talentLevel(S, 'sleep') * 2 * 3600;

/**
 * Production hors ligne : moitié de la production de base, plafonnée (8 h + Sommeil profond).
 * Ignorée pour une absence de 30 s ou moins.
 */
export function applyOfflineProgress(S: GameState, seconds: number): { seconds: number; earned: number } {
  if (seconds <= 30) return { seconds: 0, earned: 0 };
  const effective = Math.min(seconds, offlineCapSeconds(S));
  const earned = Math.max(0, baseSps(S)) * effective * 0.5;
  if (earned > 0) addMana(S, earned);
  return { seconds: effective, earned };
}
