import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { freshState } from '#lib/game/state.ts';
import { game } from '#lib/stores/game.svelte.ts';
import TabBar from './TabBar.svelte';

describe('TabBar', () => {
  beforeEach(() => {
    localStorage.clear();
    game.S = freshState();
    game.activeTab = 'combat';
    game.noticeTabs = [];
    // jsdom n'implémente ni ResizeObserver ni scrollIntoView.
    Element.prototype.scrollIntoView ??= () => {};
    globalThis.ResizeObserver ??= class {
      observe() {}
      disconnect() {}
      unobserve() {}
    };
  });

  it('cache les systèmes pas encore débloqués', () => {
    render(TabBar);
    const names = screen.getAllByRole('tab').map((t) => t.textContent!.trim());
    expect(names).toEqual(['⚔️Chasse', '🏆Classement', '🛡️Profil', '✨Boutique']);
  });

  it('ouvre un onglet et efface sa pastille', async () => {
    game.S.life = 1e5;
    game.noticeTabs = ['forge'];
    render(TabBar);
    const forge = screen.getByRole('tab', { name: /Forge/ });
    expect(forge).toHaveTextContent('!');
    await fireEvent.click(forge);
    expect(game.activeTab).toBe('forge');
    expect(forge).toHaveAttribute('aria-selected', 'true');
    expect(forge).not.toHaveTextContent('!');
  });

  it('se parcourt au clavier', async () => {
    game.S.life = 1e5;
    render(TabBar);
    await fireEvent.keyDown(screen.getByRole('tab', { name: /Chasse/ }), { key: 'ArrowRight' });
    expect(game.activeTab).toBe('forge');
    await fireEvent.keyDown(screen.getByRole('tab', { name: /Forge/ }), { key: 'End' });
    expect(game.activeTab).toBe('boutique');
  });
});
