<script lang="ts">
  import { dexComplete, eggPrice, eggsOpened, eggWarmth } from '#lib/game/collection.ts';
  import { DEX_BONUS, DRAGON_DEX } from '#lib/game/constants.ts';
  import { discoveredDexCount } from '#lib/game/economy.ts';
  import { decimal1, formatNumber as f } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
  const warmth = $derived(eggWarmth(S));
  const complete = $derived(dexComplete(S));
  const found = $derived(discoveredDexCount(S));
  let wiggle = $state(0);

  function warm() {
    wiggle++;
    game.warmEgg();
  }
</script>

<div class="grid">
  <article class="card">
    <h3>🥚 {t('Œuf mystérieux')}</h3>
    <p class="muted">{t('Une éclosion révèle une lignée élémentaire. Chaque découverte apporte un petit bonus permanent de production ; les doublons donnent des fragments de collection.')}</p>
    <div class="stat">{t(complete ? 'Collection complète : les 7 lignées ont éclos ✦' : 'Coût : ' + f(eggPrice(S)) + ' mana')}</div>
    {#if warmth > 0}
      <div class="incubator">
        {#key wiggle}
          <button type="button" class="egg" class:wiggle={wiggle > 0} aria-label={t('Réchauffer l’œuf')} onclick={warm}>🥚</button>
        {/key}
        <div class="track"><i style:width="{warmth * 100}%"></i></div>
        <p>{t('Tapote l’œuf pour le réchauffer !')}</p>
      </div>
    {:else}
      <button type="button" class="btn primary" disabled={complete || S.gold < eggPrice(S)} onclick={() => game.startIncubation()}>
        {t(complete ? 'Collection complète ✦' : 'Placer un œuf en couvaison')}
      </button>
    {/if}
    <p class="muted">{t('Éclosions : ' + eggsOpened(S) + ' · éléments découverts : ' + found + ' / 7')}</p>
  </article>
  <article class="card">
    <h3>📚 {t('Codex des dragons')}</h3>
    <p class="muted">{t('Les éléments découverts sont enregistrés dans ta sauvegarde. Le codex conserve tes découvertes même après une renaissance ou une ascension.')}</p>
    <div class="stat">{t(found + ' / ' + DRAGON_DEX.length + ' éléments découverts')}</div>
    <div class="track"><i style:width="{(found / DRAGON_DEX.length) * 100}%"></i></div>
    <p class="muted">{t('Bonus de collection : +' + decimal1(found * DEX_BONUS * 100) + ' % de production')}</p>
  </article>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }

  .card {
    display: grid;
    gap: 10px;
    align-content: start;
  }

  .stat {
    font: 700 1rem var(--font-title);
    color: var(--gold);
  }

  .incubator {
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
  }

  .incubator .track {
    width: 100%;
  }

  .egg {
    font-size: 3.4rem;
    border: 0;
    background: radial-gradient(circle, #ffb04a44, transparent 70%);
    border-radius: 50%;
    padding: 10px 18px;
    cursor: pointer;
  }

  .egg.wiggle {
    animation: wiggle 0.4s;
  }

  @keyframes wiggle {
    25% {
      transform: rotate(-12deg);
    }
    75% {
      transform: rotate(12deg);
    }
  }
</style>
