import { describe, expect, it } from 'vitest';
import { checkProfileName, crownSvg, framesUnlocked, normalizeProfileName } from './profile';

describe('nom de profil', () => {
  it('accepte un nom ordinaire', () => {
    expect(checkProfileName('  Eryndor ')).toEqual({ ok: true, name: 'Eryndor' });
  });

  it('refuse les noms vides, courts, longs ou avec liens', () => {
    expect(checkProfileName('')).toMatchObject({ reason: 'empty' });
    expect(checkProfileName('a')).toMatchObject({ reason: 'short' });
    expect(checkProfileName('x'.repeat(23))).toMatchObject({ reason: 'long' });
    expect(checkProfileName('<b>Bob')).toMatchObject({ reason: 'chars' });
    expect(checkProfileName('www.spam')).toMatchObject({ reason: 'link' });
  });

  it('déjoue le leetspeak et les accents', () => {
    expect(normalizeProfileName('Ad.M1n')).toBe('admin');
    expect(checkProfileName('Ad.M1n')).toMatchObject({ reason: 'blocked' });
    expect(checkProfileName('Fuuuuck')).toMatchObject({ reason: 'blocked' });
  });
});

describe('cadres héraldiques', () => {
  it('débloque les cadres selon les succès', () => {
    expect(framesUnlocked(0).map((f) => f.id)).toEqual(['cw1']);
    expect(framesUnlocked(30)).toHaveLength(5);
  });

  it('génère des identifiants de dégradé uniques', () => {
    const a = crownSvg('cw2').match(/id="([^"]+)"/)![1];
    const b = crownSvg('cw2').match(/id="([^"]+)"/)![1];
    expect(a).not.toBe(b);
  });
});
