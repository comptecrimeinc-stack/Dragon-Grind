<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
</script>

<aside class="tuto">
  <div>
    <strong>{t('Bienvenue dans la Forge !')}</strong>
    <span class="hand" aria-hidden="true">👇</span>
    {t('Tapote le dragon pour cracher du feu et gagner du mana. Le reste se débloque au fil de tes progrès.')}
  </div>
  <button type="button" class="btn ghost" onclick={() => game.dismissTutorial()}>{t('Passer')}</button>
</aside>

<style>
  .tuto {
    position: fixed;
    left: 50%;
    bottom: calc(80px + var(--bottom-offset));
    z-index: 800;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    align-items: center;
    width: min(92vw, 520px);
    padding: 14px 16px;
    border: 1px solid var(--gold-deep);
    border-radius: 14px;
    background: #17110ef2;
    box-shadow: var(--shadow);
  }

  strong {
    display: block;
    color: var(--gold);
    font-family: var(--font-title);
  }

  .hand {
    display: inline-block;
    animation: bob 1.2s ease-in-out infinite;
  }

  @keyframes bob {
    50% {
      transform: translateY(4px);
    }
  }
</style>
