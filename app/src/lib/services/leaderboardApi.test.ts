import { describe, expect, it, vi } from 'vitest';
import { LeaderboardApi, LeaderboardUnavailable } from './leaderboardApi.ts';

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));
const score = { name: 'Nico', dragon: 'fire', frame: 'cw1', life: 10, kills: 0, rk: 0, asc: 0 };

describe('LeaderboardApi', () => {
  it('trouve le premier point d’accès valide puis lit les joueurs', async () => {
    const fetchMock = vi.fn((url: string) => (url === '/b' ? json({ ok: true, players: [{ name: 'A', life: 5 }, null] }) : json({}, 404)));
    const api = new LeaderboardApi(fetchMock as unknown as typeof fetch, ['/a', '/b']);
    expect(await api.players(true)).toEqual([{ name: 'A', life: 5 }]);
    expect(api.cached).toHaveLength(1);
  });

  it('met en cache pendant une minute', async () => {
    const fetchMock = vi.fn(() => json({ ok: true, players: [] }));
    const api = new LeaderboardApi(fetchMock as unknown as typeof fetch, ['/a']);
    await api.players(true, 0);
    const calls = fetchMock.mock.calls.length;
    await api.players(false, 30_000);
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  it('cesse de sonder un serveur absent, sauf demande explicite', async () => {
    const fetchMock = vi.fn(() => json({}, 404));
    const api = new LeaderboardApi(fetchMock as unknown as typeof fetch, ['/a']);
    await expect(api.submit(score)).rejects.toBeInstanceOf(LeaderboardUnavailable);
    const calls = fetchMock.mock.calls.length;
    await expect(api.submit(score)).rejects.toBeInstanceOf(LeaderboardUnavailable);
    expect(fetchMock.mock.calls.length).toBe(calls);
    await expect(api.submit(score, true)).rejects.toBeInstanceOf(LeaderboardUnavailable);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(calls);
  });

  it('publie le score et renvoie le rang', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => (init?.method === 'POST' ? json({ ok: true, rank: 3, total: 9 }) : json({ ok: true, players: [] })));
    const api = new LeaderboardApi(fetchMock as unknown as typeof fetch, ['/a']);
    expect(await api.submit(score)).toMatchObject({ rank: 3, total: 9 });
  });
});
