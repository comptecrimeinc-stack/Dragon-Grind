<script lang="ts">
  import { asset } from '#lib/assets.ts';
  import { DRAGONS, FRAMES, type FrameId } from '#lib/game/constants.ts';
  import { frameDef } from '#lib/game/profile.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import Crown from './Crown.svelte';

  const profile = $derived(game.profile!);
  const counts = $derived(game.achievementCounts);
  const dragon = $derived(DRAGONS.find((d) => d.id === profile.dragon) ?? DRAGONS[0]);
  const frame = $derived(frameDef(profile.frame));
</script>

<section class="heraldry" aria-labelledby="heraldry-title">
  <div class="kicker">{t('LES INSIGNES DE LA FORGE')}</div>
  <h2 id="heraldry-title">{t('Portrait de guilde')}</h2>
  <p class="muted">{t('Choisis le dragon qui te représente. Tes succès forgent ta couronne : de la braise de l’éveil à la couronne draconique des légendes, jusqu’aux insignes du classement.')}</p>

  <div class="showcase">
    <div class="medallion">
      <img src={asset(dragon.portrait)} alt={t(dragon.name)} />
      <span class="crown"><Crown frame={frame.id} /></span>
    </div>
    <div>
      <strong>{t(dragon.name)} · {t(dragon.line)}</strong>
      <span class="frame-name">{t(frame.name)}</span>
      <p>{t(frame.desc)}</p>
      <p class="muted">{t('Succès accomplis : ' + counts.total + ' (' + counts.main + ' forge · ' + counts.adventure + ' aventure)')}</p>
    </div>
  </div>

  <span class="label">{t('DRAGONS POSSÉDÉS')}</span>
  <div class="dragons">
    {#each DRAGONS as d (d.id)}
      {@const ok = game.dragonUnlocked(d.id)}
      <button type="button" class:active={d.id === profile.dragon} disabled={!ok} aria-pressed={d.id === profile.dragon} aria-label={t(d.name) + (ok ? '' : ' ' + t('verrouillé'))} onclick={() => game.setHeraldry(d.id, profile.frame)}>
        <img src={asset(d.portrait)} alt="" />
        <span>{t(d.name)}</span>
      </button>
    {/each}
  </div>

  <span class="label">{t('CADRES HÉRALDIQUES')}</span>
  <div class="frames">
    {#each FRAMES as f (f.id)}
      {@const ok = counts.total >= f.need}
      <button type="button" class:active={f.id === profile.frame} disabled={!ok} aria-pressed={f.id === profile.frame} onclick={() => game.setHeraldry(profile.dragon, f.id as FrameId)}>
        <span class="swatch"><Crown frame={f.id} /></span>
        <span><strong>{t(f.name)}</strong><small>{t(f.req + (ok ? ' · disponible' : ' · verrouillé'))}</small></span>
      </button>
    {/each}
  </div>
  <p class="muted foot">{t('Les dragons verrouillés restent visibles en aperçu, mais ne peuvent être équipés avant leur déblocage en aventure. Les cadres sont déterminés par les succès enregistrés.')}</p>
</section>

<style>
  .heraldry {
    margin-top: 28px;
  }

  .kicker,
  .label {
    display: block;
    font: 700 0.72rem var(--font-title);
    letter-spacing: 0.2em;
    color: var(--ember);
  }

  .label {
    margin: 18px 0 8px;
    color: var(--gold);
  }

  h2 {
    margin-top: 4px;
  }

  .showcase {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .showcase > div:last-child {
    display: grid;
    gap: 4px;
  }

  .frame-name {
    color: var(--gold);
  }

  .medallion {
    position: relative;
    width: 150px;
    height: 150px;
  }

  .medallion img {
    position: absolute;
    inset: 18px;
    width: calc(100% - 36px);
    height: calc(100% - 36px);
    object-fit: cover;
    border-radius: 50%;
  }

  .crown {
    position: absolute;
    inset: 0;
  }

  .dragons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 8px;
  }

  .dragons button {
    display: grid;
    gap: 4px;
    justify-items: center;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #17121a;
    cursor: pointer;
  }

  .dragons img {
    width: 100%;
    height: 72px;
    object-fit: contain;
  }

  .dragons button.active,
  .frames button.active {
    border: 2px solid #e5bc67;
    background: #302315;
  }

  .dragons button:disabled {
    opacity: 0.35;
    filter: grayscale(1);
    cursor: not-allowed;
  }

  .frames {
    display: grid;
    gap: 8px;
  }

  .frames button {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #17121a;
    text-align: start;
    cursor: pointer;
  }

  .frames button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .frames small {
    display: block;
    color: var(--muted);
  }

  .swatch {
    width: 44px;
    height: 44px;
    flex: none;
  }

  .foot {
    margin-top: 12px;
  }
</style>
