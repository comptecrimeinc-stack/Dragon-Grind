<script lang="ts">
  import { untrack } from 'svelte';
  import { GATE_DRAGON } from '#lib/assets.ts';
  import { LANGUAGES, type Lang } from '#lib/game/constants.ts';
  import { i18n, t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import Modal from '../ui/Modal.svelte';

  let selected = $state<Lang>(i18n.lang);

  // Les textes de l'écran suivent la langue choisie avant validation.
  $effect(() => {
    const lang = selected;
    untrack(() => game.setLanguage(lang, false));
  });
</script>

<Modal labelledby="lang-title" blocking>
  <div class="gate">
    <img src={GATE_DRAGON} alt="" />
    <h1 id="lang-title">{t('Choisis ta langue')}</h1>
    <p>{t('Sélectionne la langue avant de créer ton profil.')}</p>
    <label for="lang-select">Langue / Language / Idioma</label>
    <select id="lang-select" bind:value={selected}>
      {#each LANGUAGES as l (l.code)}
        <option value={l.code}>{l.flag} {l.label}</option>
      {/each}
    </select>
    <button type="button" class="btn primary" onclick={() => game.setLanguage(selected)}>{t('Continuer')}</button>
  </div>
</Modal>

<style>
  .gate {
    text-align: center;
  }

  img {
    height: 88px;
    filter: drop-shadow(0 0 12px #e5b66b44);
  }

  h1 {
    font-size: clamp(1.4rem, 5vw, 2rem);
    margin: 12px 0;
  }

  p {
    color: #c5b397;
    margin-bottom: 22px;
  }

  label {
    display: block;
    text-align: start;
    color: #e7c98f;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  select,
  .btn {
    width: 100%;
    padding: 13px;
    border-radius: 8px;
    font: inherit;
  }

  select {
    background: #100d12;
    color: #fff0d1;
    border: 1px solid #70553b;
    margin-bottom: 16px;
  }
</style>
