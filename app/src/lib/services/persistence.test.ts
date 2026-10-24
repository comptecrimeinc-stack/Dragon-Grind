import { beforeEach, describe, expect, it } from 'vitest';
import { freshState } from '#lib/game/state.ts';
import { createSnapshot, exportPayload, HEALTH_TEXT, loadGame, parseImport, readSecurityLog, readSnapshots, replaceSave, saveGame, setAutosaveEnabled, SNAPSHOT_MAX } from './persistence.ts';
import { KEYS } from './storage.ts';

const NOW = 1_800_000_000_000;

describe('sauvegarde', () => {
  beforeEach(() => localStorage.clear());

  it('démarre une partie neuve sans sauvegarde', () => {
    const r = loadGame(NOW);
    expect(r.state.gold).toBe(0);
    expect(r.offlineSeconds).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('relit ce qui a été enregistré et calcule l’absence', () => {
    const S = freshState(NOW);
    S.gold = 1234;
    saveGame(S, NOW - 600_000);
    const r = loadGame(NOW);
    expect(r.state.gold).toBe(1234);
    expect(r.offlineSeconds).toBe(600);
  });

  it('neutralise les gains hors ligne si l’horloge recule', () => {
    saveGame(freshState(), NOW + 3_600_000);
    const r = loadGame(NOW);
    expect(r.offlineSeconds).toBe(0);
    expect(r.notices[0]).toMatch(/Horloge système reculée/);
    expect(readSecurityLog()).toHaveLength(1);
  });

  it('plafonne une absence suspecte à 24 h', () => {
    saveGame(freshState(), NOW - 5 * 86_400_000);
    expect(loadGame(NOW).offlineSeconds).toBe(86_400);
  });

  it('récupère la copie la plus récente si la sauvegarde est illisible', () => {
    const old = freshState(NOW - 10_000);
    old.gold = 1;
    const recent = freshState(NOW - 5_000);
    recent.gold = 2;
    localStorage.setItem(KEYS.backup, JSON.stringify(old));
    localStorage.setItem(KEYS.autosaves, JSON.stringify([{ t: NOW - 5_000, l: 'auto', d: JSON.stringify(recent) }]));
    localStorage.setItem(KEYS.save, '{corrompu');
    const r = loadGame(NOW);
    expect(r.state.gold).toBe(2);
    expect(r.notices).toContain(HEALTH_TEXT.recovery);
  });

  it('met de côté une sauvegarde illisible sans copie', () => {
    localStorage.setItem(KEYS.save, '{corrompu');
    const r = loadGame(NOW);
    expect(r.notices).toContain(HEALTH_TEXT.corrupt);
    expect(localStorage.getItem(KEYS.corrupt)).toBe('{corrompu');
  });

  it('réinitialise les états de combat éphémères au chargement', () => {
    const S = freshState(NOW);
    S.bossTelegraphUntil = NOW + 1000;
    S.combo = 12;
    S.skillCd.strike = NOW + 10 * 60_000;
    saveGame(S, NOW);
    const r = loadGame(NOW);
    expect(r.state.bossTelegraphUntil).toBe(0);
    expect(r.state.combo).toBe(0);
    expect(r.state.skillCd.strike).toBe(NOW + 60_000);
  });
});

describe('copies de sauvegarde', () => {
  beforeEach(() => localStorage.clear());

  it('espace les copies automatiques et ignore les doublons', () => {
    const S = freshState(NOW);
    expect(createSnapshot(S, 'auto', false, NOW)).toBe(true);
    expect(createSnapshot(S, 'auto', false, NOW + 1000)).toBe(false);
    expect(createSnapshot(S, 'auto', false, NOW + 200_000)).toBe(true);
    expect(readSnapshots()).toHaveLength(1);
  });

  it('respecte la désactivation mais pas les copies forcées', () => {
    setAutosaveEnabled(false);
    expect(createSnapshot(freshState(), 'auto', false, NOW)).toBe(false);
    expect(createSnapshot(freshState(), 'manual', true, NOW)).toBe(true);
  });

  it('ne garde que les six dernières en sacrifiant les automatiques', () => {
    const S = freshState(NOW);
    createSnapshot(S, 'manual', true, NOW);
    for (let i = 1; i <= 8; i++) {
      S.gold = i;
      createSnapshot(S, 'auto', true, NOW + i);
    }
    const list = readSnapshots();
    expect(list).toHaveLength(SNAPSHOT_MAX);
    expect(list[0].l).toBe('manual');
  });

  it('crée une copie de sécurité avant de remplacer la partie', () => {
    const current = freshState(NOW);
    current.gold = 5;
    saveGame(current, NOW);
    const next = freshState(NOW);
    next.gold = 99;
    expect(replaceSave(current, next, 'manual', NOW)).toBe('ok');
    expect(JSON.parse(localStorage.getItem(KEYS.save)!).gold).toBe(99);
    expect(JSON.parse(localStorage.getItem(KEYS.backup)!).gold).toBe(5);
    expect(readSnapshots()).toHaveLength(1);
  });
});

describe('export et import', () => {
  it('relit un export complet', () => {
    const S = freshState(NOW);
    S.life = 777;
    const text = JSON.stringify(exportPayload(S, NOW));
    expect(parseImport(text, NOW).life).toBe(777);
  });

  it('refuse un fichier qui n’est pas une sauvegarde', () => {
    expect(() => parseImport('{"hello":1}')).toThrow();
    expect(() => parseImport('pas du json')).toThrow();
    expect(() => parseImport('{"gold":-5}')).toThrow();
  });
});
