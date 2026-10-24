<script lang="ts">
  import { LOGO } from '#lib/assets.ts';
  import { clickValue, nextProductionMilestone, prestigeProduction, sps } from '#lib/game/economy.ts';
  import { formatNumber as f, plural } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);

  const currencies = $derived(
    [S.stars ? '✦ ' + plural(S.stars, 'étoile') : '', S.eAll ? plural(S.embers, 'braise') + ' à dépenser' : ''].filter(Boolean).join(' · ')
  );

  const seal = $derived.by(() => {
    const factor = prestigeProduction(S);
    const next = nextProductionMilestone(S);
    if (factor <= 1) return '✧ Prochain sceau de renaissance : ×2 à 3 renaissances';
    return '✦ Sceau de renaissance : ×' + factor + (next ? ' · prochain palier ×' + next.mult + ' à ' + next.rank + ' renaissances' : ' · tous les sceaux éveillés');
  });
</script>

<header>
  <div class="brand">
    {#if game.settings.logo}
      <img src={LOGO} alt={t('Emblème Dragon Grind : dragon doré autour d’un œil incandescent')} />
    {/if}
    <div class="copy">
      <strong>DRAGON GRIND</strong>
      {#if currencies}<span class="em">{t(currencies)}</span>{/if}
      <span class="rate">{f(sps(S, game.now))} {t('mana/s')} · {f(clickValue(S))} {t('par souffle')}</span>
      <span class="seal" aria-live="polite">{t(seal)}</span>
    </div>
  </div>
  <div class="mana"><b>{f(S.gold)}</b> <span>{t('mana')}</span></div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 10px var(--gutter);
    padding-top: max(10px, env(safe-area-inset-top));
    background: linear-gradient(180deg, #07070bf5, #07070bdd);
    border-bottom: 1px solid #ffffff12;
    backdrop-filter: blur(8px);
  }

  .brand {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    min-width: 0;
  }

  img {
    width: 46px;
    height: 46px;
    border-radius: 10px;
    border: 1px solid var(--line-strong);
    box-shadow: 0 0 14px #ff8a3a44;
    flex: none;
  }

  .copy {
    display: grid;
    gap: 1px;
    min-width: 0;
  }

  strong {
    font: 800 1.05rem var(--font-title);
    letter-spacing: 0.18em;
    color: var(--gold);
    line-height: 1.6;
  }

  .em {
    color: var(--ember);
    font-weight: 700;
    font-size: 0.85rem;
  }

  .rate {
    color: var(--muted);
    font-size: 0.8rem;
  }

  .seal {
    color: var(--gold);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .mana {
    text-align: end;
    white-space: nowrap;
  }

  .mana b {
    font: 800 clamp(1.6rem, 6vw, 2.4rem) var(--font-title);
    color: #ffe0a0;
    text-shadow: 0 0 18px #ff9a3a66;
  }

  .mana span {
    color: var(--muted);
    font-size: 0.85rem;
  }

  /* Mobile : en-tête compact, le titre tient sur une ligne et laisse la place au jeu. */
  @media (max-width: 759px) {
    header {
      padding-block: 8px;
      gap: 8px;
    }

    img {
      width: 38px;
      height: 38px;
    }

    strong {
      font-size: 0.85rem;
      letter-spacing: 0.1em;
      line-height: 1.4;
      white-space: nowrap;
    }

    .em,
    .rate,
    .seal {
      font-size: 0.72rem;
      line-height: 1.3;
    }
  }
</style>
