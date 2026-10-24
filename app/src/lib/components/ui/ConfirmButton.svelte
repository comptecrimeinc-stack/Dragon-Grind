<script lang="ts">
  import { t } from '#lib/i18n/i18n.svelte.ts';

  interface Props {
    label: string;
    confirmLabel?: string;
    disabled?: boolean;
    variant?: 'primary' | 'ghost' | '';
    /** Délai avant que le bouton ne se désarme (ms). */
    timeout?: number;
    onconfirm: () => void;
  }

  let { label, confirmLabel = 'Toucher encore pour confirmer', disabled = false, variant = '', timeout = 3000, onconfirm }: Props = $props();

  // Une action irréversible demande deux appuis : le premier arme le bouton.
  let armed = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function onclick() {
    if (armed) {
      clearTimeout(timer);
      armed = false;
      onconfirm();
      return;
    }
    armed = true;
    timer = setTimeout(() => (armed = false), timeout);
  }

  $effect(() => () => clearTimeout(timer));
</script>

<button type="button" class="btn {variant}" class:armed {disabled} {onclick}>{t(armed ? confirmLabel : label)}</button>

<style>
  .armed {
    border-color: var(--danger);
    box-shadow: 0 0 0 2px #ff7a6633;
  }
</style>
