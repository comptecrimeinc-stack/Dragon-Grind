<script lang="ts">
  import { dragonArt } from '#lib/assets.ts';
  import { DRAGON_DEX } from '#lib/game/constants.ts';
  import { stageIndex } from '#lib/game/economy.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  type Filter = 'all' | 'found' | 'missing';
  let filter = $state<Filter>('all');
  const FILTERS: [Filter, string][] = [
    ['all', 'Tout voir'],
    ['found', 'Découverts'],
    ['missing', 'À découvrir']
  ];

  const S = $derived(game.S);
  const entries = $derived(
    DRAGON_DEX.map((d) => ({ ...d, count: S.dragonDex[d.id] || 0 })).filter((d) => (filter === 'found' ? d.count > 0 : filter === 'missing' ? !d.count : true))
  );
</script>

<div class="filters" role="group" aria-label={t('Filtrer la collection')}>
  {#each FILTERS as [value, label] (value)}
    <button type="button" class:on={filter === value} aria-pressed={filter === value} onclick={() => (filter = value)}>{t(label)}</button>
  {/each}
</div>
<div class="dex">
  {#each entries as d (d.id)}
    <div class="item" class:found={d.count > 0}>
      {#if d.count}<img src={dragonArt(Number(d.id), stageIndex(S))} alt={t('Dragon') + ' ' + t(d.name)} />{/if}
      <strong>{d.count ? d.icon + ' ' + t(d.name) : '❔ ' + t('Lignée inconnue')}</strong>
      <span class="state">{t(d.count ? (d.count > 1 ? 'Découvert · ' + (d.count - 1) + ' doublon(s)' : 'Découvert') : 'À découvrir')}</span>
      <small>{t(d.count ? d.desc : 'Fais éclore des œufs ou explore le monde pour en apprendre davantage.')}</small>
    </div>
  {/each}
</div>

<style>
  .filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 16px 0 10px;
  }

  .filters button {
    padding: 6px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: transparent;
    cursor: pointer;
  }

  .filters button.on {
    background: var(--gold-deep);
    color: #fff1c9;
  }

  .dex {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .item {
    display: grid;
    gap: 4px;
    align-content: start;
    padding: 10px;
    border: 1px dashed var(--line);
    border-radius: 12px;
    background: #0006;
  }

  .item.found {
    border-style: solid;
    border-color: var(--gold-deep);
  }

  img {
    width: 100%;
    aspect-ratio: 8 / 9;
    object-fit: cover;
    border-radius: 9px;
  }

  .state {
    color: var(--ember);
    font-size: 0.8rem;
  }

  small {
    color: var(--muted);
    font-size: 0.8rem;
  }
</style>
