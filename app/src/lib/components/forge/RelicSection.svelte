<script lang="ts">
  import { RELICS, RELIC_SETS, RELIC_SLOTS } from '#lib/game/constants.ts';
  import { hasRelic, setCount } from '#lib/game/economy.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);
</script>

<section class="card" aria-label={t('Reliques draconiques')}>
  <p class="muted">{t('Les titans lâchent des fragments. Achète des reliques, puis équipe une pièce dans chaque emplacement. Les reliques possédées survivent aux ascensions.')}</p>
  <div class="head"><strong>{t('Fragments de relique')}</strong><span class="currency">{f(S.relicShards || 0)}</span></div>
  <div class="slots">
    {#each RELIC_SLOTS as s (s.slot)}
      {@const r = RELICS.find((x) => x.id === S.relicEquip[s.slot])}
      <span><b>{t(s.label)} :</b> {r ? r.icon + ' ' + t(r.name) : t('Aucune')}</span>
    {/each}
  </div>

  <h3>{t('Ensembles légendaires')}</h3>
  <p class="muted">{t('Équipe deux pièces d’une même famille pour activer un bonus, trois pour éveiller son pouvoir complet.')}</p>
  <div class="sets">
    {#each RELIC_SETS as set (set.id)}
      {@const n = setCount(S, set.id)}
      <div class="set" class:active={n >= 2}>
        <strong>{set.icon} {t(set.name)} · {n} / 3</strong>
        <small class:on={n >= 2}>{t(set.two)}</small>
        <small class:on={n >= 3}>{t(set.three)}</small>
      </div>
    {/each}
  </div>

  <div class="grid">
    {#each RELICS as r (r.id)}
      {@const owned = hasRelic(S, r.id)}
      {@const equipped = S.relicEquip[r.slot] === r.id}
      {@const slotBusy = !!S.relicEquip[r.slot] && !equipped}
      <article class="relic" class:equipped>
        <div class="relic-head">
          <span class="icon" aria-hidden="true">{r.icon}</span>
          <div>
            <strong>{t(r.name)}</strong><br />
            <small>{t(r.slotName)} · {t(owned ? (equipped ? 'Équipée' : 'Possédée') : f(r.cost) + ' fragments')}</small>
          </div>
        </div>
        <p>{t(r.desc)}</p>
        <button type="button" class="btn" disabled={equipped || (!owned && ((S.relicShards || 0) < r.cost || slotBusy))} onclick={() => game.relic(r.id)}>
          {t(equipped ? 'Équipée' : owned ? (slotBusy ? 'Remplacer l’équipée' : 'Équiper') : 'Forger · ' + r.cost + ' fragments')}
        </button>
      </article>
    {/each}
  </div>
</section>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10px 0;
  }

  .currency {
    font: 800 1.3rem var(--font-title);
    color: #b48cf2;
  }

  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    padding: 10px 12px;
    border: 1px dashed var(--line-strong);
    border-radius: 10px;
    font-size: 0.9rem;
  }

  h3 {
    margin-top: 16px;
  }

  .sets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 8px;
  }

  .set {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }

  .set.active {
    border-color: #b48cf2;
    background: #231d3a66;
  }

  .set small {
    color: var(--muted);
    opacity: 0.6;
  }

  .set small.on {
    color: var(--ink);
    opacity: 1;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .relic {
    display: grid;
    gap: 8px;
    align-content: space-between;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #0006;
  }

  .relic.equipped {
    border-color: var(--gold-deep);
    box-shadow: 0 0 14px #e8c77f33;
  }

  .relic-head {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .icon {
    font-size: 1.8rem;
  }

  .relic small,
  .relic p {
    color: var(--muted);
    font-size: 0.85rem;
    margin: 0;
  }
</style>
