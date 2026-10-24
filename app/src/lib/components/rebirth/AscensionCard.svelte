<script lang="ts">
  import { ASC_CAP, ASC_PATHS, STAR_BRAISE_THRESHOLD } from '#lib/game/constants.ts';
  import { fragmentsForStars, starGain, starValue } from '#lib/game/economy.ts';
  import { formatNumber as f, percent, plural } from '#lib/game/format.ts';
  import { ascPathCost } from '#lib/game/forge.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import ConfirmButton from '../ui/ConfirmButton.svelte';
  import OathCard from './OathCard.svelte';

  const S = $derived(game.S);
  const gain = $derived(starGain(S));
  const perStar = $derived(starValue(S));

  const text = $derived(
    S.ranks < 4
      ? 'Fais au moins 4 renaissances dans ce cycle (' + S.ranks + ' / 4). L’ascension remet à zéro les améliorations du cycle, les braises, les arcanes et les renaissances, mais conserve tes étoiles, tes fragments et tes talents de transcendance.'
      : gain >= 1
        ? 'Prochaine ascension : +' + plural(gain, 'étoile') + ' et +' + plural(fragmentsForStars(gain), 'fragment de transcendance') + '. Les étoiles donnent un bonus permanent à la production ; les fragments achètent les talents de l’arbre. Les améliorations du cycle seront réinitialisées.'
        : 'Il faut davantage de braises pour obtenir une étoile (' + S.eAll + ' / ' + STAR_BRAISE_THRESHOLD + '). Après 4 renaissances et au moins ' + STAR_BRAISE_THRESHOLD + ' braises cumulées, l’ascension convertit les braises en étoiles permanentes.'
  );
</script>

<div class="card asc">
  <p>{t(S.asc >= ASC_CAP ? '✦ Ascension finale accomplie' : text)}</p>
  <ConfirmButton variant="primary" disabled={gain < 1} label={gain < 1 ? 'Ascension' : 'Ascension : +' + plural(gain, 'étoile')} onconfirm={() => game.ascend()} />

  <OathCard />

  <div class="card stars">
    <h3>✦ {t('À quoi servent les étoiles ?')}</h3>
    <p>{t('Les étoiles sont un bonus permanent de production : elles augmentent le mana gagné par seconde et la puissance de chaque souffle. Elles restent après une ascension.')}</p>
    <div class="star-stats">
      <div><span>{t('Étoiles possédées')}</span><strong>{f(S.stars)}</strong></div>
      <div><span>{t('Bonus par étoile')}</span><strong>+{percent(perStar)} %</strong></div>
      <div><span>{t('Bonus total des étoiles')}</span><strong>+{percent(S.stars * perStar)} %</strong></div>
    </div>
    <p class="muted">
      {t(
        S.stars
          ? 'Calcul actuel : ' + S.stars + ' étoile(s) × ' + percent(perStar) + ' % = +' + percent(S.stars * perStar) + ' % de production. Les autres bonus se multiplient séparément.'
          : 'Tu n’as pas encore d’étoile. La première ascension est disponible après 4 renaissances et au moins ' + STAR_BRAISE_THRESHOLD + ' braises cumulées.'
      )}
    </p>
    <details>
      <summary>{t('Comment augmenter le bonus ?')}</summary>
      <ul>
        <li>{t('Chaque étoile apporte +25 % de production de base.')}</li>
        <li>{t('Chaque ascension déjà effectuée ajoute +5 points de pourcentage au bonus de chaque étoile.')}</li>
        <li>{t('Chaque niveau de la Voie de l’Éternel ajoute +2 points de pourcentage au bonus de chaque étoile.')}</li>
      </ul>
    </details>
  </div>

  <div class="tree-head"><strong>{t('Arbre de transcendance')}</strong><span>{t(f(S.ascPts) + ' fragment' + (S.ascPts === 1 ? '' : 's'))}</span></div>
  <div class="tree">
    {#each ASC_PATHS as path (path.id)}
      {@const level = S.ascTal[path.id] || 0}
      {@const cost = ascPathCost(level)}
      <div class="node">
        <strong>{t(path.title)}</strong>
        <span class="level">{t('Niveau ' + level + ' / ' + path.max)}</span>
        <p>{t(path.desc)}</p>
        <button type="button" class="btn" disabled={level >= path.max || S.ascPts < cost} onclick={() => game.buyAscPath(path.id)}>
          {t(level >= path.max ? 'Voie maîtrisée' : 'Améliorer · ' + cost + ' fragment' + (cost === 1 ? '' : 's'))}
        </button>
      </div>
    {/each}
  </div>
  <p class="muted">{t('Ascensions : ' + S.asc + ' · Les fragments et les voies restent acquis après chaque ascension.')}</p>
</div>

<style>
  .asc {
    display: grid;
    gap: 12px;
  }

  .stars {
    background: #0006;
  }

  .star-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 10px 0;
  }

  .star-stats div {
    display: grid;
    padding: 8px;
    border: 1px solid #ffffff10;
    border-radius: 9px;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .star-stats strong {
    font: 800 1.2rem var(--font-title);
    color: var(--gold);
  }

  .tree-head {
    display: flex;
    justify-content: space-between;
    color: var(--gold);
  }

  .tree {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
  }

  .node {
    display: grid;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }

  .level {
    color: var(--ember);
    font-size: 0.85rem;
  }

  .node p {
    color: var(--muted);
    font-size: 0.85rem;
    margin: 0;
  }
</style>
