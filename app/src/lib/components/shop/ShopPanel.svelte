<script lang="ts">
  import { asset, SHOP_MARK } from '#lib/assets.ts';
  import { FREE_COSMETICS, PAID_COSMETICS, type Cosmetic } from '#lib/game/constants.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  let status = $state('Les objets possédés sont enregistrés dans ce navigateur. Pense à exporter ta sauvegarde régulièrement.');

  function act(item: Cosmetic, paid: boolean) {
    const result = game.toggleCosmetic(item.id);
    status =
      result === 'unlocked'
        ? paid
          ? item.name + ' ajouté à ta collection (hors-ligne, sans paiement réel).'
          : item.name + ' débloqué et équipé ! Aucun bonus de puissance.'
        : result === 'equipped'
          ? item.name + ' équipé en complément des autres cosmétiques.'
          : item.name + ' retiré. Les autres cosmétiques restent équipés.';
  }
</script>

{#snippet item(c: Cosmetic, paid: boolean)}
  {@const owned = game.cosmetics.owned.includes(c.id)}
  {@const equipped = game.isEquipped(c.id)}
  <article class="item">
    <div class="art" aria-hidden="true">
      {#if c.id === 'obsidian-skin'}
        <img class="obsidian" src={asset('img_09.webp')} alt="" />
      {:else if c.id === 'forest-aura'}
        <img class="aura" src={asset('img_11.webp')} alt="" />
      {:else}
        <span>{c.icon}</span>
        {#if c.id === 'moon-title'}<b class="lunar">{t('VEILLEUR LUNAIRE')}</b>{/if}
      {/if}
    </div>
    <h3>{t(c.name)}</h3>
    <p>{t(c.desc)}</p>
    <div class="price">{paid ? c.price + ' · ' + t('hors-ligne') : t('Gratuit')}{c.kind ? ' · ' + t(c.kind) : ''}</div>
    <button type="button" class="btn" class:primary={equipped} onclick={() => act(c, paid)}>
      {t(equipped ? '✓ Équipé · Retirer' : owned ? 'Équiper' : paid ? 'Débloquer (hors-ligne)' : 'Débloquer gratuitement')}
    </button>
  </article>
{/snippet}

<p class="intro">{t('Une boutique pour soutenir Dragon Grind et personnaliser ton aventure. Aucun achat ne donne de puissance ni de ressources : les articles débloquent uniquement des cosmétiques ou des dragons de collection.')}</p>
<div class="card hero">
  <div>
    <div class="kicker">{t('DRAGON GRIND · COSMÉTIQUES')}</div>
    <h2>{t('La galerie draconique')}</h2>
    <p>{t('Le jeu reste complet gratuitement. Achète uniquement si un objet te plaît et si tu souhaites soutenir son développement.')}</p>
  </div>
  <img src={SHOP_MARK} alt="" />
</div>
<div class="notice">
  <span aria-hidden="true">🛡️</span>
  <div>
    <strong>{t('Zéro pay-to-win, promis.')}</strong>
    <p>{t('Pas de bonus de dégâts, pas d’accélérateur, pas de monnaie payante nécessaire et pas de coffres aléatoires. Les achats réels ne sont pas activés dans cette version.')}</p>
  </div>
</div>
<h2>{t('À débloquer gratuitement')} <small>{t('GRATUIT')}</small></h2>
<div class="grid">
  {#each FREE_COSMETICS as c (c.id)}{@render item(c, false)}{/each}
</div>
<h2>{t('Pour soutenir le jeu')} <small>{t('FACULTATIF')}</small></h2>
<div class="grid">
  {#each PAID_COSMETICS as c (c.id)}{@render item(c, true)}{/each}
</div>
<p class="muted status" aria-live="polite">{t(status)}</p>

<style>
  .hero {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    margin-top: 14px;
  }

  .hero h2 {
    margin: 4px 0 8px;
  }

  .hero img {
    width: 96px;
    flex: none;
  }

  .kicker {
    font: 700 0.72rem var(--font-title);
    letter-spacing: 0.2em;
    color: var(--ember);
  }

  .notice {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    padding: 12px 14px;
    border: 1px solid #3a6a4a;
    border-radius: 12px;
    background: #12241866;
  }

  .notice p {
    margin: 0;
    color: var(--muted);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 12px;
  }

  .item {
    display: grid;
    gap: 8px;
    align-content: start;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface);
  }

  .item h3 {
    margin: 0;
  }

  .item p {
    color: var(--muted);
    font-size: 0.88rem;
    margin: 0;
  }

  .art {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 116px;
    border-radius: 12px;
    background: radial-gradient(circle at 50% 40%, #3a2a1c, #0c0a0e 75%);
    font-size: 2.8rem;
    overflow: hidden;
  }

  .art img {
    max-height: 116px;
  }

  .art .obsidian {
    filter: drop-shadow(0 0 14px #9b5cff);
  }

  .art .aura {
    width: 100%;
    object-fit: cover;
    filter: drop-shadow(0 0 10px #58d68d99);
  }

  .lunar {
    position: absolute;
    bottom: 10px;
    font: 700 0.7rem var(--font-title);
    letter-spacing: 0.15em;
    color: #cfe0ff;
    text-shadow: 0 0 8px #8fb0ff;
  }

  .price {
    font-size: 0.8rem;
    color: var(--gold);
  }

  .status {
    margin-top: 14px;
  }
</style>
