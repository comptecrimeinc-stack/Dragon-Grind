<script lang="ts">
  import { COSMETIC_LABELS, DRAGONS } from '#lib/game/constants.ts';
  import { formatNumber as f } from '#lib/game/format.ts';
  import { frameDef, isFrameId } from '#lib/game/profile.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import Avatar from './Avatar.svelte';
  import type { ProfileEntry } from './profileEntry.ts';

  let { entry, titleId }: { entry: ProfileEntry; titleId?: string } = $props();

  const isMe = $derived(entry.kind === 'me');
  const meta = $derived(DRAGONS.find((d) => d.id === entry.dragon));
  const frame = $derived(isFrameId(entry.frame) ? entry.frame : null);
  // Les cosmétiques ne s'affichent que sur la carte du joueur de cet appareil.
  const shown = $derived(isMe ? game.cosmetics.equipped.filter((id) => COSMETIC_LABELS[id]) : []);
  const ember = $derived(shown.includes('ember-frame'));

  const stats = $derived(
    [
      ['Mana récolté', f(entry.life)],
      ['Titans vaincus', entry.kills + ' ⚔'],
      ['Lignée', meta ? t(meta.name) + ' · ' + t('Lignée ' + meta.line) : t('Lignée ' + (entry.dragon || '?'))],
      ...(entry.rk > 0 ? [['Renaissances', entry.rk + ' ✦']] : []),
      ...(entry.asc > 0 ? [['Ascensions', entry.asc + ' ✧']] : [])
    ] as [string, string][]
  );
</script>

<div class="card-profile" class:own={isMe} class:ember>
  <div class="head"><span>✦</span><h3 id={titleId}>{t('PROFIL DU FORGERON')}</h3><span>✦</span></div>
  <div class="top">
    <Avatar dragon={entry.dragon} {frame} size={96} glow={shown.includes('obsidian-skin')}>
      {#if shown.includes('founder-badge')}<span class="badge">🏅 {t('Soutien')}</span>{/if}
    </Avatar>
    <div class="id">
      <strong class="name">{entry.name}</strong>
      <span class="title">{t(entry.title)}</span>
      {#if shown.includes('moon-title')}<span class="lunar">☾ {t('VEILLEUR LUNAIRE')} ✦</span>{/if}
    </div>
  </div>
  <div class="rank">🛡 {t(entry.kind === 'world' ? 'Rang mondial' : 'Rang de la forge')} · #{entry.rank ?? '—'}{isMe ? ' · ' + t('toi') : ''}</div>
  <div class="stats">
    {#each stats as [label, value] (label)}
      <div><small>{t(label)}</small><strong>{value}</strong></div>
    {/each}
  </div>
  {#if frame}
    <p class="line">{t('Cadre héraldique')} : <i style:color={frameDef(frame).color}>{frameDef(frame).glyph}</i> {t(frameDef(frame).short)}</p>
  {/if}
  {#if isMe}
    {#if shown.length}<p class="line">✨ {shown.map((id) => t(COSMETIC_LABELS[id])).join(' · ')}</p>{/if}
    <p class="line">{t(shown.length + ' cosmétique(s) équipé(s) · ' + game.cosmetics.owned.length + ' débloqué(s)')}</p>
  {/if}
  <div class="foot">✦ ✦ ✦</div>
</div>

<style>
  .card-profile {
    position: relative;
    display: grid;
    gap: 12px;
    width: 100%;
    max-width: 440px;
    margin-inline: auto;
    padding: 18px;
    border: 1px solid #9d7743;
    border-radius: 18px;
    background: radial-gradient(ellipse at top, #30231d, #120e14 70%);
    box-shadow: 0 0 0 4px #171016;
  }

  /* Cadre Braise (cosmétique) : liseré incandescent animé. */
  .card-profile.ember {
    border-color: #f39a43;
    box-shadow:
      0 0 0 4px #171016,
      0 0 24px #ff7a2a88;
    animation: ember 2.6s ease-in-out infinite alternate;
  }

  @keyframes ember {
    to {
      box-shadow:
        0 0 0 4px #171016,
        0 0 40px #ffad4bcc;
    }
  }

  .head {
    display: flex;
    justify-content: center;
    gap: 10px;
    align-items: center;
    color: var(--gold);
  }

  .head h3 {
    margin: 0;
    font-size: 0.95rem;
    letter-spacing: 0.14em;
  }

  .top {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .badge {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 8px;
    border: 1px solid #e8c77f;
    border-radius: 99px;
    background: #2a1f14;
    font-size: 0.7rem;
    white-space: nowrap;
  }

  .id {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .name {
    font: 800 1.3rem var(--font-title);
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .title,
  .line {
    color: var(--muted);
    font-size: 0.88rem;
    margin: 0;
  }

  .lunar {
    font: 700 0.75rem var(--font-title);
    letter-spacing: 0.12em;
    color: #cfe0ff;
    text-shadow: 0 0 8px #8fb0ff;
  }

  .rank {
    padding: 8px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    text-align: center;
    color: var(--gold);
    font-weight: 700;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .stats div {
    display: grid;
    padding: 8px 10px;
    border: 1px solid #ffffff10;
    border-radius: 9px;
    background: #0006;
  }

  .stats small {
    color: var(--muted);
    font-size: 0.75rem;
  }

  .foot {
    text-align: center;
    color: var(--gold-deep);
  }
</style>
