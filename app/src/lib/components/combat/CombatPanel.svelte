<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import ConfirmButton from '../ui/ConfirmButton.svelte';
  import AchievementList from './AchievementList.svelte';
  import DailyContracts from './DailyContracts.svelte';
  import TitanCard from './TitanCard.svelte';
</script>

<p class="intro">{t('Affronte les titans, réclame tes contrats quotidiens et coche tes succès. De nouveaux systèmes se débloquent au fil de tes progrès.')}</p>
<div class="layout">
  <div>
    <h2>{t('Chasse aux titans')} <small>{t('épreuve de combat')}</small></h2>
    <TitanCard />
  </div>
  <div>
    <h2>{t('Contrats quotidiens')} <small>{t('Renouvellement quotidien · récompenses à réclamer')}</small></h2>
    <DailyContracts />
  </div>
</div>
<h2>{t('Succès')} <small>{t('la checklist de la forge')}</small></h2>
<AchievementList />
<div class="reset">
  <ConfirmButton label="Effacer la sauvegarde" confirmLabel="Toucher encore pour tout effacer" variant="ghost" onconfirm={() => game.resetGame()} />
</div>

<style>
  .layout {
    display: grid;
    gap: 0 20px;
  }

  @media (min-width: 900px) {
    .layout {
      grid-template-columns: 1.2fr 1fr;
    }
  }

  .reset {
    margin-top: 20px;
  }
</style>
