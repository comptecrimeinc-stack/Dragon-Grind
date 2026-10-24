<script lang="ts">
  import { dragonArt, FOREST_AURA } from '#lib/assets.ts';
  import { activeLineage } from '#lib/game/combat.ts';
  import { LINEAGES } from '#lib/game/constants.ts';
  import { stageIndex } from '#lib/game/economy.ts';
  import { formatNumber } from '#lib/game/format.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import { ParticleLayer } from './particles.ts';
  import { DragonRelief } from './relief.ts';

  interface Floater {
    id: number;
    x: number;
    y: number;
    text: string;
  }

  const lineage = $derived(activeLineage(game.S));
  const stage = $derived(stageIndex(game.S));
  const art = $derived(dragonArt(lineage, stage));
  const lowQuality = $derived(
    game.settings.quality === 'low' || (game.settings.quality === 'auto' && (navigator.hardwareConcurrency ?? 8) <= 4)
  );

  let button: HTMLButtonElement;
  let glCanvas: HTMLCanvasElement;
  let fxCanvas: HTMLCanvasElement;
  let relief = $state<DragonRelief | null>(null);
  let layer: ParticleLayer | null = null;
  let pressed = $state(false);
  let burst = $state(false);
  let floaters = $state<Floater[]>([]);
  let floaterSeq = 0;

  $effect(() => {
    // Sans WebGL, ou si le contexte est perdu, le portrait reste une image fixe.
    const r = DragonRelief.create(glCanvas, () => {
      console.warn('Dragon Grind : contexte WebGL perdu, portrait affiché sans relief.');
      relief = null;
    });
    relief = r;
    const particles = game.settings.motion ? null : new ParticleLayer(fxCanvas, () => LINEAGES[activeLineage(game.S)]);
    layer = particles;
    return () => {
      r?.destroy();
      particles?.destroy();
    };
  });

  $effect(() => {
    relief?.setArt(art, stage, LINEAGES[lineage].light);
  });

  // Gerbe lumineuse à chaque nouveau stade d'évolution.
  $effect(() => {
    if (!game.evolveBurst) return;
    burst = true;
    const timer = setTimeout(() => (burst = false), 900);
    return () => clearTimeout(timer);
  });

  // Un souffle n'est compté qu'au relâchement, si le doigt a peu bougé :
  // un glissement qui commence sur le dragon fait défiler la page sans souffler.
  const MOVE_CANCEL_PX = 12;
  let start: { id: number; x: number; y: number; moved: boolean } | null = null;

  function onpointerdown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    pressed = true;
  }

  function onpointermove(e: PointerEvent) {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      start.moved = true;
      pressed = false;
    } else {
      const r = button.getBoundingClientRect();
      relief?.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }
  }

  function onpointerup(e: PointerEvent) {
    if (!start || e.pointerId !== start.id) return;
    const { x, y, moved } = start;
    start = null;
    pressed = false;
    if (!moved) breathe(x, y);
  }

  function cancel() {
    start = null;
    pressed = false;
  }

  // Activation au clavier (Entrée/Espace) : souffle au centre.
  function onclick(e: MouseEvent) {
    if (e.detail === 0) breathe(null, null);
  }

  function breathe(clientX: number | null, clientY: number | null) {
    const gain = game.tap();
    if (gain === null) return;
    const r = button.getBoundingClientRect();
    const x = clientX === null ? r.width / 2 : clientX - r.left;
    const y = clientY === null ? r.height / 2 : clientY - r.top;
    relief?.tap(x / r.width, y / r.height);
    layer?.burst(x, y);
    if (floaters.length < 8) {
      const f = { id: ++floaterSeq, x, y, text: '+' + formatNumber(gain) };
      floaters.push(f);
      setTimeout(() => (floaters = floaters.filter((o) => o.id !== f.id)), 560);
    }
  }
</script>

<div class="frame" class:aura={game.isEquipped('forest-aura')} style:--aura="url({FOREST_AURA})">
  <button
    type="button"
    class="tap"
    class:pressed
    class:burst
    class:low={lowQuality}
    style:--vc={LINEAGES[lineage].color}
    aria-label={t('Faire cracher du feu au dragon')}
    bind:this={button}
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    onpointercancel={cancel}
    onpointerleave={cancel}
    oncontextmenu={(e) => e.preventDefault()}
    {onclick}
  >
    <canvas class="gl" bind:this={glCanvas} hidden={!relief}></canvas>
    {#if !relief}<img class="fallback" src={art} alt="" />{/if}
    <span class="vignette"></span>
    <canvas class="fx" bind:this={fxCanvas}></canvas>
    {#each floaters as f (f.id)}
      <span class="floater" style:left="{f.x}px" style:top="{f.y}px">{f.text}</span>
    {/each}
  </button>
</div>

<style>
  .frame {
    position: relative;
    width: 100%;
    max-width: 340px;
    margin-inline: auto;
  }

  /* Aura sylvestre (cosmétique) : branches lumineuses autour du portrait. */
  .frame.aura::before {
    content: '';
    position: absolute;
    inset: -14% -22%;
    background: var(--aura) center / 100% 100% no-repeat;
    filter: drop-shadow(0 0 10px #58d68d99);
    pointer-events: none;
    animation: aura 6s ease-in-out infinite;
  }

  @keyframes aura {
    50% {
      filter: drop-shadow(0 0 18px #7dffb0cc);
      transform: scale(1.015);
    }
  }

  .tap {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 8 / 9;
    padding: 0;
    border: 2px solid #c89a5b;
    border-radius: 18px;
    overflow: hidden;
    background: #0b0a0e;
    box-shadow:
      0 0 0 5px #120d10,
      0 0 0 6px #6a4a2a,
      0 18px 50px #000c,
      0 0 40px color-mix(in srgb, var(--vc) 25%, transparent);
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.12s;
  }

  .tap.pressed {
    transform: scale(0.97);
  }

  .tap.burst {
    animation: evolve 0.9s ease-out;
  }

  @keyframes evolve {
    30% {
      box-shadow:
        0 0 0 5px #120d10,
        0 0 0 6px #ffd27a,
        0 0 90px var(--vc);
      transform: scale(1.04);
    }
  }

  .gl,
  .fallback,
  .fx,
  .vignette {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .fallback {
    object-fit: cover;
    object-position: 50% 48%;
  }

  .vignette {
    background: radial-gradient(ellipse at 50% 45%, transparent 55%, #000a);
  }

  .tap.low .fx {
    display: none;
  }

  .floater {
    position: absolute;
    transform: translate(-50%, -50%);
    font: 800 1.15rem var(--font-title);
    color: #ffe9a8;
    text-shadow:
      0 0 8px #ff8a3a,
      0 2px 2px #000;
    pointer-events: none;
    animation: rise 0.56s ease-out forwards;
  }

  @keyframes rise {
    to {
      transform: translate(-50%, -150%);
      opacity: 0;
    }
  }
</style>
