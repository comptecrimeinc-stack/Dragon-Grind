<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const toast = $derived(game.currentToast);
</script>

<div class="toast" class:on={!!toast} class:important={toast?.important} role="status" aria-live="polite">
  {toast ? t(toast.message) : ''}
</div>

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(18px + env(safe-area-inset-bottom));
    z-index: 900;
    width: max-content;
    max-width: min(92vw, 520px);
    padding: 12px 20px;
    border: 1px solid #9d7743;
    border-radius: 12px;
    background: linear-gradient(180deg, #f3dcae, #d7b57a);
    color: #2a1a0e;
    font: 700 0.95rem var(--font-title);
    font-variant: small-caps;
    text-align: center;
    box-shadow: var(--shadow);
    transform: translate(-50%, 140%);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 0.3s,
      opacity 0.3s;
  }

  .toast.on {
    transform: translate(-50%, 0);
    opacity: 1;
  }

  .toast.important {
    background: linear-gradient(180deg, #ffe9b0, #f0b45a);
    box-shadow:
      0 0 0 2px #ffcf7a66,
      0 0 30px #ff9a3a66;
  }
</style>
