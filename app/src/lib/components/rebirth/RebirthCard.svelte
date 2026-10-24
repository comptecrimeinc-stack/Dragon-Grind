<script lang="ts">
  import { REBIRTH_CAP } from '#lib/game/constants.ts';
  import { emberGain, perEmber, rebirthThreshold } from '#lib/game/economy.ts';
  import { formatNumber as f, percent, plural } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import ConfirmButton from '../ui/ConfirmButton.svelte';

  const S = $derived(game.S);
  const gain = $derived(emberGain(S));
  const text = $derived(
    gain >= 1
      ? 'Renaissance n°' + (S.ranks + 1) + ' : repartez de zéro, gagnez ' + plural(gain, 'braise') + '. Chaque braise passera de +' + percent(perEmber(S.ranks)) + ' % à +' + percent(perEmber(S.ranks + 1)) + ' %. La renaissance suivante demandera environ 2,65 fois plus de mana.'
      : 'Renaissance n°' + (S.ranks + 1) + ' : amassez ' + f(Math.max(0, rebirthThreshold(S) - S.run)) + ' mana de plus dans ce cycle.'
  );
</script>

<div class="card">
  <p>{t(S.ranks >= REBIRTH_CAP ? '✦ Renaissance ultime atteinte' : text)}</p>
  <ConfirmButton
    variant="primary"
    disabled={gain < 1}
    label={gain < 1 ? 'Renaître' : 'Renaître : +' + plural(gain, 'braise')}
    onconfirm={() => game.rebirth()}
  />
</div>
