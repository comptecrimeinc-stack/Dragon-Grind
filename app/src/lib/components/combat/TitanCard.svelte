<script lang="ts">
  import {
    bossPhaseInfo,
    huntComplete,
    lineageMatchup,
    liveCombo,
    titanAttack,
    titanGivesEmber,
    titanMax,
    titanName,
    titanReward,
    titanTrait
  } from '#lib/game/combat.ts';
  import { ROMAN, TITAN_CAP } from '#lib/game/constants.ts';
  import { decimal2, formatNumber as f } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import SkillBar from './SkillBar.svelte';

  const S = $derived(game.S);
  const now = $derived(game.now);
  const done = $derived(huntComplete(S));
  const info = $derived(bossPhaseInfo(S));
  const max = $derived(titanMax(S));
  const hp = $derived(Math.max(0, S.bossHp));
  const trait = $derived(titanTrait(S));
  const matchup = $derived(lineageMatchup(S));
  const combo = $derived(liveCombo(S, now));
  const PHASES = ['', 'PHASE I · ÉVEIL', 'PHASE II · FURIE', 'PHASE III · DÉSESPOIR'];

  // Composée de morceaux traduits séparément : les noms de titans varient.
  const targets = $derived(matchup.targets.map(t).join(' ' + t('et') + ' '));
  const matchupText = $derived(
    matchup.advantage
      ? t('Avantage sur') + ' ' + targets + ' : ' + t('+25 % de dégâts, une frappe de moins pour interrompre et pénalité réduite.')
      : t(matchup.lineageName) + ' : ' + t('pas d’avantage élémentaire sur ce titan.') + ' ' + t('Avantage sur') + ' : ' + targets + '.'
  );

  const warning = $derived.by(() => {
    if (done) return '✦ Tous les titans ont été vaincus. La forge est à toi.';
    const secs = (until: number) => ((until - now) / 1000).toFixed(1);
    if (S.bossTelegraphUntil > now) {
      const a = titanAttack(S, info.phase);
      return `${a.name} ! Cliquez ${a.need} fois avant la fin de l’incantation pour interrompre cette attaque. Interruption : ${Math.min(a.need, S.bossInterrupts || 0)} / ${a.need} · ${secs(S.bossTelegraphUntil)} s`;
    }
    if (S.bossStunUntil > now) return 'TITAN VULNÉRABLE · Profitez-en ! ' + secs(S.bossStunUntil) + ' s';
    if (S.bossWeakenUntil > now) return 'Le titan a frappé : production de mana réduite pendant ' + secs(S.bossWeakenUntil) + ' s.';
    return 'Prochaine attaque spéciale dans ' + Math.max(0, Math.ceil(((S.bossAttackAt || now + 14000) - now) / 1000)) + ' s · Gardez le rythme pour interrompre son incantation.';
  });
</script>

<section class="card titan" aria-labelledby="titan-name">
  <div class="top">
    <div>
      <div class="eyebrow">{t('ENNEMI ACTUEL')}</div>
      {#if done}
        <strong id="titan-name">{t('✦ Chasse aux titans achevée')}</strong>
        <div class="muted">{t('Chasse terminée : 30 / 30 titans vaincus')}</div>
        <div class="trait">{t('Les 30 titans sont tombés. La forge t’appartient, maître des cendres.')}</div>
      {:else}
        <strong id="titan-name">{t(titanName(S))}</strong>
        <div class="muted">
          {t('Titan ' + (S.boss + 1) + ' · Récompense : ' + f(titanReward(S)) + ' mana' + (titanGivesEmber(S.boss) ? ' + 1 braise' : ''))}
        </div>
        <div class="trait">{t(trait.trait)} · {t(trait.detail)}</div>
        <div class="matchup" class:neutral={!matchup.advantage} aria-live="polite">
          <strong>{t('Synergie')} · {t(matchup.lineageName)}</strong> — {matchupText}
        </div>
      {/if}
    </div>
    <div class="rank">{done ? '✦' : ROMAN[Math.min(S.boss, ROMAN.length - 1)]}</div>
  </div>

  <div class="line">
    <span>{done ? '—' : t('PV : ' + f(hp) + ' / ' + f(max))}</span>
    <span>{t('Titans vaincus : ' + (S.bossKills || 0))}</span>
  </div>
  <div class="track hp"><i style:width="{done ? 100 : Math.max(0, Math.min(100, (hp / max) * 100))}%"></i></div>
  <div class="line">
    <span class="phase">{done ? '✦' : t(PHASES[info.phase])}</span>
    <span>{t(done ? 'La chasse est terminée' : info.phase === 1 ? 'Titan stable' : info.phase === 2 ? 'Pénalité accrue si l’attaque passe' : 'Phase critique · interruption prioritaire')}</span>
  </div>
  <div class="track phasebar"><i style:width="{done ? 100 : info.progress * 100}%"></i></div>

  <div class="warning" class:danger={!done && S.bossTelegraphUntil > now} role="status" aria-live="polite">{t(warning)}</div>

  {#if !done}
    <div class="line combo">
      <strong>{t('Combo ×' + decimal2(1 + combo * 0.06))}</strong>
      <span>{t(combo >= 10 ? 'Furie draconique !' : 'Maintenez le rythme pour frapper plus fort.')}</span>
    </div>
  {/if}

  <SkillBar />
</section>

<style>
  .titan {
    display: grid;
    gap: 10px;
    border-color: #7a4a2a;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .eyebrow {
    font: 700 0.72rem var(--font-title);
    letter-spacing: 0.15em;
    color: var(--ember);
  }

  #titan-name {
    display: block;
    font: 800 1.3rem var(--font-title);
    font-variant: small-caps;
    color: var(--ink);
  }

  .trait,
  .matchup {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .trait {
    border: 1px solid #5a4a8a;
    background: #231d3a99;
  }

  .matchup {
    border: 1px solid #8a6a3a;
    background: #2a1f1499;
  }

  .matchup strong {
    color: var(--gold);
  }

  .matchup.neutral {
    border-color: var(--line);
    background: transparent;
  }

  .rank {
    flex: none;
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border: 2px solid var(--ember);
    border-radius: 50%;
    font: 800 1.2rem var(--font-title);
    color: var(--gold-2);
    box-shadow: 0 0 18px #ff8a3a55;
  }

  .line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .hp {
    height: 12px;
  }

  .hp > i {
    background: linear-gradient(90deg, #c0283a, #ff5a2a, #ffb04a);
  }

  .phasebar {
    height: 5px;
  }

  .phasebar > i {
    background: linear-gradient(90deg, #7a5cff, #c88cff);
  }

  .phase {
    font: 700 0.8rem var(--font-title);
    color: var(--ember);
  }

  .warning {
    padding: 10px 12px;
    border: 1px solid #7a3a2a;
    border-radius: 10px;
    background: #2a1414aa;
    font-size: 0.9rem;
  }

  .warning.danger {
    border-color: var(--danger);
    background: #5a1414;
    animation: pulse 0.8s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    to {
      box-shadow: 0 0 20px #ff5a2a88;
    }
  }

  .combo strong {
    color: var(--gold);
  }
</style>
