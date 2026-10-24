import { describe, expect, it } from 'vitest';
import { applyOfflineProgress, breathe, offlineCapSeconds, TapLimiter, tick } from './engine';
import { recordingFx } from './fx';
import { freshState } from './state';

describe('souffle', () => {
  it('limite la cadence à vingt souffles par seconde', () => {
    const limiter = new TapLimiter();
    const allowed = Array.from({ length: 30 }, (_, i) => limiter.allow(1000 + i)).filter(Boolean).length;
    expect(allowed).toBe(20);
    expect(limiter.allow(2001)).toBe(true);
  });

  it('laisse passer un tapotement rapide à deux pouces (≈ 15 par seconde)', () => {
    const limiter = new TapLimiter();
    const taps = Array.from({ length: 45 }, (_, i) => limiter.allow(i * 66));
    expect(taps.every(Boolean)).toBe(true);
  });

  it('enchaîne le combo et augmente le gain', () => {
    const S = freshState();
    const fx = recordingFx();
    const first = breathe(S, fx, 1000);
    const second = breathe(S, fx, 1500);
    expect(first).toBe(1);
    expect(second).toBeCloseTo(1.06);
    expect(S.combo).toBe(2);
    breathe(S, fx, 5000);
    expect(S.combo).toBe(1);
    expect(S.taps).toBe(3);
    expect(S.daily.progress.taps).toBe(3);
  });

  it('valide le contrat de combo à dix souffles enchaînés', () => {
    const S = freshState();
    for (let i = 0; i < 10; i++) breathe(S, recordingFx(), 1000 + i * 100);
    expect(S.daily.progress.combo).toBe(1);
  });
});

describe('boucle de jeu', () => {
  it('produit du mana passif et blesse le titan', () => {
    const S = freshState(0);
    S.u.lut = 10;
    tick(S, recordingFx(), 10_000);
    expect(S.gold).toBeCloseTo(30);
    expect(S.bossHp).toBeGreaterThan(0);
    expect(S.playMs).toBe(10_000);
  });

  it('réduit de moitié la production pendant l’affaiblissement', () => {
    const S = freshState(0);
    S.u.lut = 10;
    S.bossWeakenUntil = 100_000;
    tick(S, recordingFx(), 10_000);
    expect(S.gold).toBeCloseTo(15);
  });

  it('ignore les longues suspensions (gérées hors ligne)', () => {
    const S = freshState(0);
    S.u.lut = 10;
    tick(S, recordingFx(), 3_600_000);
    expect(S.gold).toBeCloseTo(3 * 60);
  });
});

describe('hors ligne', () => {
  it('ignore les absences courtes', () => {
    expect(applyOfflineProgress(freshState(), 20).earned).toBe(0);
  });

  it('rend la moitié de la production, plafonnée', () => {
    const S = freshState();
    S.u.lut = 10;
    const r = applyOfflineProgress(S, 100);
    expect(r.earned).toBeCloseTo(150);
    S.tal.sleep = 1;
    expect(offlineCapSeconds(S)).toBe(10 * 3600);
    expect(applyOfflineProgress(S, 1e9).seconds).toBe(10 * 3600);
  });
});
