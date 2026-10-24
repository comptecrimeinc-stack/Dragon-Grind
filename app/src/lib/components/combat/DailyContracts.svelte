<script lang="ts">
  import { CONTRACT_POOL } from '#lib/game/constants.ts';
  import { contractLocked, contractProgress, contractReward, contractTarget, dailyContractIds } from '#lib/game/daily.ts';
  import { baseSps, clickValue } from '#lib/game/economy.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
  const ids = $derived(dailyContractIds(S.daily.date));
</script>

<div class="card rows" aria-label={t('Contrats quotidiens')}>
  {#each ids as id (id)}
    {@const q = CONTRACT_POOL.find((c) => c.id === id)!}
    {@const target = contractTarget(S, id)}
    {@const n = Math.min(target, contractProgress(S, id))}
    {@const claimed = !!S.daily.claimed[id]}
    {@const locked = contractLocked(S, id)}
    <div class="row">
      <div class="copy">
        <strong>{t(q.name)}</strong>
        <div class="muted">{t(q.desc)}{id === 'dmg' ? ' (' + f(target) + ' ' + t('dégâts') + ')' : ''}</div>
        <div class="track"><i style:width="{Math.min(100, (n / target) * 100)}%"></i></div>
        <small>{id === 'dmg' ? f(n) + ' / ' + f(target) : n + ' / ' + target}{claimed ? ' · ' + t('récupéré') : ''}</small>
      </div>
      <button type="button" class="btn" disabled={claimed || n < target || locked} onclick={() => game.claimContract(id)}>
        {t(locked ? 'Chasse achevée ✦' : claimed ? 'Récupéré' : '+' + f(contractReward(S, id)))}
      </button>
    </div>
  {/each}
</div>
<div class="card power">
  <strong>💰 {t('Récompenses adaptées à ta puissance')}</strong>
  <small class="muted">
    {t('Puissance actuelle : ' + f(baseSps(S)) + ' mana/s hors bonus temporaires et ' + f(clickValue(S)) + ' mana par souffle. Récompense = base liée à ta progression + production passive (20 à 30 s) + puissance du souffle (50 à 125 souffles équivalents). Le montant est recalculé à la réclamation.')}
  </small>
</div>

<style>
  .rows {
    display: grid;
    gap: 0;
    padding: 6px 16px;
  }

  .row {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 0;
  }

  .row + .row {
    border-top: 1px solid #ffffff10;
  }

  .copy {
    flex: 1;
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .copy small {
    color: var(--muted);
  }

  .btn {
    min-width: 96px;
  }

  .power {
    display: grid;
    gap: 4px;
    margin-top: 10px;
  }
</style>
