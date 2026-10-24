<script lang="ts">
  import { TALENTS } from '#lib/game/constants.ts';
  import { talentCost, talentLevel } from '#lib/game/economy.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
</script>

<ul>
  {#each TALENTS as tal (tal.id)}
    {@const level = talentLevel(S, tal.id)}
    {@const cost = talentCost(tal.base, level)}
    {@const maxed = level >= tal.max}
    <li>
      <div class="name">{t(tal.name)} <i>{level} / {tal.max}</i></div>
      <div class="desc">{t(tal.desc)}</div>
      <button type="button" class="btn" disabled={maxed || S.embers < cost} onclick={() => game.buyTalent(tal.id)}>
        {t(maxed ? 'Max' : cost + ' braises')}
      </button>
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  li {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas: 'name btn' 'desc btn';
    gap: 2px 12px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
  }

  .name {
    grid-area: name;
    font-weight: 700;
  }

  .name i {
    color: var(--ember);
    font-style: normal;
    margin-inline-start: 6px;
  }

  .desc {
    grid-area: desc;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .btn {
    grid-area: btn;
    min-width: 92px;
  }
</style>
