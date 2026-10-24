import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { game } from '#lib/stores/game.svelte.ts';
import ProfileGate from './ProfileGate.svelte';

describe('ProfileGate', () => {
  beforeEach(() => {
    localStorage.clear();
    game.profile = null;
  });

  it('refuse un nom interdit et l’explique', async () => {
    render(ProfileGate);
    await fireEvent.input(screen.getByLabelText('Nom du héros'), { target: { value: 'admin' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Créer mon profil' }));
    expect(screen.getByText('Ce nom ne peut pas être utilisé.')).toBeInTheDocument();
    expect(game.profile).toBeNull();
  });

  it('crée le profil avec le dragon choisi et l’enregistre', async () => {
    render(ProfileGate);
    await fireEvent.input(screen.getByLabelText('Nom du héros'), { target: { value: 'Eryndor' } });
    await fireEvent.click(screen.getByRole('button', { name: /Sylve/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Créer mon profil' }));
    expect(game.profile).toMatchObject({ name: 'Eryndor', dragon: 'nature', frame: 'cw1' });
    expect(JSON.parse(localStorage.getItem('dragon-grind-v2-profile')!)).toMatchObject({ name: 'Eryndor' });
  });
});
