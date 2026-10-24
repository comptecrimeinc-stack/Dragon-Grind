import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '#lib/game/constants.ts';

const locales = import.meta.glob<Record<string, string>>('./locales/*.json', { eager: true, import: 'default' });
const byLang = Object.fromEntries(Object.entries(locales).map(([path, dict]) => [path.match(/(\w+)\.json$/)![1], dict]));

describe('dictionnaires', () => {
  it('existent pour chaque langue proposée (sauf le français, langue source)', () => {
    const expected = LANGUAGES.map((l) => l.code).filter((c) => c !== 'fr').sort();
    expect(Object.keys(byLang).sort()).toEqual(expected);
  });

  it('couvrent tous les mêmes textes', () => {
    const reference = Object.keys(byLang.en).sort();
    for (const [lang, dict] of Object.entries(byLang)) expect(Object.keys(dict).sort(), lang).toEqual(reference);
  });

  it('conservent les emplacements {n} de chaque phrase', () => {
    const count = (s: string) => (s.match(/\{n\}/g) || []).length;
    for (const [lang, dict] of Object.entries(byLang)) {
      for (const [fr, tr] of Object.entries(dict)) {
        if (count(fr) !== count(tr)) throw new Error(`${lang} : « ${fr} » → « ${tr} »`);
      }
    }
  });

  it('ne contiennent pas de traduction vide', () => {
    for (const dict of Object.values(byLang)) for (const v of Object.values(dict)) expect(v.trim()).not.toBe('');
  });
});
