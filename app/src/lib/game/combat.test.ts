import { describe, expect, it } from 'vitest';
import { TITAN_CAP } from './constants';
import {
  bossPhaseInfo,
  countBossInterrupt,
  damageTitan,
  lineageMatchup,
  skillUnlocked,
  titanAttack,
  titanMax,
  titanName,
  titanReward,
  updateBossEncounter,
  useSkill
} from './combat';
import { recordingFx } from './fx';
import { freshState } from './state';

describe('titans', () => {
  it('nomme les titans éveillés au-delà de la liste', () => {
    const S = freshState();
    expect(titanName(S)).toBe('Sentinelle des cendres');
    S.boss = 7;
    expect(titanName(S)).toBe('Dévoreur astral · Éveillé 2');
  });

  it('applique le trait du titan aux dégâts (clic −20 % contre le premier)', () => {
    const S = freshState();
    S.v = 1; // Feu : pas d'avantage sur la Sentinelle
    S.vu[1] = 1;
    damageTitan(S, 100, 'tap', recordingFx(), 0);
    expect(S.bossHp).toBe(titanMax(S) - 80);
  });

  it('donne +25 % à la lignée avantagée', () => {
    const S = freshState(); // Eau : avantage sur la Sentinelle
    expect(lineageMatchup(S).advantage).toBe(true);
    damageTitan(S, 100, 'tap', recordingFx(), 0);
    expect(S.bossHp).toBe(titanMax(S) - 100);
  });

  it('récompense la victoire et passe au titan suivant', () => {
    const S = freshState();
    const fx = recordingFx();
    damageTitan(S, 1e9, 'strike', fx, 0);
    expect(S.boss).toBe(1);
    expect(S.bossKills).toBe(1);
    expect(S.gold).toBe(titanReward(freshState(), 0));
    expect(S.relicShards).toBe(1);
    expect(S.bossHp).toBe(titanMax(S));
    expect(fx.sounds).toContain('kill');
    expect(S.daily.progress.boss).toBe(1);
  });

  it('donne une braise et deux fragments tous les cinq titans', () => {
    const S = freshState();
    S.boss = 4;
    damageTitan(S, 1e12, 'strike', recordingFx(), 0);
    expect(S.embers).toBe(1);
    expect(S.relicShards).toBe(2);
  });

  it('termine la chasse au trentième titan', () => {
    const S = freshState();
    S.boss = TITAN_CAP - 1;
    const fx = recordingFx();
    damageTitan(S, 1e300, 'strike', fx, 0);
    expect(S.boss).toBe(TITAN_CAP);
    expect(S.bossHp).toBe(0);
    damageTitan(S, 1e300, 'strike', fx, 0);
    expect(S.boss).toBe(TITAN_CAP);
  });

  it('calcule la phase selon les PV', () => {
    const S = freshState();
    S.bossHp = titanMax(S) * 0.5;
    expect(bossPhaseInfo(S).phase).toBe(2);
    S.bossHp = titanMax(S) * 0.1;
    expect(bossPhaseInfo(S).phase).toBe(3);
  });
});

describe('attaques spéciales', () => {
  it('télégraphe puis frappe si rien ne l’interrompt', () => {
    const S = freshState();
    S.gold = 10_000;
    const fx = recordingFx();
    updateBossEncounter(S, fx, 1000);
    expect(S.bossAttackAt).toBe(15000);
    updateBossEncounter(S, fx, 15000);
    expect(S.bossTelegraphUntil).toBe(18500);
    expect(fx.sounds).toContain('warn');
    updateBossEncounter(S, fx, 18500);
    expect(S.bossTelegraphUntil).toBe(0);
    expect(S.bossWeakenUntil).toBe(23500);
    expect(S.gold).toBeLessThan(10_000);
    expect(fx.sounds).toContain('shock');
  });

  it('interrompt l’attaque après assez de frappes', () => {
    const S = freshState();
    S.bossTelegraphUntil = 5000;
    const fx = recordingFx();
    const need = titanAttack(S).need;
    for (let i = 0; i < need; i++) countBossInterrupt(S, fx, 1000);
    expect(S.bossTelegraphUntil).toBe(0);
    expect(S.bossStunUntil).toBe(6000);
    expect(S.gold).toBeGreaterThanOrEqual(100);
  });

  it('ne compte pas les frappes hors incantation', () => {
    const S = freshState();
    countBossInterrupt(S, recordingFx(), 1000);
    expect(S.bossInterrupts).toBe(0);
  });
});

describe('compétences', () => {
  it('se débloquent avec renaissances et ascension', () => {
    const S = freshState();
    expect(skillUnlocked(S, 'strike')).toBe(false);
    S.rk = 3;
    expect(skillUnlocked(S, 'surge')).toBe(true);
    expect(skillUnlocked(S, 'devour')).toBe(false);
  });

  it('respectent leur temps de recharge', () => {
    const S = freshState();
    S.rk = 1;
    const fx = recordingFx();
    expect(useSkill(S, 'strike', fx, 1000)).toBe(true);
    expect(S.skillCd.strike).toBe(13000);
    expect(S.combo).toBe(3);
    expect(useSkill(S, 'strike', fx, 2000)).toBe(false);
  });

  it('Surcharge arcanique active le bonus de production', () => {
    const S = freshState();
    S.rk = 3;
    useSkill(S, 'surge', recordingFx(), 0);
    expect(S.buffUntil).toBe(8000);
  });
});
