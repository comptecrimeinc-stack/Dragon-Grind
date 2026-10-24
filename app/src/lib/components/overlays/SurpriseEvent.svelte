<script lang="ts">
  import { SURPRISE_ICONS } from '#lib/game/collection.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game, type Surprise } from '#lib/stores/game.svelte.ts';

  let { surprise }: { surprise: Surprise } = $props();
</script>

<button
  type="button"
  class="event"
  class:out={surprise.leaving}
  style:left="{surprise.left}%"
  style:top="{surprise.top}%"
  aria-label={t('Surprise de la forge : touche pour la récupérer')}
  onclick={() => game.catchSurprise()}
>
  <span>{SURPRISE_ICONS[surprise.kind]}</span>
</button>

<style>
  .event {
    position: fixed;
    z-index: 700;
    width: 64px;
    height: 64px;
    border: 2px solid #ffd27a;
    border-radius: 50%;
    background: radial-gradient(circle, #ffcf7a55, #3a1d1099 70%);
    box-shadow: 0 0 24px #ffb04a99;
    font-size: 2rem;
    cursor: pointer;
    animation:
      pop 0.4s ease-out,
      float 2.4s ease-in-out infinite 0.4s;
    transition:
      opacity 0.7s,
      transform 0.7s;
  }

  .event.out {
    opacity: 0;
    transform: scale(0.4);
  }

  @keyframes pop {
    from {
      transform: scale(0);
    }
  }

  @keyframes float {
    50% {
      transform: translateY(-10px) rotate(6deg);
    }
  }
</style>
