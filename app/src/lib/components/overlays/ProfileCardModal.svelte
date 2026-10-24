<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import ProfileCard from '../profile/ProfileCard.svelte';
  import { findEntry } from '../profile/profileEntry.ts';
  import Modal from '../ui/Modal.svelte';

  const close = () => (game.profileCard = null);
  const entry = $derived(
    game.profileCard ? findEntry(game.profileCard.kind, game.profileCard.name, game.profileCard.dragon, { me: game.score, heroes: game.heroes, world: game.leaderboard.cached }) : null
  );
</script>

{#if entry}
  <Modal labelledby="profile-card-title" onclose={close}>
    <button type="button" class="close" aria-label={t('Fermer la carte de profil')} onclick={close}>×</button>
    <ProfileCard {entry} titleId="profile-card-title" />
  </Modal>
{/if}

<style>
  .close {
    float: inline-end;
    width: 38px;
    height: 38px;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: transparent;
    font-size: 1.3rem;
    cursor: pointer;
  }
</style>
