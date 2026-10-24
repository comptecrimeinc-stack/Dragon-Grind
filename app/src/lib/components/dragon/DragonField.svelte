<script lang="ts">
  import { activeLineage } from '#lib/game/combat.ts';
  import { LINEAGES, STAGES } from '#lib/game/constants.ts';
  import { stageIndex, stageProgress } from '#lib/game/economy.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { lineageUnlocked, nextLineage } from '#lib/game/progression.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import DragonPortrait from './DragonPortrait.svelte';

  const S = $derived(game.S);
  const stage = $derived(stageIndex(S));
  const next = $derived(STAGES[stage + 1]);
  const current = $derived(activeLineage(S));
  const upcoming = $derived(nextLineage(S));
</script>

<section class="field card" aria-label={t('Dragon de la forge')}>
  <DragonPortrait />
  <div class="info">
    <div class="stage">
      <b>{t(STAGES[stage].name)}</b>
      <span>{t(next ? 'Prochain stade : ' + f(next.threshold) + ' mana au total' : 'Forme finale')}</span>
    </div>
    <div class="track"><i style:width="{stageProgress(S) * 100}%"></i></div>
    {#if S.taps < 5}<p class="hint">{t('Touchez le dragon pour cracher du feu')}</p>{/if}

    <div class="label" id="lineage-label">{t('Lignée du dragon')}</div>
    <div class="lineages" role="group" aria-labelledby="lineage-label">
      {#each LINEAGES as l, i (l.name)}
        {@const locked = !lineageUnlocked(S, i)}
        <button
          type="button"
          class:on={i === current}
          class:locked
          style:--lc={l.color}
          aria-pressed={i === current}
          aria-disabled={locked}
          onclick={() => game.selectLineage(i)}>{locked ? '🔒 ' : ''}{t(l.name)}</button
        >
      {/each}
    </div>
    <p class="hint">
      {upcoming ? t('Prochaine lignée') + ', ' + t(upcoming.name) + ' : ' + t(upcoming.condition) + '.' : t('Toutes les lignées sont débloquées')}
    </p>
  </div>
</section>

<style>
  .field {
    display: grid;
    gap: 18px;
    padding: 18px;
    margin-top: 16px;
  }

  @media (min-width: 760px) {
    .field {
      grid-template-columns: minmax(260px, 340px) 1fr;
      align-items: center;
      gap: 32px;
      padding: 22px 32px;
    }
  }

  .info {
    display: grid;
    gap: 12px;
    min-width: 0;
  }

  .stage {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stage b {
    font: 800 1.15rem var(--font-title);
    font-variant: small-caps;
    color: var(--gold);
  }

  .stage span,
  .hint {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0;
  }

  .label {
    margin-top: 10px;
    font: 700 0.85rem var(--font-title);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
  }

  .lineages {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 2px 8px;
    scrollbar-width: thin;
  }

  .lineages button {
    flex: none;
    min-height: 42px;
    padding: 6px 16px;
    border: 1px solid var(--lc);
    border-radius: 99px;
    background: transparent;
    font: 700 0.9rem var(--font-title);
    font-variant: small-caps;
    cursor: pointer;
  }

  .lineages button.on {
    background: var(--lc);
    color: #10131c;
    box-shadow: 0 0 14px color-mix(in srgb, var(--lc) 60%, transparent);
  }

  .lineages button.locked {
    border-style: dashed;
    border-color: #ffffff22;
    color: #ffffff55;
  }
</style>
