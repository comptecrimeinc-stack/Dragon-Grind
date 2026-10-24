import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { TITAN_CAP } from '#lib/game/constants.ts';
import { freshState } from '#lib/game/state.ts';
import { game } from '#lib/stores/game.svelte.ts';
import TitanCard from './TitanCard.svelte';

describe('TitanCard', () => {
  beforeEach(() => {
    game.S = freshState();
    game.now = Date.now();
  });

  it('présente le titan, ses PV et la synergie de la lignée', () => {
    game.S.bossHp = 250;
    render(TitanCard);
    expect(screen.getByText('Sentinelle des cendres')).toBeInTheDocument();
    expect(screen.getByText('PV : 250 / 250')).toBeInTheDocument();
    expect(screen.getByText(/Avantage sur Sentinelle des cendres et Colosse de braise/)).toBeInTheDocument();
  });

  it('annonce l’incantation à interrompre', () => {
    game.S.bossHp = 250;
    game.S.bossTelegraphUntil = game.now + 3000;
    render(TitanCard);
    expect(screen.getByRole('status')).toHaveTextContent(/Marteau de scories !.*Interruption : 0 \/ 7/);
  });

  it('signale la fin de la chasse', () => {
    game.S.boss = TITAN_CAP;
    render(TitanCard);
    expect(screen.getByText('✦ Chasse aux titans achevée')).toBeInTheDocument();
  });
});
