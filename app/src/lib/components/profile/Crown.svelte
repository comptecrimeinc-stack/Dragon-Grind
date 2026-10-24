<script lang="ts">
  import type { FrameId } from '#lib/game/constants.ts';
  import { crownSvg } from '#lib/game/profile.ts';

  let { frame }: { frame: FrameId } = $props();

  // SVG généré à partir de constantes uniquement (aucune donnée utilisateur).
  const markup = $derived(crownSvg(frame));
</script>

<svg viewBox="0 0 200 200" aria-hidden="true">{@html markup}</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    filter: drop-shadow(0 3px 5px #0008);
  }
</style>
