import { describe, expect, it } from 'vitest';
import { EGG_TAPS_TO_HATCH } from './constants';
import { collectSurprise, eggPrice, restoreSanctuary, revealSecret, rollSurprise, startIncubation, warmEgg } from './collection';
import { recordingFx } from './fx';
import { freshAdventure, freshState } from './state';

/** Générateur déterministe pour les tests. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('œufs', () => {
  it('couve puis éclot après quinze tapotements', () => {
    const S = freshState();
    S.gold = eggPrice(S);
    S.adventure = freshAdventure();
    const fx = recordingFx();
    expect(startIncubation(S, fx)).toBe(true);
    expect(S.gold).toBe(0);
    let hatched = false;
    for (let i = 1; i < EGG_TAPS_TO_HATCH && !hatched; i++) hatched = warmEgg(S, fx, Date.now(), seq(0.1, 0.5));
    expect(hatched).toBe(true);
    expect(S.eggsOpened).toBe(1);
    expect(S.eggWarm).toBe(0);
    expect(Object.keys(S.dragonDex)).toHaveLength(1);
    expect(fx.sounds).toContain('hatch');
  });

  it('une nouvelle lignée recrute le dragon d’aventure correspondant', () => {
    const S = freshState();
    S.adventure = freshAdventure();
    S.eggWarm = 1 - 1 / EGG_TAPS_TO_HATCH;
    // 0,1 < 0,72 → lignée manquante ; 0,3 × 7 → indice 2 (Foudre → storm)
    warmEgg(S, recordingFx(), Date.now(), seq(0.1, 0.3));
    expect(S.dragonDex['2']).toBe(1);
    expect(S.adventure.owned).toContain('storm');
  });

  it('le prix augmente à chaque éclosion', () => {
    const S = freshState();
    const p0 = eggPrice(S);
    S.eggsOpened = 1;
    expect(eggPrice(S)).toBeGreaterThan(p0);
  });
});

describe('sanctuaires et secrets', () => {
  it('restaure un sanctuaire une seule fois', () => {
    const S = freshState();
    S.gold = 3000;
    expect(restoreSanctuary(S, 'water', recordingFx())).toBe(true);
    expect(S.gold).toBe(500);
    expect(restoreSanctuary(S, 'water', recordingFx())).toBe(false);
  });

  it('révèle un secret quand sa condition est remplie', () => {
    const S = freshState();
    S.adventure = freshAdventure();
    expect(revealSecret(S, 'crystalGrotto', recordingFx())).toBe(false);
    S.adventure.unlocked = 3;
    expect(revealSecret(S, 'crystalGrotto', recordingFx())).toBe(true);
    expect(S.adventure.fragments).toBe(15);
  });
});

describe('surprises de la forge', () => {
  it('tire le type selon les probabilités', () => {
    expect(rollSurprise(() => 0.1)).toBe('meteor');
    expect(rollSurprise(() => 0.7)).toBe('ember');
    expect(rollSurprise(() => 0.9)).toBe('shard');
  });

  it('crédite la récompense', () => {
    const S = freshState();
    collectSurprise(S, 'ember', recordingFx(), Date.now(), () => 0);
    expect(S.embers).toBe(2);
    collectSurprise(S, 'meteor', recordingFx(), Date.now(), () => 0);
    expect(S.gold).toBe(60);
    expect(S.evCaught).toBe(2);
  });
});
