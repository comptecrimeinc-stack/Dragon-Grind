<script lang="ts">
  import { asset } from '#lib/assets.ts';
  import { DRAGONS } from '#lib/game/constants.ts';
  import { NAME_ERRORS, NAME_MAX } from '#lib/game/profile.ts';
  import { t } from '#lib/i18n/i18n.svelte.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import Crown from '../profile/Crown.svelte';
  import Modal from '../ui/Modal.svelte';

  const starters = DRAGONS.filter((d) => d.unlock === 0);

  let name = $state('');
  let dragon = $state('fire');
  let error = $state('');

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const result = game.createProfile(name, dragon);
    error = result.ok ? '' : NAME_ERRORS[result.reason];
  }
</script>

<Modal labelledby="profile-title" blocking>
  <form onsubmit={submit} novalidate>
    <div class="kicker">{t('LA FORGE DES HÉROS')}</div>
    <h2 id="profile-title">{t('Crée ton profil')}</h2>
    <p class="sub">{t('Choisis un nom et ton dragon de départ.')}</p>

    <label for="pg-name">{t('Nom du héros')}</label>
    <input id="pg-name" bind:value={name} maxlength={NAME_MAX} autocomplete="nickname" placeholder="Ex. : Eryndor" enterkeyhint="done" aria-describedby="pg-error" />

    <fieldset>
      <legend>{t('Dragon de départ')}</legend>
      <div class="dragons">
        {#each starters as d (d.id)}
          <button type="button" class="dragon" class:selected={dragon === d.id} aria-pressed={dragon === d.id} onclick={() => (dragon = d.id)}>
            <img src={asset(d.portrait)} alt="" />
            <strong>{t(d.name)}</strong>
            <small>{t(d.line)}</small>
          </button>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>{t('Cadre du profil')}</legend>
      <div class="frame">
        <span class="ring"><Crown frame="cw1" /></span>
        <span><strong>{t('Couronne de braise')}</strong><br /><small>{t('Rang I · Éveil · disponible dès la création')}</small></span>
      </div>
    </fieldset>

    <p class="error" id="pg-error" aria-live="polite">{error ? t(error) : ''}</p>
    <button type="submit" class="btn primary create">{t('Créer mon profil')}</button>
  </form>
</Modal>

<style>
  .kicker {
    text-align: center;
    font: 700 0.72rem var(--font-title);
    letter-spacing: 0.25em;
    color: var(--ember);
  }

  h2 {
    justify-content: center;
    margin: 5px 0 8px;
  }

  .sub {
    text-align: center;
    color: var(--muted);
    margin-bottom: 18px;
  }

  label,
  legend {
    display: block;
    margin: 12px 0 7px;
    padding: 0;
    color: #e7c98f;
    font-size: 0.85rem;
  }

  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
  }

  input {
    width: 100%;
    background: #100d12;
    color: #fff0d1;
    border: 1px solid #70553b;
    border-radius: 7px;
    padding: 12px;
    font: inherit;
  }

  .dragons {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }

  .dragon {
    display: grid;
    justify-items: center;
    gap: 2px;
    background: #17121a;
    color: var(--ink-2);
    border: 1px solid #514034;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
  }

  .dragon img {
    width: 100%;
    height: 94px;
    object-fit: contain;
  }

  .dragon.selected {
    border: 2px solid #e5bc67;
    background: #302315;
    box-shadow: 0 0 14px #b47d3544;
    color: #ffe2a1;
  }

  .frame {
    display: flex;
    gap: 12px;
    align-items: center;
    border: 2px solid #e5bc67;
    background: #302315;
    padding: 12px;
    border-radius: 8px;
  }

  .ring {
    width: 46px;
    height: 46px;
    flex: none;
  }

  .error {
    color: #ff9b83;
    min-height: 1.2em;
    font-size: 0.85rem;
    margin: 8px 0 0;
  }

  .create {
    width: 100%;
    margin-top: 12px;
    padding: 14px;
    font-family: var(--font-title);
  }
</style>
