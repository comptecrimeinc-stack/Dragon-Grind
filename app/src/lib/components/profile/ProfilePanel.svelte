<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import HeraldryEditor from './HeraldryEditor.svelte';
  import ProfileCard from './ProfileCard.svelte';
  import { findEntry } from './profileEntry.ts';

  const entry = $derived(findEntry('me', '', '', { me: game.score, heroes: game.heroes, world: null })!);
</script>

<p class="intro">{t('Ta carte de forgeron : lignée, cadre héraldique et exploits. Dans le classement, clique sur le nom d’un joueur pour ouvrir sa carte.')}</p>
<div class="card-wrap"><ProfileCard {entry} /></div>
<HeraldryEditor />

<style>
  .card-wrap {
    margin-top: 16px;
  }
</style>
