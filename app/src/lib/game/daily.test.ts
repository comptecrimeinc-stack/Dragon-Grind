import { describe, expect, it } from 'vitest';
import { claimContract, contractReward, contractTarget, dailyContractIds, ensureDaily, localDate } from './daily';
import { recordingFx } from './fx';
import { freshState } from './state';

describe('contrats quotidiens', () => {
  it('tire trois contrats distincts, identiques pour une même date', () => {
    const a = dailyContractIds('2026-10-24');
    expect(a).toHaveLength(3);
    expect(new Set(a).size).toBe(3);
    expect(dailyContractIds('2026-10-24')).toEqual(a);
  });

  it('se renouvelle quand la date change', () => {
    const S = freshState();
    const now = new Date(2026, 9, 24, 12).getTime();
    ensureDaily(S, now);
    S.daily.progress.taps = 50;
    ensureDaily(S, now);
    expect(S.daily.progress.taps).toBe(50);
    ensureDaily(S, now + 86_400_000);
    expect(S.daily.progress.taps).toBe(0);
    expect(S.daily.date).toBe(localDate(now + 86_400_000));
  });

  // Régression : le jeu d'origine lisait une propriété inexistante et donnait 0 mana.
  it('donne une récompense finie et positive', () => {
    const S = freshState();
    for (const id of ['taps', 'boss', 'buys', 'combo', 'dmg', 'egg', 'surp', 'tal'] as const) {
      const r = contractReward(S, id);
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThan(0);
    }
    expect(contractReward(S, 'taps')).toBe(50 + 75);
  });

  it('ne se réclame qu’une fois, objectif atteint', () => {
    const S = freshState();
    const fx = recordingFx();
    const now = Date.now();
    ensureDaily(S, now);
    expect(claimContract(S, 'taps', fx, now)).toBe(false);
    S.daily.progress.taps = contractTarget(S, 'taps');
    expect(claimContract(S, 'taps', fx, now)).toBe(true);
    expect(S.gold).toBeGreaterThan(0);
    expect(claimContract(S, 'taps', fx, now)).toBe(false);
  });

  it('le contrat de titan rapporte aussi une braise', () => {
    const S = freshState();
    const now = Date.now();
    ensureDaily(S, now);
    S.daily.progress.boss = 1;
    claimContract(S, 'boss', recordingFx(), now);
    expect(S.embers).toBe(1);
  });
});
