<script lang="ts">
  import { discoveredDexCount } from '#lib/game/economy.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import DragonDex from './DragonDex.svelte';
  import EggIncubator from './EggIncubator.svelte';
  import SanctuaryList from './SanctuaryList.svelte';
  import SecretList from './SecretList.svelte';

  const found = $derived(discoveredDexCount(game.S));
</script>

<p class="intro">{t('Le cœur de ta collection : fais éclore les lignées, restaure les sanctuaires, révèle les secrets du monde puis pars en expédition avec ton équipe de dragons.')}</p>
<div class="card summary">
  <div>
    <span class="eyebrow">{t('BESTIAIRE DRACONIQUE')}</span>
    <strong>{t(found + ' / 7 lignées découvertes')}</strong>
    <small>{t(found === 7 ? 'Collection élémentaire complète ! Tous les éléments sont révélés.' : 7 - found + ' lignée(s) encore à découvrir.')}</small>
  </div>
  <div class="emblem" aria-hidden="true">🐉</div>
</div>
<h2>{t('Œufs draconiques')} <small>{t('collection permanente')}</small></h2>
<EggIncubator />
<DragonDex />
<h2>{t('Secrets du monde')} <small>{t('découvertes permanentes')}</small></h2>
<p class="muted">{t('Certains lieux se révèlent au fil de l’aventure. Un secret trouvé reste acquis, même après une renaissance.')}</p>
<SecretList />
<h2>{t('Sanctuaires élémentaires')} <small>{t('bonus permanents')}</small></h2>
<SanctuaryList />

<style>
  .summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
  }

  .summary div:first-child {
    display: grid;
  }

  .eyebrow {
    font: 700 0.72rem var(--font-title);
    letter-spacing: 0.15em;
    color: var(--ember);
  }

  strong {
    font: 800 1.2rem var(--font-title);
    color: var(--gold);
  }

  small {
    color: var(--muted);
  }

  .emblem {
    font-size: 2.6rem;
  }
</style>
