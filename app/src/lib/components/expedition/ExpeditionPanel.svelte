<script lang="ts">
  import {
    ADVENTURE_ACHIEVEMENTS,
    BOSS_REWARDS,
    adventureDailyView,
    chapterOf,
    enemyIcon,
    enemyName,
    goldRate,
    teamPower,
    upgradeCost,
    zoneName
  } from '#lib/game/adventure.ts';
  import { ROMAN, ZONE_KILLS_FOR_BOSS } from '#lib/game/constants.ts';
  import { formatAdventure as fmt } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import AdventureMap from './AdventureMap.svelte';
  import TeamRoster from './TeamRoster.svelte';

  const a = $derived(game.adventureState);
  const power = $derived(teamPower(a));
  const rate = $derived(goldRate(a));
  const chapter = $derived(Math.floor(a.zone / 3));
  const cost = $derived(upgradeCost(a));
  const progress = $derived(a.zoneKills % ZONE_KILLS_FOR_BOSS);
  const dailies = $derived(adventureDailyView(a, game.now));
  const claimedCount = $derived(dailies.filter((q) => q.claimed).length);
</script>

<h2>{t('L’Expédition')} <small>{t('le voyage du dresseur')}</small></h2>
<p class="intro">{t('Au-delà de la forge, le monde attend : six chapitres, dix-huit zones, une équipe de trois dragons qui chasse pour toi. Chaque région garde un fragment de l’histoire des anciens — et la dernière scellera la légende de ton bestiaire.')}</p>

<div class="card hero">
  <div>
    <span class="eyebrow">{t('VOYAGE DU DRESSEUR')}</span>
    <h3>{t('Chapitre ' + ROMAN[chapter] + ' · ' + chapterOf(a.zone).name)}</h3>
    <p class="muted">{t(chapterOf(a.zone).desc)}</p>
  </div>
  <div class="power">
    <small>{t('Puissance d’équipe')}</small>
    <strong>{fmt(power)}</strong>
    <small>{t('Butin estimé : ' + fmt(rate) + ' or/s')}</small>
  </div>
</div>

<div class="wallet">
  <div><span>🪙 {t('Or')}</span><strong>{fmt(a.gold)}</strong></div>
  <div><span>💎 {t('Cristaux')}</span><strong>{fmt(a.crystals)}</strong></div>
  <div><span>🧩 {t('Fragments')}</span><strong>{fmt(a.fragments)}</strong></div>
  <div><span>🌿 {t('Matériaux')}</span><strong>{fmt(a.materials)}</strong></div>
</div>

<h2>{t('Équipe draconique')} <small>{t('3 places · combat automatique')}</small></h2>
<TeamRoster />

<div class="card battle">
  <div class="battle-head">
    <div>
      <span class="eyebrow">{t('ZONE ACTUELLE')}</span>
      <h3>{t(zoneName(a.zone))}</h3>
      <p class="muted">{t(enemyName(a.zone) + ' · difficulté ' + (a.zone + 1))}</p>
    </div>
    <span class="enemy" aria-hidden="true">{enemyIcon(a.zone)}</span>
  </div>
  <div class="line">
    <span>{t(progress + ' / ' + ZONE_KILLS_FOR_BOSS + ' victoires avant le boss')}</span>
    <strong>{t(a.paused ? 'En pause' : a.pendingBoss ? 'Choisis ta récompense' : 'Combat automatique')}</strong>
  </div>
  <div class="track"><i style:width="{(progress / ZONE_KILLS_FOR_BOSS) * 100}%"></i></div>
  <div class="line">
    <span>{t('Dégâts automatiques : ' + fmt(power * 0.35) + '/s')}</span>
    <span>{t('Butin : ' + fmt(rate) + ' or/s · matériaux communs')}</span>
  </div>
  <div class="actions">
    <button type="button" class="btn" onclick={() => game.advPause()}>{t(a.paused ? 'Reprendre les combats' : 'Mettre en pause')}</button>
    <button type="button" class="btn primary" disabled={a.gold < cost.gold || a.materials < cost.materials || a.pendingBoss} onclick={() => game.advUpgrade()}>{t('Améliorer l’équipe')}</button>
  </div>
  <small class="muted">{t('Coût : ' + fmt(cost.gold) + ' or + ' + cost.materials + ' matériaux · + environ 22 % de puissance')}</small>
</div>

<h2>{t('Carte de l’aventure')} <small>{t('18 zones principales')}</small></h2>
<AdventureMap />

<h2>{t('Récompense de boss')} <small>{t('choix sans piège')}</small></h2>
<div class="card">
  <p class="muted">{t('Les boss offrent une récompense majeure à la première victoire. Tu pourras obtenir les autres choix plus tard par le farming et les défis.')}</p>
  <div class="choices">
    {#if !a.pendingBoss}
      <span class="muted">{t('Aucun choix en attente.')}</span>
    {:else if a.claimedBoss[a.zone]}
      <span class="muted">{t('Récompense de première victoire déjà obtenue. Le farming reste disponible.')}</span>
    {:else}
      {#each BOSS_REWARDS as r, i (r.name)}
        <button type="button" class="btn" onclick={() => game.advBossReward(i)}>{t(r.name)}<small>{t(r.desc)}</small></button>
      {/each}
    {/if}
  </div>
</div>

<h2>{t('Contrats quotidiens')} <small>{t('renouvellement quotidien · bonus après 4/5')}</small></h2>
<div class="card">
  {#each dailies as q (q.id)}
    <div class="quest">
      <div>
        <strong>{t(q.name)}</strong>
        <small>{t(q.desc)} · {q.progress}/{q.goal}</small>
        <small>{t('Récompense : ' + fmt(q.reward) + ' or')}</small>
      </div>
      <button type="button" class="btn" disabled={q.claimed || q.progress < q.goal} onclick={() => game.advContract(q.id)}>{t(q.claimed ? 'Réclamé' : 'Récupérer')}</button>
    </div>
  {/each}
  <p class="muted">{t(claimedCount >= 4 ? 'Bonus quotidien déjà obtenu.' : 'Bonus 4/5 : termine ' + (4 - claimedCount) + ' contrat(s) supplémentaire(s)')}</p>
</div>

<h2>{t('Succès et prestige')}</h2>
<div class="card">
  <p class="muted">{t('Les succès récompensent l’exploration et la collection. Les titres et apparences sont des récompenses de prestige, pas une monnaie à dépenser.')}</p>
  <div class="ach">
    {#each ADVENTURE_ACHIEVEMENTS as x (x.id)}
      {@const done = !!a.achievements[x.id]}
      <div class:done>
        <strong>{done ? '✦ ' : '◇ '}{t(x.name)}</strong>
        <small>{t(x.desc)}</small>
        <small>{t(done ? x.reward : 'Récompense de prestige')}</small>
      </div>
    {/each}
  </div>
</div>

<style>
  .eyebrow {
    font: 700 0.72rem var(--font-title);
    letter-spacing: 0.15em;
    color: var(--ember);
  }

  .hero,
  .battle-head {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }

  .hero {
    margin-top: 14px;
  }

  .power {
    display: grid;
    text-align: end;
  }

  .power strong {
    font: 800 1.6rem var(--font-title);
    color: var(--gold);
  }

  small {
    color: var(--muted);
  }

  .wallet {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-top: 10px;
  }

  .wallet div {
    display: grid;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    font-size: 0.85rem;
  }

  .wallet strong {
    font: 800 1.1rem var(--font-title);
    color: var(--gold);
  }

  @media (max-width: 520px) {
    .wallet {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .battle {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .enemy {
    font-size: 2.4rem;
  }

  .line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 0.88rem;
  }

  .actions,
  .choices {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .choices .btn {
    flex-direction: column;
  }

  .quest {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #ffffff10;
  }

  .quest > div {
    flex: 1;
    display: grid;
  }

  .ach {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
  }

  .ach div {
    display: grid;
    padding: 10px;
    border: 1px solid #ffffff10;
    border-radius: 10px;
    opacity: 0.55;
  }

  .ach div.done {
    opacity: 1;
    border-color: var(--gold-deep);
  }
</style>
