import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import { createTranslator } from './translate';

describe('traduction', () => {
  const tr = createTranslator({ Forge: 'Forge', 'Titans vaincus : {n}': 'Titans defeated: {n}', Chasse: 'Hunt', 'Succès (notification)': 'Achievement', 'Premier souffle': 'First breath' });

  it('laisse le français intact sans dictionnaire', () => {
    expect(createTranslator(null)('Chasse')).toBe('Chasse');
  });

  it('traduit les correspondances exactes et conserve la ponctuation autour', () => {
    expect(tr('Chasse')).toBe('Hunt');
    expect(tr('  Chasse ')).toBe('  Hunt ');
  });

  it('réinjecte les nombres dans les gabarits', () => {
    expect(tr('Titans vaincus : 12')).toBe('Titans defeated: 12');
  });

  it('garde le suffixe de grandeur avec le nombre', () => {
    expect(tr('Titans vaincus : 1,5 k')).toBe('Titans defeated: 1,5 k');
    expect(tr('Titans vaincus : 3 Md')).toBe('Titans defeated: 3 Md');
  });

  it('traduit les phrases composées morceau par morceau', () => {
    expect(tr('Chasse · Forge')).toBe('Hunt · Forge');
    expect(tr('Succès : Premier souffle')).toBe('Achievement: First breath');
  });

  it('renvoie le texte inchangé quand rien ne correspond', () => {
    expect(tr('Bonjour')).toBe('Bonjour');
  });

  it('couvre les libellés principaux avec le vrai dictionnaire anglais', () => {
    const real = createTranslator(en);
    expect(real('Chasse aux titans')).not.toBe('Chasse aux titans');
    expect(real('Choisis ta langue')).toBe('Choose your language');
  });
});
