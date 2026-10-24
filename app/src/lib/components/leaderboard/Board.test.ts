import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { formatNumber } from '#lib/game/format.ts';
import { freshState } from '#lib/game/state.ts';
import { game } from '#lib/stores/game.svelte.ts';
import Board from './Board.svelte';

describe('Board', () => {
  beforeEach(() => {
    game.S = freshState();
    game.heroes = [];
    game.profile = { name: 'Nico', dragon: 'water', frame: 'cw3' };
  });

  it('affiche mon portrait avec la couronne de mon cadre', () => {
    const { container } = render(Board, { metric: 'life', title: 'Mana', format: formatNumber });
    const mine = container.querySelector('.row.me')!;
    expect(mine.querySelector('img')!.getAttribute('src')).toMatch(/img_03\.webp$/);
    expect(mine.querySelector('.crown svg linearGradient')!.id).toMatch(/^dgCrown-cw3-/);
  });

  it('garde un emoji pour les autres joueurs', () => {
    const { container } = render(Board, { metric: 'life', title: 'Mana', format: formatNumber });
    const others = container.querySelectorAll('.row:not(.me)');
    expect(others.length).toBeGreaterThan(0);
    expect(others[0].querySelector('.crown')).toBeNull();
  });
});
