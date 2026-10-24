<script lang="ts">
  import { SANCTUARIES } from '#lib/game/constants.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
</script>

<div class="card">
  <p class="muted">{t('Restaure les sanctuaires avec du mana. Chaque sanctuaire restauré augmente la production globale de 3 %. Les sanctuaires et le codex survivent aux renaissances et aux ascensions.')}</p>
  {#each SANCTUARIES as z (z.id)}
    {@const owned = !!S.sanctuaries[z.id]}
    <div class="row">
      <div>
        <strong>{z.icon} {t(z.name)}</strong>
        <small>{t(z.desc)} {t(owned ? 'Bonus permanent actif : +3 % de production.' : 'Coût de restauration : ' + f(z.cost) + ' mana.')}</small>
      </div>
      <button type="button" class="btn" disabled={owned || S.gold < z.cost} onclick={() => game.restoreSanctuary(z.id)}>{t(owned ? 'Restauré' : 'Restaurer')}</button>
    </div>
  {/each}
</div>

<style>
  .row {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid #ffffff10;
  }

  .row > div {
    flex: 1;
    display: grid;
  }

  small {
    color: var(--muted);
  }
</style>
