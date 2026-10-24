<script lang="ts">
  import { ITEMS } from '#lib/game/constants.ts';
  import { breathPower, itemCap, itemCost, itemCount, maxAffordable, multiplier } from '#lib/game/economy.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import type { BuyQuantity } from '#lib/game/forge.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
  let mode = $state<BuyQuantity>(1);
  const MODES: BuyQuantity[] = [1, 10, 50, 'max'];

  /** Ligne d'achat : quantité, coût et temps de rentabilisation. */
  const rows = $derived(
    ITEMS.map((it) => {
      const owned = itemCount(S, it);
      const free = itemCap(it) - owned;
      const maxed = free <= 0;
      const q = mode === 'max' ? Math.max(1, maxAffordable(S, it, free)) : mode;
      const cost = itemCost(S, it, q);
      const isClaw = it.id === 'claw';
      const desc = isClaw ? '+' + f(breathPower(S)) + ' mana par souffle' : '+' + f((it.sps || 0) * multiplier(S)) + ' mana/s chacun';
      const added = isClaw ? q * breathPower(S) * (1 + 0.12 * (S.ascTal.devourer || 0)) : q * (it.sps || 0) * multiplier(S) * (1 + 0.08 * (S.ascTal.archmage || 0));
      const payback = added > 0 ? cost / added : Infinity;
      const roi = Number.isFinite(payback) ? (isClaw ? ' · rentabilisé en ~' + f(payback) + ' souffles' : ' · rentabilisé en ~' + f(payback) + ' s') : '';
      return { it, owned, maxed, q, cost, text: desc + roi };
    })
  );
</script>

<div class="seg" role="group" aria-label={t('Quantité achetée')}>
  {#each MODES as m (m)}
    <button type="button" class:on={mode === m} aria-pressed={mode === m} onclick={() => (mode = m)}>×{m}</button>
  {/each}
</div>
<ul>
  {#each rows as r (r.it.id)}
    <li>
      <div class="name">{t(r.it.name)} <i>× {r.owned}</i></div>
      <div class="desc">{t(r.text)}</div>
      <button type="button" class="btn" disabled={r.maxed || S.gold < r.cost} onclick={() => game.buyItem(r.it.id, mode)}>
        {r.maxed ? 'MAX' : '×' + r.q + '\n' + f(r.cost)}
      </button>
    </li>
  {/each}
</ul>

<style>
  .seg {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    margin-bottom: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
  }

  .seg button {
    min-width: 54px;
    min-height: 38px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    font-weight: 700;
    cursor: pointer;
  }

  .seg button.on {
    background: linear-gradient(180deg, #ffb06a, #e8672e);
    color: #2a1206;
  }

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
    color: var(--gold);
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
    line-height: 1.25;
  }
</style>
