<script lang="ts">
  import { onMount } from 'svelte';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { isMe, type WorldPlayer } from '#lib/game/leaderboard.ts';
  import { DRAGONS } from '#lib/game/constants.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { LeaderboardUnavailable } from '#lib/services/leaderboardApi.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import Avatar from '../profile/Avatar.svelte';
  import PlayerName from './PlayerName.svelte';

  let players = $state<WorldPlayer[] | null>(null);
  let status = $state<{ text: string; ok: boolean }>({ text: 'Connexion au classement mondial…', ok: true });
  let busy = $state(false);

  async function refresh(force: boolean) {
    busy = true;
    try {
      players = await game.leaderboard.players(force);
      status = { text: '🌍 ' + players.length + ' forgerons classés · mis à jour à l’instant', ok: true };
    } catch (e) {
      players = game.leaderboard.cached;
      status = {
        text: e instanceof LeaderboardUnavailable ? 'Classement mondial indisponible : aucun serveur de classement configuré pour cet hébergement.' : 'Impossible de joindre le serveur mondial. Réessaie plus tard.',
        ok: false
      };
    } finally {
      busy = false;
    }
  }

  async function publish() {
    busy = true;
    const r = await game.submitScore(false);
    if (r) status = { text: 'Publié · rang mondial #' + (r.rank ?? '?') + ' sur ' + (r.total ?? '?'), ok: true };
    busy = false;
    await refresh(true);
  }

  onMount(() => void refresh(true));

  const avatar = (dragon?: string) => DRAGONS.find((d) => d.id === dragon)?.icon ?? '🐲';
</script>

<p class="status" class:err={!status.ok}>{t(status.text)}</p>
<div class="card list">
  {#if !players}
    <p class="muted">{t('Le classement mondial s’active une fois le jeu relié à un serveur de classement (fonction Netlify fournie dans netlify-leaderboard).')}</p>
  {:else if !players.length}
    <p class="muted">{t('Aucun score mondial pour l’instant. Sois le premier à publier le tien !')}</p>
  {:else}
    {#each players as p, i (p.name + i)}
      {@const mine = isMe(p.name, game.score.name)}
      <div class="row" class:me={mine}>
        <span class="rank">{i + 1}</span>
        {#if mine}
          <Avatar dragon={game.score.dragon} frame={game.profile?.frame} size={40} />
        {:else}
          <span aria-hidden="true">{avatar(p.dragon)}</span>
        {/if}
        <PlayerName kind={mine ? 'me' : 'world'} name={p.name || 'Anonyme'} dragon={p.dragon || ''} />
        <span class="val">{f(p.life || 0)}</span>
      </div>
    {/each}
  {/if}
</div>
<div class="actions">
  <button type="button" class="btn" disabled={busy} onclick={() => refresh(true)}>{t('Actualiser le mondial')}</button>
  <button type="button" class="btn primary" disabled={busy} onclick={publish}>{t(busy ? 'Publication…' : 'Publier mon score')}</button>
</div>

<style>
  .status {
    font-size: 0.88rem;
    color: var(--ok);
  }

  .status.err {
    color: var(--danger);
  }

  .list {
    display: grid;
    gap: 4px;
  }

  .row {
    display: grid;
    grid-template-columns: 28px 40px 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 9px;
  }

  .row.me {
    border: 1px solid var(--gold-deep);
  }

  .rank {
    color: var(--muted);
    text-align: center;
  }

  .val {
    color: var(--gold);
    font-weight: 700;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
</style>
