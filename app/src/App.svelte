<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import BestiaryPanel from '#lib/components/bestiary/BestiaryPanel.svelte';
  import CombatPanel from '#lib/components/combat/CombatPanel.svelte';
  import DragonField from '#lib/components/dragon/DragonField.svelte';
  import ExpeditionPanel from '#lib/components/expedition/ExpeditionPanel.svelte';
  import ForgePanel from '#lib/components/forge/ForgePanel.svelte';
  import Header from '#lib/components/layout/Header.svelte';
  import TabBar from '#lib/components/layout/TabBar.svelte';
  import LeaderboardPanel from '#lib/components/leaderboard/LeaderboardPanel.svelte';
  import LanguageGate from '#lib/components/overlays/LanguageGate.svelte';
  import OfflineModal from '#lib/components/overlays/OfflineModal.svelte';
  import ProfileCardModal from '#lib/components/overlays/ProfileCardModal.svelte';
  import ProfileGate from '#lib/components/overlays/ProfileGate.svelte';
  import SettingsModal from '#lib/components/overlays/SettingsModal.svelte';
  import SurpriseEvent from '#lib/components/overlays/SurpriseEvent.svelte';
  import Toast from '#lib/components/overlays/Toast.svelte';
  import TutorialCard from '#lib/components/overlays/TutorialCard.svelte';
  import ProfilePanel from '#lib/components/profile/ProfilePanel.svelte';
  import RebirthPanel from '#lib/components/rebirth/RebirthPanel.svelte';
  import ShopPanel from '#lib/components/shop/ShopPanel.svelte';
  import type { TabId } from '#lib/game/constants.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const PANELS: Record<TabId, Component> = {
    combat: CombatPanel,
    forge: ForgePanel,
    bestiaire: BestiaryPanel,
    expedition: ExpeditionPanel,
    classement: LeaderboardPanel,
    renaissance: RebirthPanel,
    profil: ProfilePanel,
    boutique: ShopPanel
  };

  let ready = $state(false);

  onMount(() => {
    game.load();
    let stop = () => {};
    void game.applyLanguage().then(() => {
      ready = true;
      stop = game.start();
    });
    return () => stop();
  });

  $effect(() => {
    document.body.classList.toggle('reduced-motion', game.settings.motion);
  });

  const Panel = $derived(PANELS[game.activeTab]);
</script>

{#if ready}
  {#if !game.profile && !game.languageChosen}
    <LanguageGate />
  {:else if !game.profile}
    <ProfileGate />
  {:else}
    <a class="skip" href="#main">{t('Aller au contenu principal')}</a>
    <Header />
    <main id="main" tabindex="-1">
      <DragonField />
      <TabBar />
      <div id="panel-{game.activeTab}" role="tabpanel" tabindex="-1" aria-labelledby="tab-{game.activeTab}" class="panel">
        <Panel />
      </div>
    </main>

    {#if game.S.tuto !== 1}<TutorialCard />{/if}
    {#if game.surprise}<SurpriseEvent surprise={game.surprise} />{/if}
    {#if game.dialog === 'settings'}
      <SettingsModal />
    {:else if game.dialog === 'profile'}
      <ProfileCardModal />
    {:else if game.dialog === 'offline' && game.offline}
      <OfflineModal seconds={game.offline.seconds} earned={game.offline.earned} />
    {/if}
  {/if}
  <Toast />
{/if}

<style>
  main {
    width: min(var(--maxw), 100%);
    margin-inline: auto;
    padding: 0 var(--gutter) calc(120px + var(--bottom-offset));
  }

  main:focus {
    outline: none;
  }

  .panel {
    min-width: 0;
  }

  /* Masqué hors écran vers le haut (neutre en LTR comme en RTL) jusqu'au focus clavier. */
  .skip {
    position: absolute;
    inset-inline-start: 8px;
    top: 8px;
    z-index: 100;
    padding: 8px 12px;
    background: var(--gold);
    color: #000;
    transform: translateY(-200%);
  }

  .skip:focus {
    transform: none;
  }
</style>
