<script lang="ts">
  import { formatDuration, formatNumber } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import Modal from '../ui/Modal.svelte';

  let { seconds, earned }: { seconds: number; earned: number } = $props();
</script>

<Modal labelledby="offline-title" onclose={() => game.closeOffline()}>
  <div class="offline">
    <div class="orn" aria-hidden="true">✦ 🐉 ✦</div>
    <h2 id="offline-title">{t('Le sanctuaire vous attend')}</h2>
    <p class="sub">{t('Pendant votre absence, vos dragons ont poursuivi leur travail…')}</p>
    <div class="stats">
      <div><span aria-hidden="true">⏳</span><small>{t('Temps comptabilisé')}</small><strong>{formatDuration(seconds)}</strong></div>
      <div><span aria-hidden="true">🔮</span><small>{t('Mana récupéré')}</small><strong>+{formatNumber(earned)} {t('mana')}</strong></div>
    </div>
    <button type="button" class="btn primary" onclick={() => game.closeOffline()}>{t('Récupérer mes gains')}</button>
    <p class="foot">{t('Tes récompenses ont déjà été ajoutées à ta sauvegarde.')}</p>
  </div>
</Modal>

<style>
  .offline {
    text-align: center;
  }

  .orn {
    font-size: 1.8rem;
  }

  h2 {
    justify-content: center;
    margin: 8px 0;
  }

  .sub,
  .foot {
    color: var(--muted);
  }

  .foot {
    font-size: 0.85rem;
    margin-top: 12px;
  }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 18px 0;
  }

  .stats div {
    display: grid;
    gap: 2px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #0008;
  }

  .stats span {
    font-size: 1.5rem;
  }

  .stats small {
    color: var(--muted);
  }

  .stats strong {
    color: var(--gold);
    font-size: 1.15rem;
  }

  .btn {
    width: 100%;
  }
</style>
