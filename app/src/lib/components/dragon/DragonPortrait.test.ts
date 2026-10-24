import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { freshState } from '#lib/game/state.ts';
import { game } from '#lib/stores/game.svelte.ts';
import DragonPortrait from './DragonPortrait.svelte';

describe('DragonPortrait', () => {
  beforeEach(() => {
    localStorage.clear();
    game.S = freshState();
    game.settings = { logo: true, motion: true, quality: 'auto' };
  });

  const tap = (el: Element, pointerId: number, type: 'pointerDown' | 'pointerUp', x = 50) => fireEvent[type](el, { pointerId, clientX: x, clientY: 50, pointerType: 'touch' });

  it('compte chaque doigt quand on tape à deux pouces en alternance', async () => {
    const { getByRole } = render(DragonPortrait);
    const dragon = getByRole('button');
    // Le second pouce touche avant que le premier ne se relève.
    await tap(dragon, 1, 'pointerDown');
    await tap(dragon, 2, 'pointerDown', 80);
    await tap(dragon, 1, 'pointerUp');
    await tap(dragon, 2, 'pointerUp', 80);
    expect(game.S.taps).toBe(2);
  });

  it('ne souffle pas quand le doigt glisse pour faire défiler la page', async () => {
    const { getByRole } = render(DragonPortrait);
    const dragon = getByRole('button');
    await tap(dragon, 1, 'pointerDown');
    await fireEvent.pointerMove(dragon, { pointerId: 1, clientX: 50, clientY: 120, pointerType: 'touch' });
    await tap(dragon, 1, 'pointerUp');
    expect(game.S.taps).toBe(0);
  });
});
