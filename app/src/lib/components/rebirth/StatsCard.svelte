<script lang="ts">
  import { ZONE_COUNT } from '#lib/game/constants.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
  const rows = $derived.by(() => {
    const ms = S.playMs || 0;
    const h = Math.floor(ms / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    return [
      ['🔥', 'Souffles crachés', f(S.taps)],
      ['💧', 'Mana récolté au total', f(S.life)],
      ['⚔️', 'Titans vaincus', String(S.bossKills)],
      ['🥚', 'Œufs éclos', String(S.eggsOpened)],
      ['☄️', 'Surprises attrapées', String(S.evCaught)],
      ['⏱️', 'Temps de forge', (h > 0 ? h + ' h ' : '') + m + ' min'],
      ['🗺️', 'Zones explorées', Math.min(S.adventure?.unlocked || 1, ZONE_COUNT) + ' / ' + ZONE_COUNT],
      ['🔁', 'Renaissances', S.rk + ' · ⭐ ' + S.asc + ' ' + t('ascensions')]
    ];
  });
</script>

<div class="card rows">
  {#each rows as [icon, label, value] (label)}
    <div class="row"><span aria-hidden="true">{icon}</span><span>{t(label)}</span><span class="val">{value}</span></div>
  {/each}
</div>

<style>
  .rows {
    display: grid;
    gap: 4px;
  }

  .row {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #ffffff0c;
  }

  .val {
    color: var(--gold);
    font-weight: 700;
  }
</style>
