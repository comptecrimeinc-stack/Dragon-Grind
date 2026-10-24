import {
  COMBO_MAX,
  LINEAGES,
  LINEAGE_TARGETS,
  MAX_GAME_VALUE,
  TITANS,
  TITAN_CAP,
  TITAN_TRAITS,
  type DamageSource,
  type SkillId
} from './constants';
import { addMana, clickValue, relicEffect, setCount, sps } from './economy';
import { ensureDaily } from './daily';
import { formatNumber as f } from './format';
import type { Fx } from './fx';
import type { GameState } from './state';

/** Lignée visuelle active (0 si la lignée enregistrée n'est pas débloquée). */
export function activeLineage(S: GameState): number {
  return S.v > 0 && S.vu[S.v] ? Math.min(S.v, LINEAGES.length - 1) : 0;
}

export const huntComplete = (S: GameState): boolean => (S.boss || 0) >= TITAN_CAP;

export function titanName(S: GameState): string {
  const base = TITANS[Math.min(S.boss, TITANS.length - 1)];
  return S.boss >= TITANS.length ? base + ' · Éveillé ' + (S.boss - TITANS.length + 1) : base;
}

export const titanMax = (S: GameState): number => Math.min(MAX_GAME_VALUE, Math.floor(250 * Math.pow(2.15, S.boss) * (1 + S.asc * 0.35)));
export const titanTraitIndex = (S: GameState): number => Math.min(S.boss || 0, TITAN_TRAITS.length - 1);
export const titanTrait = (S: GameState) => TITAN_TRAITS[titanTraitIndex(S)];

/** Mana gagné en terrassant le titan d'indice `index`. */
export function titanReward(S: GameState, index = S.boss): number {
  return Math.min(MAX_GAME_VALUE, Math.floor(350 * Math.pow(2.45, index) * (1 + S.asc * 0.2) * (1 + 0.08 * (S.ascTal.void || 0))));
}

/** Les titans de rang 5, 10, 15… lâchent une braise et un fragment supplémentaire. */
export const titanGivesEmber = (index: number): boolean => index % 5 === 4;

export interface Matchup {
  lineageName: string;
  advantage: boolean;
  mult: number;
  targets: string[];
}

export function lineageMatchup(S: GameState): Matchup {
  const v = activeLineage(S);
  const targets = LINEAGE_TARGETS[v] || [];
  const advantage = targets.includes(titanTraitIndex(S));
  return { lineageName: LINEAGES[v].name, advantage, mult: advantage ? 1.25 : 1, targets: targets.map((i) => TITANS[i]) };
}

export interface PhaseInfo {
  max: number;
  hp: number;
  ratio: number;
  phase: 1 | 2 | 3;
  progress: number;
}

export function bossPhaseInfo(S: GameState): PhaseInfo {
  const max = titanMax(S);
  const hp = Math.max(0, S.bossHp || max);
  const ratio = max ? hp / max : 1;
  const phase = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
  const progress = phase === 1 ? (1 - ratio) / 0.34 : phase === 2 ? (0.66 - ratio) / 0.33 : (0.33 - ratio) / 0.33;
  return { max, hp, ratio, phase, progress: Math.max(0, Math.min(1, progress)) };
}

/** Attaque spéciale de la phase en cours et nombre de frappes pour l'interrompre. */
export function titanAttack(S: GameState, phase = bossPhaseInfo(S).phase) {
  const t = titanTrait(S);
  const i = Math.max(0, Math.min(2, phase - 1));
  const need = Math.max(5, t.needs[i] - (lineageMatchup(S).advantage ? 1 : 0));
  return { name: t.attacks[i], need };
}

/** Remet les PV du titan au maximum s'ils ne sont pas encore initialisés (ou hors bornes). */
export function syncTitanHp(S: GameState): void {
  if (huntComplete(S)) return;
  const max = titanMax(S);
  if (!S.bossHp || S.bossHp > max) S.bossHp = max;
}

const stunBonus = (S: GameState): number => relicEffect(S, 'stun')?.value || 0;

/** Chaque frappe pendant l'incantation compte pour l'interruption. */
export function countBossInterrupt(S: GameState, fx: Fx, now = Date.now()): void {
  if (!(S.bossTelegraphUntil > now)) return;
  S.bossInterrupts = (S.bossInterrupts || 0) + 1;
  if (S.bossInterrupts < titanAttack(S).need) return;
  const fullBreaker = setCount(S, 'breaker') >= 3;
  const setAwake = fullBreaker ? 3000 : 0;
  S.bossTelegraphUntil = 0;
  S.bossInterrupts = 0;
  S.bossStunUntil = now + 5000 + stunBonus(S) + setAwake;
  S.bossAttackAt = now + 16000 + stunBonus(S) + setAwake;
  const bonus = Math.max(100, Math.floor(sps(S, now) * 3 + clickValue(S) * 10)) * (fullBreaker ? 2 : 1);
  addMana(S, bonus);
  fx.toast(
    'Attaque interrompue ! Titan vulnérable ' + (S.bossStunUntil - now) / 1000 + ' s · +' + f(bonus) + ' mana' + (setAwake ? ' · Ensemble du Briseur éveillé' : '')
  );
}

/** Fait avancer le cycle d'attaque du titan : télégraphe, puis frappe si non interrompu. */
export function updateBossEncounter(S: GameState, fx: Fx, now = Date.now()): void {
  if (huntComplete(S)) return;
  if (!S.bossAttackAt) S.bossAttackAt = now + 14000;
  if (S.bossTelegraphUntil && now >= S.bossTelegraphUntil) {
    fx.sound('shock');
    const phase = bossPhaseInfo(S).phase;
    S.bossTelegraphUntil = 0;
    S.bossInterrupts = 0;
    S.bossWeakenUntil = now + 5000;
    S.bossAttackAt = now + 15000;
    const lossFactor = 1 - (relicEffect(S, 'loss')?.value || 0);
    const loss = Math.min(S.gold, Math.max(0, Math.floor(S.gold * (0.025 + 0.01 * phase) * (lineageMatchup(S).advantage ? 0.75 : 1) * lossFactor)));
    S.gold -= loss;
    let extra = '';
    switch (titanTraitIndex(S)) {
      case 1:
        S.combo = 0;
        S.comboAt = 0;
        extra = ' · Combo pétrifié';
        break;
      case 2:
        for (const k of ['strike', 'surge', 'devour']) S.skillCd[k] = Math.max(S.skillCd[k] || 0, now + 3000);
        extra = ' · Compétences retardées 3 s';
        break;
      case 3: {
        const crush = Math.min(S.gold, Math.floor(S.gold * 0.02));
        S.gold -= crush;
        extra = crush ? ' · Armure écrasante : -' + f(crush) + ' mana' : ' · Armure écrasante';
        break;
      }
      case 5:
        S.buffUntil = Math.min(S.buffUntil || 0, now);
        extra = ' · Surcharge dissipée';
        break;
    }
    fx.toast('Le titan lance son attaque ! -' + f(loss) + ' mana · Production ralentie 5 s' + extra);
  }
  if (!S.bossTelegraphUntil && now >= S.bossAttackAt && now >= S.bossStunUntil) {
    fx.sound('warn');
    S.bossTelegraphUntil = now + 3500;
    S.bossInterrupts = 0;
  }
}

/** Inflige des dégâts au titan en appliquant trait, lignée, reliques et ensembles. */
export function damageTitan(S: GameState, amount: number, source: DamageSource, fx: Fx, now = Date.now()): void {
  if (!Number.isFinite(amount) || amount <= 0 || huntComplete(S)) return;
  amount *= titanTrait(S).mods[source] ?? 1;
  amount *= lineageMatchup(S).mult;
  const dmg = relicEffect(S, 'dmg');
  if (dmg) amount *= 1 + dmg.value;
  const passive = relicEffect(S, 'passive');
  if (source === 'passive' && passive) amount *= 1 + passive.value;
  const combo = relicEffect(S, 'combo');
  if (combo) amount *= 1 + Math.min(COMBO_MAX, S.combo || 0) * combo.value;
  if (setCount(S, 'breaker') >= 2) amount *= 1.12;

  ensureDaily(S, now);
  syncTitanHp(S);
  S.daily.progress.dmg = (S.daily.progress.dmg || 0) + Math.min(amount, 1e15);
  S.bossHp = Math.max(0, S.bossHp - amount);
  if (S.bossHp > 0) return;

  fx.sound('kill');
  const defeated = S.boss;
  S.bossKills = (S.bossKills || 0) + 1;
  S.boss = defeated + 1;
  const reward = titanReward(S, defeated);
  addMana(S, reward);
  const bonus = titanGivesEmber(defeated);
  if (bonus) {
    S.embers += 1;
    S.eAll += 1;
  }
  const shards = bonus ? 2 : 1;
  S.relicShards = (S.relicShards || 0) + shards;
  S.bossHp = titanMax(S);
  S.bossAttackAt = now + 12000;
  S.bossTelegraphUntil = 0;
  S.bossInterrupts = 0;
  S.bossStunUntil = 0;
  S.bossWeakenUntil = 0;
  S.daily.progress.boss = (S.daily.progress.boss || 0) + 1;
  if (huntComplete(S)) {
    S.bossAttackAt = 9e15;
    S.bossHp = 0;
    fx.toast('✦ La chasse est achevée : les 30 titans sont tombés ! La forge t’appartient, maître des cendres.');
  }
  fx.toast('Titan vaincu ! +' + f(reward) + ' mana · +' + shards + ' fragment' + (shards > 1 ? 's' : '') + (bonus ? ' · +1 braise' : ''));
}

export function skillUnlocked(S: GameState, id: SkillId): boolean {
  if (id === 'strike') return (S.rk || 0) >= 1;
  if (id === 'surge') return (S.rk || 0) >= 3;
  return (S.asc || 0) >= 1;
}

export const skillRemaining = (S: GameState, id: SkillId, now = Date.now()): number => Math.max(0, (S.skillCd[id] || 0) - now);

export function skillCooldown(S: GameState, base: number): number {
  const arch = S.ascTal.archmage || 0;
  const seal = relicEffect(S, 'production')?.id === 'archseal' ? 0.92 : 1;
  const archon = setCount(S, 'archon') >= 3 ? 0.85 : 1;
  return Math.max(2500, base * (1 - 0.08 * arch) * seal * archon);
}

/** Déclenche une compétence active. Renvoie false si elle est verrouillée ou en recharge. */
export function useSkill(S: GameState, id: SkillId, fx: Fx, now = Date.now()): boolean {
  if (!skillUnlocked(S, id) || skillRemaining(S, id, now) > 0) return false;
  const dev = S.ascTal.devourer || 0;
  if (id === 'strike') {
    const damage = Math.max(clickValue(S) * 18, sps(S, now) * 2, 25) * (1 + 0.15 * dev) * (1 + Math.min(COMBO_MAX, S.combo || 0) * 0.025);
    damageTitan(S, damage, 'strike', fx, now);
    countBossInterrupt(S, fx, now);
    S.skillCd.strike = now + skillCooldown(S, 12000);
    S.combo = Math.min(COMBO_MAX, (S.combo || 0) + 3);
    S.comboAt = now;
    fx.toast('Frappe draconique : ' + f(damage) + ' dégâts !');
  } else if (id === 'surge') {
    S.buffUntil = now + 8000;
    S.skillCd.surge = now + skillCooldown(S, 30000);
    fx.toast('Surcharge arcanique : production ×' + (setCount(S, 'archon') >= 3 ? 7 : 5) + ' pendant 8 s !');
  } else {
    const damage = Math.max(clickValue(S) * 8, sps(S, now) * 1.5, 15) * (1 + 0.2 * dev);
    damageTitan(S, damage, 'devour', fx, now);
    countBossInterrupt(S, fx, now);
    const mana = Math.max(100, damage * 2);
    addMana(S, mana);
    S.skillCd.devour = now + skillCooldown(S, 45000);
    fx.toast('Dévoration : ' + f(damage) + ' dégâts · +' + f(mana) + ' mana');
  }
  return true;
}

/** Combo affiché : il retombe s'il n'est pas entretenu. */
export const liveCombo = (S: GameState, now = Date.now()): number => (S.comboAt && now - S.comboAt < 1200 ? S.combo || 0 : 0);
