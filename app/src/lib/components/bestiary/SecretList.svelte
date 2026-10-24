<script lang="ts">
  import { WORLD_SECRETS } from '#lib/game/collection.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
</script>

<div class="list">
  {#each WORLD_SECRETS as secret (secret.id)}
    {@const found = !!S.secrets[secret.id]}
    {@const available = secret.condition(S)}
    <article class="secret" class:found>
      <div class="icon" aria-hidden="true">{found ? secret.icon : '🔒'}</div>
      <div>
        <strong>{t(secret.name)}</strong>
        <small>{t(found ? 'Découvert · Récompense obtenue : ' + secret.reward : available ? 'Un secret attend d’être révélé. ' + secret.reward : secret.hint)}</small>
      </div>
      <button type="button" class="btn" disabled={found || !available} onclick={() => game.revealSecret(secret.id)}>
        {t(found ? 'Découvert' : available ? 'Révéler' : 'Verrouillé')}
      </button>
    </article>
  {/each}
</div>

<style>
  .list {
    display: grid;
    gap: 8px;
  }

  .secret {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
  }

  .secret > div:nth-child(2) {
    flex: 1;
    display: grid;
  }

  .secret.found {
    border-color: var(--gold-deep);
  }

  .icon {
    font-size: 1.8rem;
  }

  small {
    color: var(--muted);
  }
</style>
