import { describe, expect, it } from 'vitest';
import { RIVALS } from './constants';
import { boardRows, dedupeHeroes, localRank, upsertHero, type PlayerScore } from './leaderboard';

const me: PlayerScore = { name: 'Nico', dragon: 'fire', frame: 'cw1', life: 5000, kills: 3, rk: 1, asc: 0 };

describe('classement', () => {
  it('ne garde qu’une fiche par nom, la plus récente', () => {
    const list = dedupeHeroes([{ name: 'A', lastSeen: 1, life: 5 }, { name: 'a', lastSeen: 2, life: 1 }, null]);
    expect(list).toHaveLength(1);
    expect(list[0].life).toBe(1);
  });

  it('fusionne en conservant les meilleurs scores', () => {
    const list = upsertHero([{ id: 'nico', name: 'NICO', dragon: 'ice', frame: 'cw1', life: 9000, kills: 1, rk: 0, asc: 0 }], me, 10);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: 'Nico', life: 9000, kills: 3, dragon: 'fire', lastSeen: 10 });
  });

  it('classe le joueur parmi les rivaux', () => {
    const rows = boardRows('life', me, []);
    expect(rows).toHaveLength(RIVALS.length + 1);
    const mine = rows.find((r) => r.kind === 'me')!;
    expect(mine.rank).toBe(localRank(me.life, [], me.name));
    expect(rows.map((r) => r.value)).toEqual([...rows.map((r) => r.value)].sort((a, b) => b - a));
  });
});
