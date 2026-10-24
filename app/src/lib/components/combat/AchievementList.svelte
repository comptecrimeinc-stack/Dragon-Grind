<script lang="ts">
  import { achievementCount } from '#lib/game/economy.ts';
  import { ACHIEVEMENTS } from '#lib/game/progression.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const count = $derived(achievementCount(game.S));
</script>

<details>
  <summary>{t(count + ' / ' + ACHIEVEMENTS.length + ' · +' + count + ' % de production')}</summary>
  <ul>
    {#each ACHIEVEMENTS as a (a.id)}
      <li class:on={!!game.S.ach[a.id]}><b>{t(a.name)}</b><span>{t(a.desc)}</span></li>
    {/each}
  </ul>
</details>

<style>
  details {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 12px 16px;
  }

  summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--gold);
  }

  ul {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 8px;
  }

  li {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border: 1px solid #ffffff10;
    border-radius: 9px;
    opacity: 0.5;
  }

  li.on {
    opacity: 1;
    border-color: var(--gold-deep);
    background: #2a1f1466;
  }

  li span {
    color: var(--muted);
    font-size: 0.82rem;
  }
</style>
