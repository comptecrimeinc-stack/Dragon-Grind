<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import AscensionCard from './AscensionCard.svelte';
  import CompletionCard from './CompletionCard.svelte';
  import RebirthCard from './RebirthCard.svelte';
  import SecurityLog from './SecurityLog.svelte';
  import StatsCard from './StatsCard.svelte';

  const DAY = 864e5;
  // Rappel d'export : la progression ne vit que dans ce navigateur.
  const nudge = $derived(!game.S.lastExport || game.now - game.S.lastExport > 3 * DAY);
</script>

<p class="intro">{t('Le grand cycle : renais pour grandir, transcende pour durer, puis mesure-toi aux rivaux de la forge.')}</p>
{#if nudge}
  <button type="button" class="nudge" onclick={() => (game.settingsOpen = true)}>
    💾 {t('Ta progression ne vit que dans ce navigateur. Exporte une copie maintenant pour ne rien perdre.')}
  </button>
{/if}
<h2>{t('Grand livre de la forge')} <small>{t('l’avancement de ta légende')}</small></h2>
<CompletionCard />
<h2>{t('Chroniques de la forge')} <small>{t('tes chiffres de légende')}</small></h2>
<StatsCard />
<h2>{t('Renaissance')} <small>{t('le cycle de la forge · 20 au total')}</small></h2>
<RebirthCard />
<h2>{t('Ascension')} <small>{t('transcendance permanente · 10 au total')}</small></h2>
<AscensionCard />
<h2>{t('Sécurité')}</h2>
<SecurityLog />

<style>
  .nudge {
    width: 100%;
    margin-top: 12px;
    padding: 12px 14px;
    border: 1px dashed var(--gold-deep);
    border-radius: 12px;
    background: #2a1f1466;
    text-align: start;
    cursor: pointer;
  }
</style>
