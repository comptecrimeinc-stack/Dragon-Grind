<script lang="ts">
  import { skillRemaining, skillUnlocked } from '#lib/game/combat.ts';
  import { SKILLS } from '#lib/game/constants.ts';
  import { setCount } from '#lib/game/economy.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';

  const S = $derived(game.S);

  const status = $derived(
    (S.rk || 0) < 1
      ? 'Effectuez votre première renaissance pour éveiller les compétences actives.'
      : game.now < (S.buffUntil || 0)
        ? 'Surcharge active : production de mana ×' + (setCount(S, 'archon') >= 3 ? 7 : 5) + ' !'
        : 'Les compétences se rechargent avec le temps. La voie de l’Archimage réduit leurs délais.'
  );
</script>

<div class="skills" role="group" aria-label={t('Compétences actives')}>
  {#each SKILLS as sk (sk.id)}
    {@const locked = !skillUnlocked(S, sk.id)}
    {@const remain = skillRemaining(S, sk.id, game.now)}
    <button type="button" class="skill" disabled={locked || remain > 0} onclick={() => game.useSkill(sk.id)}>
      <span class="icon" aria-hidden="true">{sk.icon}</span>
      <span class="name">{t(sk.name)}</span>
      <small>{t(locked ? sk.gate : remain > 0 ? 'Recharge · ' + (remain / 1000).toFixed(1) + ' s' : 'Prête !')}</small>
    </button>
  {/each}
</div>
<p class="muted">{t(status)}</p>

<style>
  .skills {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 6px;
  }

  .skill {
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 12px 6px;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: linear-gradient(180deg, #2a1d16, #17110e);
    cursor: pointer;
    text-align: center;
  }

  .skill:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.6rem;
  }

  .name {
    font: 700 0.85rem var(--font-title);
    font-variant: small-caps;
  }

  small {
    color: var(--muted);
    font-size: 0.75rem;
  }
</style>
