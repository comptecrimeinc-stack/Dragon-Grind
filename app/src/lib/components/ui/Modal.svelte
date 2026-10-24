<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    labelledby: string;
    onclose?: () => void;
    /** Couche au-dessus de tout (écrans de démarrage). */
    blocking?: boolean;
    children: Snippet;
  }

  let { labelledby, onclose, blocking = false, children }: Props = $props();
  let dialog: HTMLDivElement;

  const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';

  $effect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (dialog.querySelector(FOCUSABLE) as HTMLElement | null)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  });

  // Piège le focus dans la boîte de dialogue et ferme avec Échap.
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && onclose) {
      e.preventDefault();
      onclose();
      return;
    }
    if (e.key !== 'Tab') return;
    const list = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" class:blocking onclick={(e) => e.target === e.currentTarget && onclose?.()}>
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledby} bind:this={dialog} tabindex="-1" {onkeydown}>
    {@render children()}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(5, 4, 8, 0.86);
    backdrop-filter: blur(6px);
    overflow-y: auto;
  }

  .backdrop.blocking {
    z-index: 2000;
    background: rgba(5, 4, 8, 0.96);
  }

  .dialog {
    width: min(560px, 100%);
    max-height: calc(100dvh - 36px);
    overflow: auto;
    padding: clamp(18px, 4vw, 30px);
    border: 1px solid #9d7743;
    border-radius: 14px;
    background: radial-gradient(ellipse at top, #30231d, #100d12 72%);
    box-shadow:
      0 0 0 5px #171016,
      0 20px 80px #000;
    color: var(--ink);
  }

  .dialog:focus {
    outline: none;
  }
</style>
