<script lang="ts">
  import type { Snippet } from 'svelte';
  import { asset } from '#lib/assets.ts';
  import { DRAGONS, type FrameId } from '#lib/game/constants.ts';
  import Crown from './Crown.svelte';

  interface Props {
    dragon: string;
    /** Cadre héraldique ; sans cadre, seul le portrait est affiché. */
    frame?: FrameId | null;
    /** Côté en pixels. */
    size?: number;
    glow?: boolean;
    children?: Snippet;
  }

  let { dragon, frame = null, size = 44, glow = false, children }: Props = $props();

  const meta = $derived(DRAGONS.find((d) => d.id === dragon));
</script>

<span class="avatar" class:glow style:--size="{size}px" data-dragon={dragon}>
  <span class="portrait">
    {#if meta}<img src={asset(meta.portrait)} alt="" draggable="false" />{:else}🐲{/if}
  </span>
  {#if frame}<span class="crown"><Crown {frame} /></span>{/if}
  {@render children?.()}
</span>

<style>
  .avatar {
    position: relative;
    display: inline-block;
    flex: none;
    width: var(--size);
    height: var(--size);
  }

  /* Le portrait occupe l'ouverture centrale de la couronne. */
  .portrait {
    position: absolute;
    inset: 12.5%;
    display: grid;
    place-items: center;
    border-radius: 50%;
    overflow: hidden;
    font-size: calc(var(--size) * 0.4);
  }

  .portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .glow .portrait {
    box-shadow: 0 0 calc(var(--size) * 0.18) #9b5cff;
  }

  .crown {
    position: absolute;
    inset: -6%;
  }
</style>
