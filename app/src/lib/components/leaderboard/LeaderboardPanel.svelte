<script lang="ts">
  import { onMount } from 'svelte';
  import { DRAGONS, RIVALS } from '#lib/game/constants.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { isMe, localRank } from '#lib/game/leaderboard.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import Board from './Board.svelte';
  import PlayerName from './PlayerName.svelte';
  import WorldBoard from './WorldBoard.svelte';

  const me = $derived(game.score);
  const meta = $derived(DRAGONS.find((d) => d.id === me.dragon));
  const others = $derived(game.heroes.filter((h) => !isMe(h.name, me.name)));

  // Ouvrir le classement inscrit le joueur avec ses derniers scores.
  onMount(() => game.syncHero());
</script>

<p class="intro">{t('Compare ta légende aux rivaux de la forge, aux héros de cet appareil, et au classement mondial des forgerons.')}</p>
<h2>{t('Classements')} <small>{t('compétition de la forge')}</small></h2>
<div class="card banner">
  <PlayerName kind="me" name={me.name} dragon={me.dragon} />
  <small>{t('Rang #' + localRank(me.life, game.heroes, me.name) + ' · ' + (meta ? meta.name + ' · lignée ' + meta.line : me.dragon))}</small>
</div>
<div class="card boards">
  <Board metric="life" title="🏆 Mana total récolté" format={f} />
  <Board metric="kills" title="⚔️ Titans vaincus" format={(v) => v + ' ⚔'} />
  <Board metric="rk" title="🔥 Renaissances" format={(v) => v + ' ✦'} />
</div>

<h3 class="section">🌍 {t('Classement mondial')}</h3>
<p class="muted">{t('Les forgerons du monde entier. Ton score est envoyé automatiquement quand tu progresses (nécessite un hébergement en ligne).')}</p>
<WorldBoard />

<h3 class="section">{t('Hall des héros (cet appareil)')}</h3>
<p class="muted">{t('Profils inscrits sur ce navigateur.')}</p>
<div class="heroes">
  {#each others as h, i (h.id)}
    <div class="hero">
      <span class="rank">#{i + 1}</span>
      <span aria-hidden="true">{DRAGONS.find((d) => d.id === h.dragon)?.icon ?? '🐲'}</span>
      <div>
        <PlayerName kind="hero" name={h.name} dragon={h.dragon} />
        <small>{t('Lignée ' + h.dragon + ' · ' + f(h.life) + ' mana · ' + h.kills + ' titans')}</small>
      </div>
    </div>
  {:else}
    <p class="muted">{t('Aucun autre héros inscrit sur cet appareil.')}</p>
  {/each}
</div>

<h3 class="section">{t('Les rivaux de la forge')}</h3>
<div class="rivals">
  {#each RIVALS as r (r.name)}
    <button type="button" class="rival" onclick={() => (game.profileCard = { kind: 'npc', name: r.name, dragon: r.dragon })}>
      <span class="av" aria-hidden="true">{r.avatar}</span>
      <strong>{t(r.name)}</strong>
      <small>{t(r.title)}</small>
    </button>
  {/each}
</div>

<style>
  .banner {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .banner small,
  .hero small,
  .rival small {
    color: var(--muted);
  }

  .boards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
  }

  .section {
    margin-top: 26px;
  }

  .heroes {
    display: grid;
    gap: 6px;
  }

  .hero {
    display: grid;
    grid-template-columns: 34px 28px 1fr;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }

  .hero > div {
    display: grid;
    min-width: 0;
  }

  .rank {
    color: var(--gold);
  }

  .rivals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }

  .rival {
    display: grid;
    gap: 2px;
    justify-items: center;
    text-align: center;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    cursor: pointer;
  }

  .av {
    font-size: 1.8rem;
  }
</style>
