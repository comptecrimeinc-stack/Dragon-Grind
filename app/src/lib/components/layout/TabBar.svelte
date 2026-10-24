<script lang="ts">
  import { TABS, type TabId } from '#lib/game/constants.ts';
  import { tabUnlocked } from '#lib/game/progression.ts';
  import { i18n, t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const tabs = $derived(TABS.filter((tab) => tabUnlocked(game.S, tab.id)));
  let nav: HTMLDivElement;
  let canScroll = $state({ left: false, right: false });

  function updateEdges() {
    if (!nav) return;
    const max = nav.scrollWidth - nav.clientWidth;
    const pos = Math.abs(nav.scrollLeft);
    canScroll = { left: max > 2 && pos > 2, right: max > 2 && pos < max - 2 };
  }

  $effect(() => {
    void tabs.length;
    updateEdges();
    const ro = new ResizeObserver(updateEdges);
    ro.observe(nav);
    return () => ro.disconnect();
  });

  function scroll(direction: 1 | -1) {
    const rtl = i18n.dir === 'rtl' ? -1 : 1;
    nav.scrollBy({ left: direction * rtl * Math.max(120, nav.clientWidth * 0.76), behavior: 'smooth' });
  }

  function select(id: TabId, focus = false) {
    game.openTab(id);
    if (focus) {
      const el = nav.querySelector<HTMLElement>(`[data-tab="${id}"]`);
      el?.focus();
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  // Flèches gauche/droite, Début/Fin : navigation au clavier entre onglets (sens inversé en RTL).
  function onkeydown(e: KeyboardEvent) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = tabs.findIndex((x) => x.id === game.activeTab);
    const forward = i18n.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === forward ? 1 : -1) + tabs.length) % tabs.length;
    select(tabs[n].id, true);
  }
</script>

<nav class="wrap" aria-label={t('Navigation')}>
  <button type="button" class="tab settings" aria-haspopup="dialog" onclick={() => (game.settingsOpen = true)}>
    <span class="ti" aria-hidden="true">⚙️</span><span class="tl">{t('Paramètres')}</span>
  </button>
  <button type="button" class="arrow" hidden={!canScroll.left && !canScroll.right} disabled={!canScroll.left} aria-label={t('Faire défiler les onglets vers la gauche')} onclick={() => scroll(-1)}>‹</button>
  <div class="tabs" aria-label={t('Navigation de progression')} role="tablist" tabindex="-1" bind:this={nav} onscroll={updateEdges} {onkeydown}>
    {#each tabs as tab (tab.id)}
      {@const active = tab.id === game.activeTab}
      <button
        type="button"
        role="tab"
        class="tab"
        class:active
        data-tab={tab.id}
        id="tab-{tab.id}"
        aria-selected={active}
        aria-controls="panel-{tab.id}"
        tabindex={active ? 0 : -1}
        onclick={() => select(tab.id)}
      >
        <span class="ti" aria-hidden="true">{tab.icon}</span><span class="tl">{t(tab.label)}</span>
        {#if game.noticeTabs.includes(tab.id)}<span class="badge" aria-label={t('Nouvelle notification')}>!</span>{/if}
      </button>
    {/each}
  </div>
  <button type="button" class="arrow" hidden={!canScroll.left && !canScroll.right} disabled={!canScroll.right} aria-label={t('Faire défiler les onglets vers la droite')} onclick={() => scroll(1)}>›</button>
</nav>

<style>
  .wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 18px 0 12px;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: #0d0a0ff2;
    backdrop-filter: blur(8px);
  }

  .tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    flex: 1;
    min-width: 0;
    padding: 4px 2px;
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  .tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    min-height: 46px;
    padding: 6px 12px;
    border: 1px solid #ffffff14;
    border-radius: 11px;
    background: #17121a;
    color: var(--ink-2);
    font: 700 0.8rem var(--font-title);
    cursor: pointer;
  }

  .tab.settings {
    flex-direction: column;
    gap: 0;
    padding: 4px 10px;
    border-color: var(--line-strong);
  }

  .tab.active {
    background: linear-gradient(180deg, #ffb06a, #e8672e);
    border-color: #ffd29a;
    color: #2a1206;
    box-shadow: 0 0 16px #ff8a3a55;
  }

  .ti {
    font-size: 1.1rem;
  }

  .badge {
    position: absolute;
    top: -7px;
    inset-inline-end: -5px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--gold-2);
    color: #2a1206;
    font-size: 0.7rem;
  }

  .arrow {
    flex: none;
    width: 30px;
    min-height: 46px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: #17121a;
    cursor: pointer;
    font-size: 1.3rem;
  }

  .arrow:disabled {
    opacity: 0.35;
  }

  .arrow[hidden] {
    display: none;
  }

  /* Mobile : barre flottante en bas de l'écran, toujours à portée de pouce, sans défilement.
     Chaque onglet se réduit à son icône ; seul l'onglet actif affiche son nom. */
  @media (max-width: 759px) {
    .wrap {
      position: fixed;
      inset-inline: 8px;
      bottom: calc(8px + env(safe-area-inset-bottom));
      z-index: 60;
      height: var(--bottom-nav-h);
      margin: 0;
      padding: 6px;
      gap: 4px;
      border-color: var(--line-strong);
      box-shadow: 0 -4px 30px #000c;
    }

    .arrow {
      display: none;
    }

    .tabs {
      overflow: visible;
      padding: 0;
      gap: 4px;
    }

    .tab,
    .tab.settings {
      flex: 1 1 0;
      min-width: 0;
      height: 100%;
      min-height: 0;
      flex-direction: column;
      justify-content: center;
      gap: 1px;
      padding: 2px;
      /* Police du texte, plus étroite que Cinzel : « Renaissance » tient dans l'onglet actif. */
      font: 700 0.7rem var(--font-body);
    }

    .tab.settings {
      flex: 0 0 auto;
      width: 42px;
    }

    .tab.active {
      flex: 3.6 1 0;
    }

    .ti {
      font-size: 1.25rem;
      line-height: 1;
    }

    .tl {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Nom masqué visuellement mais lu par les lecteurs d'écran. */
    .tab:not(.active) .tl {
      position: absolute;
      width: 1px;
      height: 1px;
      clip: rect(0 0 0 0);
    }

    .badge {
      top: -6px;
      inset-inline-end: -2px;
    }
  }
</style>
