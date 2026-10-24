import { describe, expect, it } from 'vitest';
import { ITEMS, MAX_GAME_VALUE } from './constants';
import {
  addMana,
  baseSps,
  bounded,
  clickValue,
  emberGain,
  itemCost,
  maxAffordable,
  multiplier,
  prestigeProduction,
  rebirthThreshold,
  sps,
  stageIndex,
  stageProgress,
  starGain
} from './economy';
import { freshState } from './state';

const item = (id: string) => ITEMS.find((i) => i.id === id)!;

describe('économie', () => {
  it('borne les valeurs', () => {
    expect(bounded(-3)).toBe(0);
    expect(bounded(Infinity)).toBe(MAX_GAME_VALUE);
    expect(bounded(NaN)).toBe(0);
  });

  it('ajoute le mana aux trois compteurs', () => {
    const S = freshState();
    addMana(S, 100);
    expect([S.gold, S.run, S.life]).toEqual([100, 100, 100]);
  });

  it('calcule le coût cumulé et le pacte des gnomes', () => {
    const S = freshState();
    const one = itemCost(S, item('lut'), 1);
    expect(one).toBe(Math.ceil(1.35 * 15));
    expect(itemCost(S, item('lut'), 10)).toBeGreaterThan(one * 10);
    S.tal.pact = 10;
    expect(itemCost(S, item('lut'), 1)).toBeLessThan(one);
  });

  it('trouve la quantité maximale abordable', () => {
    const S = freshState();
    S.gold = itemCost(S, item('lut'), 7);
    expect(maxAffordable(S, item('lut'), 50)).toBe(7);
    expect(maxAffordable(S, item('lut'), 3)).toBe(3);
    expect(maxAffordable(S, item('lut'), 0)).toBe(0);
  });

  it('produit du mana selon les unités possédées', () => {
    const S = freshState();
    expect(baseSps(S)).toBe(0);
    S.u.lut = 10;
    expect(baseSps(S)).toBeCloseTo(3);
    S.buffUntil = 2000;
    expect(sps(S, 1000)).toBeCloseTo(7.5);
    expect(sps(S, 3000)).toBeCloseTo(3);
  });

  it('applique griffes et sceaux de renaissance au souffle', () => {
    const S = freshState();
    expect(clickValue(S)).toBe(1);
    S.claw = 4;
    expect(clickValue(S)).toBe(5);
    S.rk = 8;
    expect(prestigeProduction(S)).toBe(5);
    expect(clickValue(S)).toBe(25);
  });

  it('cumule les bonus multiplicatifs', () => {
    const S = freshState();
    expect(multiplier(S)).toBe(1);
    S.sanctuaries = { water: 1, fire: 1 };
    expect(multiplier(S)).toBeCloseTo(1.06);
  });

  it('accorde des braises au-delà du seuil de renaissance', () => {
    const S = freshState();
    expect(emberGain(S)).toBe(0);
    S.run = rebirthThreshold(S) * 4;
    expect(emberGain(S)).toBe(2);
    S.ranks = 20;
    expect(emberGain(S)).toBe(0);
  });

  it('accorde des étoiles après quatre renaissances', () => {
    const S = freshState();
    S.eAll = 20;
    expect(starGain(S)).toBe(0);
    S.ranks = 4;
    expect(starGain(S)).toBe(2);
  });

  it('détermine le stade et sa progression', () => {
    const S = freshState();
    expect(stageIndex(S)).toBe(0);
    S.life = 1e5;
    expect(stageIndex(S)).toBe(2);
    expect(stageProgress(S)).toBe(0);
    S.life = 1e12;
    expect(stageProgress(S)).toBe(1);
  });
});
