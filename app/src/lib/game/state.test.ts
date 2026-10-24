import { describe, expect, it } from 'vitest';
import { MAX_GAME_VALUE, SAVE_VERSION } from './constants';
import { freshState, normalizeSaveData, SaveValidationError } from './state';

describe('normalizeSaveData', () => {
  it('complète une sauvegarde partielle avec les valeurs par défaut', () => {
    const s = normalizeSaveData({ gold: 42, life: 100 }, false, 1000);
    expect(s.gold).toBe(42);
    expect(s.taps).toBe(0);
    expect(s.relicEquip).toEqual({ weapon: '', focus: '', armor: '' });
    expect(s.saveVersion).toBe(SAVE_VERSION);
  });

  it('corrige les valeurs invalides en mode tolérant', () => {
    const s = normalizeSaveData({ gold: -5, taps: 3.7, eggWarm: 4, vol: 500, life: 'abc', ranks: Infinity }, false);
    expect(s.gold).toBe(0);
    expect(s.taps).toBe(3);
    expect(s.eggWarm).toBe(1);
    expect(s.vol).toBe(100);
    expect(s.life).toBe(0);
    expect(s.ranks).toBe(0);
  });

  it('borne les valeurs gigantesques', () => {
    expect(normalizeSaveData({ gold: 1e308 }).gold).toBe(MAX_GAME_VALUE);
  });

  it('refuse les valeurs invalides en mode strict (import)', () => {
    expect(() => normalizeSaveData({ gold: -1 }, true)).toThrow(SaveValidationError);
    expect(() => normalizeSaveData({ u: { lut: 'x' } }, true)).toThrow(SaveValidationError);
    expect(() => normalizeSaveData({ daily: 'oops' }, true)).toThrow(SaveValidationError);
    expect(() => normalizeSaveData([], true)).toThrow(SaveValidationError);
  });

  it('ignore les clés capables de polluer les prototypes', () => {
    const payload = JSON.parse('{"__proto__":{"polluted":1},"ach":{"__proto__":{"x":1},"t10":1}}');
    const s = normalizeSaveData(payload);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.keys(s.ach)).toEqual(['t10']);
  });

  it('nettoie l’aventure et migre l’ancien compteur interne', () => {
    const s = normalizeSaveData({ adventure: { gold: 10, owned: ['fire', 42], _meter: 7, obsidianTestUnlock: true } });
    expect(s.adventure!.owned).toEqual(['fire']);
    expect(s.adventure!.meter).toBe(7);
    expect('obsidianTestUnlock' in s.adventure!).toBe(false);
  });

  it('dédoublonne les reliques et ne garde qu’une voie valide', () => {
    const s = normalizeSaveData({ relicOwned: ['a', 'a', 3], path: 'hacker' });
    expect(s.relicOwned).toEqual(['a']);
    expect(s.path).toBe('');
  });

  it('produit un état neuf cohérent', () => {
    const s = freshState(5);
    expect(s.t).toBe(5);
    expect(s.adventure).toBeNull();
  });
});
