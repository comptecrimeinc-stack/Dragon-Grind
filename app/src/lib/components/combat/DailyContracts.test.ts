import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { dailyContractIds, ensureDaily } from '#lib/game/daily.ts';
import { freshState } from '#lib/game/state.ts';
import { game } from '#lib/stores/game.svelte.ts';
import DailyContracts from './DailyContracts.svelte';

describe('DailyContracts', () => {
  beforeEach(() => {
    localStorage.clear();
    game.S = freshState();
    ensureDaily(game.S);
  });

  // Régression : le jeu d'origine affichait « +0 » sur chaque contrat.
  it('affiche des récompenses réelles', () => {
    render(DailyContracts);
    const rewards = screen.getAllByRole('button').map((b) => b.textContent!.trim());
    expect(rewards).toHaveLength(3);
    for (const r of rewards) expect(r).toMatch(/^\+[1-9]/);
  });

  it('permet de réclamer un contrat accompli', async () => {
    const id = dailyContractIds(game.S.daily.date)[0];
    game.S.daily.progress[id] = 1e9;
    render(DailyContracts);
    const button = screen.getAllByRole('button')[0];
    expect(button).toBeEnabled();
    await fireEvent.click(button);
    expect(game.S.daily.claimed[id]).toBe(1);
    expect(button).toHaveTextContent('Récupéré');
  });
});
