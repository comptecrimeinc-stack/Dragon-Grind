import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { freshState } from '#lib/game/state.ts';
import { game } from '#lib/stores/game.svelte.ts';
import SettingsModal from './SettingsModal.svelte';

describe('SettingsModal — volumes', () => {
  beforeEach(() => {
    localStorage.clear();
    game.S = freshState();
  });

  it('règle séparément la musique et les effets', async () => {
    render(SettingsModal);
    await fireEvent.input(screen.getByLabelText(/Volume de la musique/), { target: { value: '20' } });
    await fireEvent.input(screen.getByLabelText(/Volume des effets/), { target: { value: '90' } });
    expect(game.S.musVol).toBe(20);
    expect(game.S.vol).toBe(90);
    expect(JSON.parse(localStorage.getItem('dragon-grind-v2')!)).toMatchObject({ musVol: 20, vol: 90 });
  });

  it('grise le curseur d’une source coupée', () => {
    game.S.mus = 0;
    render(SettingsModal);
    expect(screen.getByLabelText(/Volume de la musique/)).toBeDisabled();
    expect(screen.getByLabelText(/Volume des effets/)).toBeEnabled();
  });
});
