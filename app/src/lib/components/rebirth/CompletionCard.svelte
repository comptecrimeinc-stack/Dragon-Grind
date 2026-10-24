<script lang="ts">
  import { completionRatio, completionRows } from '#lib/game/progression.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const rows = $derived(completionRows(game.S));
  const pct = $derived(completionRatio(game.S));
</script>

<div class="card">
  <div class="head"><strong>✦ {t('Aventure accomplie')}</strong><span>{Math.floor(pct * 100)} %</span></div>
  <div class="track"><i style:width="{Math.min(100, pct * 100)}%"></i></div>
  <div class="rows">
    {#each rows as r (r.name)}
      <div class="row" class:done={r.value >= r.max}>
        <span aria-hidden="true">{r.icon}</span>
        <span>{t(r.name)}</span>
        <span class="val">{r.value >= r.max ? '✦ ' : ''}{r.value} / {r.max}</span>
      </div>
    {/each}
  </div>
  {#if pct >= 1}<p class="final">{t('✦ La légende de la forge est complète : chaque contenu a été mené à son terme.')}</p>{/if}
</div>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font: 700 1rem var(--font-title);
    color: var(--gold);
  }

  .rows {
    display: grid;
    gap: 4px;
    margin-top: 12px;
  }

  .row {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #ffffff0c;
  }

  .row.done .val {
    color: var(--gold);
  }

  .val {
    color: var(--muted);
  }

  .final {
    margin-top: 10px;
    color: var(--gold);
  }
</style>
