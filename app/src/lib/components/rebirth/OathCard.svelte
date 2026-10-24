<script lang="ts">
  import { ASC_CAP, OATH_PATHS } from '#lib/game/constants.ts';
  import { oathLevel } from '#lib/game/economy.ts';
  import { oathEffect, oathsAvailable } from '#lib/game/forge.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
  const avail = $derived(oathsAvailable(S));
  const current = $derived(OATH_PATHS.find((p) => p.id === S.path));
</script>

<div class="oath">
  <h3>🗡️ {t('Serment de transcendance')}</h3>
  <p class="muted">{t('À chaque ascension, jure fidélité à une seule voie : sa faveur grandit à chaque serment renouvelé. Mais si tu changes de voie, tout l’acquis s’éteint.')}</p>
  {#if current}
    <div class="current">{current.icon} {t('Serment actuel')} : <strong>{t(current.name)}</strong> · {t('fidélité ×' + oathLevel(S, current.id))}</div>
  {/if}
  <div class="grid">
    {#each OATH_PATHS as p (p.id)}
      {@const effect = oathEffect(p.id, oathLevel(S, p.id))}
      <button type="button" class:current={S.path === p.id} disabled={avail <= 0} title={t(effect)} onclick={() => game.swearOath(p.id)}>
        <span aria-hidden="true">{p.icon}</span>
        <strong>{t(p.name)}</strong>
        <small>{t(effect + (S.path === p.id ? ' · voeu actuel' : ''))}</small>
      </button>
    {/each}
  </div>
  <p class="muted">
    {t(avail > 0 ? '✦ Un serment t’attend : choisis ta voie.' : S.asc >= ASC_CAP && S.oaths >= ASC_CAP ? '✦ Les dix serments sont scellés — ta légende est écrite.' : 'Prochain serment disponible à l’ascension n°' + (S.oaths + 1) + '.')}
  </p>
</div>

<style>
  .oath {
    padding: 12px;
    border: 1px solid #5a4a8a;
    border-radius: 12px;
  }

  .current {
    margin-bottom: 8px;
    color: var(--gold);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
  }

  .grid button {
    display: grid;
    gap: 2px;
    justify-items: center;
    text-align: center;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
  }

  .grid button.current {
    border-color: #b48cf2;
    background: #231d3a99;
  }

  .grid button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  small {
    color: var(--muted);
  }
</style>
