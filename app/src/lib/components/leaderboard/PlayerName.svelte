<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import type { EntryKind } from '../profile/profileEntry.ts';

  let { kind, name, dragon }: { kind: EntryKind; name: string; dragon: string } = $props();
  const TAGS: Partial<Record<EntryKind, string>> = { me: 'toi', hero: 'inscrit', world: 'mondial' };
</script>

<button type="button" class="name" onclick={() => (game.profileCard = { kind, name, dragon })}>
  <span>{kind === 'npc' ? t(name) : name}</span>
  {#if TAGS[kind]}<em class={kind}>{t(TAGS[kind])}</em>{/if}
  {#if kind === 'me' && game.isEquipped('founder-badge')}<em class="badge">🏅 {t('Soutien')}</em>{/if}
</button>

<style>
  .name {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    text-align: start;
    cursor: pointer;
  }

  .name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name:hover span {
    text-decoration: underline;
  }

  em {
    flex: none;
    padding: 0 6px;
    border-radius: 99px;
    font-size: 0.7rem;
    font-style: normal;
    background: #ffffff14;
    color: var(--muted);
  }

  em.me {
    background: var(--ember);
    color: #2a1206;
  }

  em.badge {
    background: #2a1f14;
    color: var(--gold);
  }
</style>
