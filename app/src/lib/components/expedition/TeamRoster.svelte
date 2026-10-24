<script lang="ts">
  import { dragonArt, asset } from '#lib/assets.ts';
  import { dragonLevel, dragonPower } from '#lib/game/adventure.ts';
  import { DRAGONS, DRAGON_LINEAGE } from '#lib/game/constants.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const a = $derived(game.adventureState);
  let slot = $state(0);
  const ROLES = ['Attaquant', 'Gardien', 'Soutien'];

  /** Le portrait évolue avec le niveau du dragon. */
  function art(id: string): string {
    const d = DRAGONS.find((x) => x.id === id) ?? DRAGONS[0];
    if (d.id === 'obsidian') return asset(d.portrait);
    return dragonArt(DRAGON_LINEAGE[d.id], Math.min(5, Math.floor(Math.sqrt(Math.max(0, dragonLevel(a, id) - 1)) * 1.4)));
  }
</script>

<div class="team">
  {#each a.team as id, i (i)}
    {@const d = DRAGONS.find((x) => x.id === id) ?? DRAGONS[0]}
    <div class="slot" class:selected={slot === i}>
      <img src={art(id)} alt="" />
      <strong>{t(d.name)} · {t('Nv')} {dragonLevel(a, id)}</strong>
      <small>{t(ROLES[i])}</small>
      <small>{t(d.line + ' · puissance ' + Math.floor(dragonPower(a, id)))}</small>
      <button type="button" class="btn" aria-pressed={slot === i} onclick={() => (slot = i)}>{t('Remplacer')}</button>
    </div>
  {/each}
</div>
<div class="roster">
  <strong>{t('Dragons disponibles')}</strong>
  <p class="muted">{t('Choisis un dragon puis une place de l’équipe. Les rôles sont complémentaires, mais aucune composition n’est obligatoire.')}</p>
  <div class="grid">
    {#each DRAGONS as d (d.id)}
      {@const owned = a.owned.includes(d.id)}
      {@const selected = a.team[slot] === d.id}
      <button type="button" class:selected disabled={!owned} aria-pressed={selected} title={t(d.desc)} onclick={() => game.advAssign(slot, d.id)}>
        {d.icon} {t(d.name)} · {t(owned ? (selected ? 'sélectionné' : 'sélectionner') : d.purchaseRequired ? 'achat requis' : 'zone ' + (d.unlock + 1))}
      </button>
    {/each}
  </div>
</div>

<style>
  .team {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .slot {
    display: grid;
    gap: 3px;
    justify-items: center;
    text-align: center;
    padding: 10px 8px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
  }

  .slot.selected {
    border-color: var(--gold-deep);
  }

  .slot img {
    width: 100%;
    max-width: 120px;
    aspect-ratio: 8 / 9;
    object-fit: cover;
    border-radius: 10px;
  }

  .slot small {
    color: var(--muted);
    font-size: 0.78rem;
  }

  .slot .btn {
    min-height: 34px;
    padding: 4px 10px;
    font-size: 0.85rem;
  }

  .roster {
    margin-top: 12px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 6px;
  }

  .grid button {
    padding: 8px 10px;
    border: 1px solid var(--line-strong);
    border-radius: 9px;
    background: transparent;
    text-align: start;
    cursor: pointer;
  }

  .grid button.selected {
    background: var(--gold-deep);
    color: #fff1c9;
  }

  .grid button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
