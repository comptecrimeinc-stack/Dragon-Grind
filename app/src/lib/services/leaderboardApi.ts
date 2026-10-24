import type { PlayerScore, WorldPlayer } from '#lib/game/leaderboard.ts';

/**
 * Classement mondial. GitHub Pages ne sert que des fichiers statiques : le serveur de
 * classement (fonction Netlify fournie dans `netlify-leaderboard/`) est hébergé ailleurs
 * et son adresse est donnée au build par `VITE_LEADERBOARD_URL`. Sans elle, le jeu tente
 * les chemins relatifs d'un hébergement Netlify complet, puis se contente du classement local.
 */
const CONFIGURED = (import.meta.env.VITE_LEADERBOARD_URL as string | undefined)?.trim();
const ENDPOINTS = CONFIGURED ? [CONFIGURED] : ['/.netlify/functions/dg-leaderboard', '/api/leaderboard'];
const CACHE_MS = 60000;
/** Après un échec de connexion, on ne retente pas avant ce délai (sauf demande explicite). */
const RETRY_MS = 10 * 60000;

export class LeaderboardUnavailable extends Error {}

export class LeaderboardApi {
  private endpoint: string | null = null;
  private cache: WorldPlayer[] | null = null;
  private fetchedAt = 0;
  private failedAt = 0;

  constructor(
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
    private readonly endpoints: string[] = ENDPOINTS
  ) {}

  get cached(): WorldPlayer[] | null {
    return this.cache;
  }

  private async resolve(force: boolean, now = Date.now()): Promise<string> {
    if (this.endpoint) return this.endpoint;
    if (typeof location !== 'undefined' && location.protocol === 'file:') throw new LeaderboardUnavailable('file');
    if (!force && now - this.failedAt < RETRY_MS) throw new LeaderboardUnavailable('backoff');
    for (const url of this.endpoints) {
      try {
        const r = await this.fetchImpl(url, { method: 'GET', cache: 'no-store' });
        if (!r.ok) continue;
        const j = await r.json().catch(() => null);
        if (j && (j.ok || Array.isArray(j.players))) {
          this.endpoint = url;
          return url;
        }
      } catch {
        /* point d'accès suivant */
      }
    }
    this.failedAt = now;
    throw new LeaderboardUnavailable('none');
  }

  async players(force = false, now = Date.now()): Promise<WorldPlayer[]> {
    if (!force && this.cache && now - this.fetchedAt < CACHE_MS) return this.cache;
    const url = await this.resolve(force, now);
    const r = await this.fetchImpl(url, { method: 'GET', cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const list: unknown = Array.isArray(data) ? data : data?.players;
    this.cache = Array.isArray(list) ? list.filter((p): p is WorldPlayer => !!p && typeof p.name === 'string') : [];
    this.fetchedAt = now;
    return this.cache;
  }

  async submit(score: PlayerScore, force = false): Promise<{ rank?: number; total?: number }> {
    const url = await this.resolve(force);
    const r = await this.fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.ok === false) throw new Error(data.error || 'HTTP ' + r.status);
    this.cache = null;
    return data;
  }
}
