<script lang="ts">
  import { CHAPTERS } from '#lib/game/constants.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const a = $derived(game.adventureState);
</script>

<div class="map">
  {#each CHAPTERS as c, ci (c.name)}
    {#each c.zones as name, zi (name)}
      {@const i = ci * 3 + zi}
      {@const unlocked = i < a.unlocked}
      <button type="button" class="zone" class:active={i === a.zone} disabled={!unlocked} onclick={() => game.advZone(i)}>
        <span class="icon" aria-hidden="true">{i % 3 === 2 ? '👑' : c.icon}</span>
        <span class="copy">
          <strong>{i + 1}. {t(name)}</strong>
          <small>{t(unlocked ? 'Difficulté ' + (i + 1) + ' · ' + (i === a.zone ? 'Zone active' : 'Accessible') : 'Zone verrouillée')}</small>
          <em>{t(i % 3 === 2 ? 'Boss de chapitre' : 'Or + matériaux communs')}</em>
        </span>
      </button>
    {/each}
  {/each}
</div>

<style>
  .map {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
  }

  .zone {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    text-align: start;
    cursor: pointer;
  }

  .zone.active {
    border-color: var(--ember);
    box-shadow: 0 0 14px #ff8a3a44;
  }

  .zone:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.6rem;
  }

  .copy {
    display: grid;
  }

  small,
  em {
    color: var(--muted);
    font-size: 0.8rem;
  }
</style>
