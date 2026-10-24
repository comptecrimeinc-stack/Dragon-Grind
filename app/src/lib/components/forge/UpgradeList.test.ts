import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { freshState } from '#lib/game/state.ts';
import { game } from '#lib/stores/game.svelte.ts';
import UpgradeList from './UpgradeList.svelte';

describe('UpgradeList', () => {
  beforeEach(() => {
    localStorage.clear();
    game.S = freshState();
  });

  it('affiche une ligne par amélioration, désactivée sans mana', () => {
    render(UpgradeList);
    expect(screen.getAllByRole('listitem')).toHaveLength(9);
    for (const li of screen.getAllByRole('listitem')) expect(li.querySelector('button')).toBeDisabled();
  });

  it('achète une amélioration et met à jour le compteur', async () => {
    game.S.gold = 1000;
    render(UpgradeList);
    const row = screen.getByText(/Lutin collecteur/).closest('li')!;
    await fireEvent.click(row.querySelector('button')!);
    expect(game.S.u.lut).toBe(1);
    expect(row).toHaveTextContent('× 1');
  });

  it('change la quantité achetée', async () => {
    game.S.gold = 1e6;
    render(UpgradeList);
    await fireEvent.click(screen.getByRole('button', { name: '×10' }));
    const row = screen.getByText(/Lutin collecteur/).closest('li')!;
    await fireEvent.click(row.querySelector('button')!);
    expect(game.S.u.lut).toBe(10);
  });
});
