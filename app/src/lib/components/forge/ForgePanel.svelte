<script lang="ts">
  import { plural } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import RelicSection from './RelicSection.svelte';
  import TalentList from './TalentList.svelte';
  import UpgradeList from './UpgradeList.svelte';

  const embers = $derived(game.S.embers);
</script>

<p class="intro">{t('Tout ce qui rend ton dragon plus fort : améliorations, talents de braise et reliques des titans. Chaque rayon de la forge a une fin — mène tout au maximum.')}</p>
<h2>{t('Améliorations')} <small>{t('la base de ta puissance')}</small></h2>
<UpgradeList />
<h2>{t('Talents de braise')} <small>{t(plural(embers, 'braise') + ' disponible' + (embers > 1 ? 's' : ''))}</small></h2>
<TalentList />
<h2>{t('Reliques draconiques')} <small>{t('équipement permanent')}</small></h2>
<RelicSection />
