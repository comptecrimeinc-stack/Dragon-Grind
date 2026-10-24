import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readSnapshots } from '#lib/services/persistence.ts';
import { KEYS } from '#lib/services/storage.ts';
import { game } from './game.svelte.ts';

const saved = () => JSON.parse(localStorage.getItem(KEYS.save)!);

describe('progression enregistrée et remise à zéro', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(KEYS.profile, JSON.stringify({ name: 'Nico', dragon: 'fire', frame: 'cw1' }));
    game.load();
  });

  it('enregistre la progression dans le localStorage', () => {
    for (let i = 0; i < 5; i++) game.tap(Date.now() + i * 200);
    game.S.gold = 1000;
    game.buyItem('lut', 1);
    const s = saved();
    expect(s.taps).toBe(5);
    expect(s.u.lut).toBe(1);
    expect(s.life).toBeGreaterThan(0);
  });

  it('remet tout à zéro, garde le profil et une copie de secours', () => {
    game.S.life = 5e7;
    game.S.gold = 5e6;
    game.S.rk = 3;
    game.S.u.lut = 20;
    game.syncHero();
    game.save();

    expect(game.restartFromScratch()).toBe(true);

    const s = saved();
    expect([s.gold, s.life, s.taps, s.rk]).toEqual([0, 0, 0, 0]);
    expect(s.u).toEqual({});
    expect(game.S.life).toBe(0);
    expect(game.profile?.name).toBe('Nico');
    // La copie « avant remise à zéro » permet de revenir en arrière.
    const backup = readSnapshots().find((x) => x.l === 'avant')!;
    expect(JSON.parse(backup.d).life).toBe(5e7);
    // Le classement de l'appareil ne garde pas les anciens records.
    const me = JSON.parse(localStorage.getItem(KEYS.heroes)!).find((h: { name: string }) => h.name === 'Nico');
    expect(me.life).toBe(0);
    expect(game.activeTab).toBe('combat');
  });
});

describe('une seule fenêtre à la fois', () => {
  let hidden = false;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(KEYS.profile, JSON.stringify({ name: 'Nico', dragon: 'fire', frame: 'cw1' }));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    game.load();
    game.S.u.lut = 50;
    game.settingsOpen = false;
    game.profileCard = null;
    game.offline = null;
  });

  /** Simule un départ de l'onglet puis un retour `seconds` plus tard. */
  function leaveAndComeBack(seconds: number) {
    vi.setSystemTime(Date.now());
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    vi.setSystemTime(Date.now() + seconds * 1000);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  it('le récapitulatif hors ligne attend la fermeture des paramètres', () => {
    vi.useFakeTimers();
    const stop = game.start();
    game.settingsOpen = true;
    leaveAndComeBack(120);
    expect(game.offline).not.toBeNull();
    expect(game.dialog).toBe('settings');
    game.settingsOpen = false;
    expect(game.dialog).toBe('offline');
    stop();
    vi.useRealTimers();
  });

  it('cumule plusieurs absences dans un seul récapitulatif', () => {
    vi.useFakeTimers();
    const stop = game.start();
    game.settingsOpen = true;
    leaveAndComeBack(120);
    const first = game.offline!.earned;
    leaveAndComeBack(120);
    expect(game.offline!.seconds).toBe(240);
    expect(game.offline!.earned).toBeCloseTo(first * 2);
    stop();
    vi.useRealTimers();
  });

  it('la carte de profil passe aussi avant le récapitulatif', () => {
    game.offline = { seconds: 100, earned: 5 };
    game.profileCard = { kind: 'me', name: 'Nico', dragon: 'fire' };
    expect(game.dialog).toBe('profile');
  });
});
