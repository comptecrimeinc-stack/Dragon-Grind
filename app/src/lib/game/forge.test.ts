import { describe, expect, it } from 'vitest';
import { rebirthThreshold } from './economy';
import { ascend, buyAscPath, buyItem, buyTalent, forgeOrEquipRelic, oathEffect, purchaseQuantity, rebirth, swearOath } from './forge';
import { recordingFx } from './fx';
import { freshState } from './state';

describe('forge', () => {
  it('achète des améliorations et compte le contrat', () => {
    const S = freshState();
    S.gold = 1000;
    const fx = recordingFx();
    expect(buyItem(S, 'lut', 10, fx)).toBe(true);
    expect(S.u.lut).toBe(10);
    expect(S.gold).toBeLessThan(1000);
    expect(S.daily.progress.buys).toBe(10);
    expect(fx.sounds).toEqual(['buy']);
  });

  it('refuse un achat trop cher ou au plafond', () => {
    const S = freshState();
    expect(buyItem(S, 'lut', 1, recordingFx())).toBe(false);
    S.gold = 1e30;
    S.u.lut = 50;
    expect(buyItem(S, 'lut', 1, recordingFx())).toBe(false);
  });

  it('achète le maximum abordable', () => {
    const S = freshState();
    S.gold = 5000;
    const q = purchaseQuantity(S, 'lut', 'max');
    buyItem(S, 'lut', 'max', recordingFx());
    expect(S.u.lut).toBe(q);
  });

  it('les griffes augmentent le compteur dédié', () => {
    const S = freshState();
    S.gold = 100;
    buyItem(S, 'claw', 1, recordingFx());
    expect(S.claw).toBe(1);
  });

  it('achète des talents avec des braises', () => {
    const S = freshState();
    S.embers = 3;
    expect(buyTalent(S, 'eye')).toBe(true);
    expect(S.tal.eye).toBe(1);
    expect(S.embers).toBe(0);
    expect(buyTalent(S, 'eye')).toBe(false);
  });

  it('forge puis équipe une relique', () => {
    const S = freshState();
    S.relicShards = 10;
    expect(forgeOrEquipRelic(S, 'titanfang', recordingFx())).toBe(true);
    expect(S.relicEquip.weapon).toBe('titanfang');
    expect(S.relicShards).toBe(8);
    // L'emplacement est pris : impossible de forger une autre arme…
    expect(forgeOrEquipRelic(S, 'emberheart', recordingFx())).toBe(false);
  });

  it('renaît en gardant les braises et en vidant le cycle', () => {
    const S = freshState();
    S.run = rebirthThreshold(S) * 9;
    S.gold = 123;
    S.u.lut = 5;
    S.tal.gift = 2;
    expect(rebirth(S, recordingFx())).toBe(true);
    expect(S.embers).toBe(3);
    expect(S.rk).toBe(1);
    expect(S.u).toEqual({});
    expect(S.gold).toBe(150 * 2 * 1);
  });

  it('transcende en convertissant les braises en étoiles', () => {
    const S = freshState();
    S.ranks = 4;
    S.eAll = 20;
    S.tal.eye = 3;
    expect(ascend(S, recordingFx())).toBe(true);
    expect(S.stars).toBe(2);
    expect(S.asc).toBe(1);
    expect(S.ascPts).toBe(1);
    expect(S.tal).toEqual({});
    expect(S.ranks).toBe(0);
  });

  it('renforce les voies de transcendance', () => {
    const S = freshState();
    S.ascPts = 3;
    expect(buyAscPath(S, 'void', recordingFx())).toBe(true);
    expect(buyAscPath(S, 'void', recordingFx())).toBe(true);
    expect(S.ascTal.void).toBe(2);
    expect(S.ascPts).toBe(0);
  });

  it('serments : fidélité cumulée sur une voie, perdue en changeant', () => {
    const S = freshState();
    S.asc = 3;
    swearOath(S, 'devourer', recordingFx());
    swearOath(S, 'devourer', recordingFx());
    expect(S.pathLoy).toBe(2);
    swearOath(S, 'void', recordingFx());
    expect(S.pathLoy).toBe(1);
    expect(swearOath(S, 'void', recordingFx())).toBe(false);
    expect(oathEffect('devourer', 2)).toBe('Puissance du souffle ×1,50');
  });
});
