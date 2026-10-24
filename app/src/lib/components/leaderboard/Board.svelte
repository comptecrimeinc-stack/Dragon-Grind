<script lang="ts">
  import { DRAGONS } from '#lib/game/constants.ts';
  import { boardRows, type Metric } from '#lib/game/leaderboard.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import PlayerName from './PlayerName.svelte';

  let { metric, title, format }: { metric: Metric; title: string; format: (v: number) => string } = $props();

  const avatar = (dragon: string) => DRAGONS.find((d) => d.id === dragon)?.icon ?? '🐲';
  const rows = $derived(boardRows(metric, game.score, game.heroes, avatar));
</script>

<div class="board">
  <h3>{t(title)}</h3>
  {#each rows as r (r.kind + r.name)}
    <div class="row" class:me={r.kind === 'me'}>
      <span class="rank">{r.rank}</span>
      <span class="av" aria-hidden="true">{r.avatar}</span>
      <PlayerName kind={r.kind} name={r.name} dragon={r.dragon} />
      <span class="val">{format(r.value)}</span>
    </div>
  {/each}
</div>

<style>
  .board {
    display: grid;
    gap: 4px;
    align-content: start;
  }

  .row {
    display: grid;
    grid-template-columns: 28px 32px 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 9px;
  }

  .row.me {
    background: linear-gradient(90deg, #ff8a3a33, transparent);
    border: 1px solid var(--gold-deep);
  }

  .rank {
    color: var(--muted);
    font-weight: 700;
    text-align: center;
  }

  .av {
    font-size: 1.3rem;
  }

  .val {
    color: var(--gold);
    font-weight: 700;
    white-space: nowrap;
  }
</style>
