import { describe, expect, it } from 'vitest';
import { recordingFx } from './fx';
import { ACHIEVEMENTS, checkAchievements, checkLineages, completionRatio, nextLineage, selectLineage, tabUnlocked } from './progression';
import { freshState } from './state';

describe('progression', () => {
  it('débloque les succès une seule fois', () => {
    const S = freshState();
    S.taps = 100;
    const fx = recordingFx();
    expect(checkAchievements(S, fx)).toBe(2);
    expect(checkAchievements(S, fx)).toBe(0);
    expect(fx.toasts[0]).toBe('Succès : Premier souffle (+1 %)');
    expect(ACHIEVEMENTS.length).toBeGreaterThan(50);
  });

  it('débloque les lignées et refuse celles verrouillées', () => {
    const S = freshState();
    const fx = recordingFx();
    expect(selectLineage(S, 1, fx)).toBe(false);
    S.life = 1000;
    expect(checkLineages(S, fx)).toBe(true);
    expect(selectLineage(S, 1, fx)).toBe(true);
    expect(nextLineage(S)).toEqual({ name: 'Foudre', condition: 'faire 1 renaissance' });
  });

  it('ouvre les onglets selon le mana total', () => {
    const S = freshState();
    expect(tabUnlocked(S, 'combat')).toBe(true);
    expect(tabUnlocked(S, 'forge')).toBe(false);
    S.life = 1000;
    expect(tabUnlocked(S, 'expedition')).toBe(true);
    expect(tabUnlocked(S, 'renaissance')).toBe(false);
  });

  it('mesure l’avancement global', () => {
    const S = freshState();
    expect(completionRatio(S)).toBeGreaterThan(0);
    expect(completionRatio(S)).toBeLessThan(0.1);
  });
});
