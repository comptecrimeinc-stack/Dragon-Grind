<script lang="ts">
  import { LANGUAGES, type Lang } from '#lib/game/constants.ts';
  import type { GameState } from '#lib/game/state.ts';
  import { i18n, t } from '#lib/i18n/i18n.svelte.ts';
  import { readSnapshots, type Snapshot } from '#lib/services/persistence.ts';
  import { game } from '#lib/stores/game.svelte.ts';
  import ConfirmButton from '../ui/ConfirmButton.svelte';
  import Modal from '../ui/Modal.svelte';

  const close = () => (game.settingsOpen = false);
  const S = $derived(game.S);

  let snapshots = $state<Snapshot[]>(readSnapshots().slice().reverse());
  let pendingImport = $state<GameState | null>(null);
  let fileInput: HTMLInputElement;

  const refreshSnapshots = () => (snapshots = readSnapshots().slice().reverse());

  const LABELS: Record<string, string> = { auto: 'Automatique', avant: 'Avant remise à zéro', restore: 'Avant restauration', manual: 'Manuelle' };

  function when(at: number): string {
    try {
      return new Date(at).toLocaleString(i18n.lang, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return String(at);
    }
  }

  function summary(data: string): string {
    try {
      return t('Mana total') + ' : ' + Math.floor(Number(JSON.parse(data).life) || 0).toLocaleString(i18n.lang);
    } catch {
      return '';
    }
  }

  async function onfile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) pendingImport = await game.readImport(file);
  }

  function resetOptions() {
    game.setAudio({ snd: 1, hap: 1, shake: 1, mus: 1, vol: 70 });
    game.setSettings({ logo: true, motion: false, quality: 'auto' });
    game.setAutosave(true);
  }
</script>

<Modal labelledby="settings-title" onclose={close}>
  <div class="head">
    <h2 id="settings-title">⚙ {t('Paramètres du jeu')}</h2>
    <button type="button" class="close" aria-label={t('Fermer')} onclick={close}>✕</button>
  </div>

  <label class="row">
    <span><strong>{t('Son du jeu')}</strong><small>{t('Activer ou couper les effets sonores')}</small></span>
    <input type="checkbox" checked={S.snd !== 0} onchange={(e) => game.setAudio({ snd: e.currentTarget.checked ? 1 : 0 })} />
  </label>
  <label class="row">
    <span><strong>{t('Volume')}</strong><small>{t('Intensité sonore')}</small></span>
    <span class="range">
      <input type="range" min="0" max="100" step="5" value={S.vol} oninput={(e) => game.setAudio({ vol: Number(e.currentTarget.value) })} />
      <output>{S.vol} %</output>
    </span>
  </label>
  <label class="row">
    <span><strong>{t('Vibrations')}</strong><small>{t('Retour haptique sur les appareils compatibles')}</small></span>
    <input type="checkbox" checked={S.hap !== 0} onchange={(e) => game.setAudio({ hap: e.currentTarget.checked ? 1 : 0 })} />
  </label>
  <label class="row">
    <span><strong>{t('Musique d’ambiance')}</strong><small>{t('Activer ou couper la musique')}</small></span>
    <input type="checkbox" checked={S.mus !== 0} onchange={(e) => game.setAudio({ mus: e.currentTarget.checked ? 1 : 0 })} />
  </label>
  <label class="row">
    <span><strong>{t('Secousses d’écran')}</strong><small>{t('Activer ou couper les secousses visuelles')}</small></span>
    <input type="checkbox" checked={S.shake !== 0} onchange={(e) => game.setAudio({ shake: e.currentTarget.checked ? 1 : 0 })} />
  </label>
  <label class="row">
    <span><strong>{t('Langue')}</strong><small>{t('Langue de l’interface')}</small></span>
    <select value={i18n.lang} onchange={(e) => game.setLanguage(e.currentTarget.value as Lang)}>
      {#each LANGUAGES as l (l.code)}
        <option value={l.code}>{l.label}</option>
      {/each}
    </select>
  </label>
  <label class="row">
    <span><strong>{t('Afficher le logo')}</strong><small>{t('Masquer le logo pour gagner de la place')}</small></span>
    <input type="checkbox" checked={game.settings.logo} onchange={(e) => game.setSettings({ logo: e.currentTarget.checked })} />
  </label>
  <label class="row">
    <span><strong>{t('Animations')}</strong><small>{t('Réduire les effets visuels décoratifs')}</small></span>
    <input type="checkbox" checked={game.settings.motion} onchange={(e) => game.setSettings({ motion: e.currentTarget.checked })} />
  </label>
  <div class="row">
    <span><strong>{t('Qualité graphique')}</strong><small>{t('Sur mobile, choisis Basse pour alléger les effets.')}</small></span>
    <span class="seg" role="group" aria-label={t('Qualité graphique')}>
      {#each [['auto', 'Auto'], ['high', 'Haute'], ['low', 'Basse']] as const as [value, label] (value)}
        <button type="button" class:on={game.settings.quality === value} aria-pressed={game.settings.quality === value} onclick={() => game.setSettings({ quality: value })}>{t(label)}</button>
      {/each}
    </span>
  </div>
  <p class="muted">{t('Les vibrations ne sont pas disponibles sur iPhone (limitation d’Apple). Les sons et la musique démarrent après ton premier geste sur la page.')}</p>

  <section>
    <h3>💾 {t('Sauvegarde et transfert')}</h3>
    <p class="muted">{t('Exporte une copie de ta progression pour la conserver ou la transférer. L’import remplace la sauvegarde locale actuelle ; garde un export avant de l’utiliser.')}</p>
    <div class="actions">
      <button type="button" class="btn" onclick={() => game.exportSave()}>{t('Exporter la sauvegarde')}</button>
      <button type="button" class="btn" onclick={() => fileInput.click()}>{t('Importer une sauvegarde')}</button>
      <input bind:this={fileInput} type="file" accept="application/json,.json" hidden onchange={onfile} />
    </div>
    {#if pendingImport}
      <div class="pending">
        <p>{t('Importer cette sauvegarde et remplacer la progression locale actuelle ? Une copie de sécurité sera créée.')}</p>
        <div class="actions">
          <ConfirmButton label="Remplacer ma progression" variant="primary" onconfirm={() => pendingImport && game.replaceGame(pendingImport, 'manual') && close()} />
          <button type="button" class="btn ghost" onclick={() => (pendingImport = null)}>{t('Annuler')}</button>
        </div>
      </div>
    {/if}
  </section>

  <section>
    <h3>💾 {t('Sauvegardes automatiques')}</h3>
    <label class="row">
      <span><strong>{t('Activer')}</strong><small>{t('Une copie est conservée toutes les 2 minutes (6 dernières gardées)')}</small></span>
      <input type="checkbox" checked={game.autosaveOn} onchange={(e) => game.setAutosave(e.currentTarget.checked)} />
    </label>
    <ul class="snapshots">
      {#each snapshots as snap (snap.t + snap.l)}
        <li>
          <span>{when(snap.t)}<small>{t(LABELS[snap.l] ?? 'Automatique')} · {summary(snap.d)}</small></span>
          <ConfirmButton label="Restaurer" onconfirm={() => game.restoreSnapshot(snap) && close()} />
        </li>
      {:else}
        <li><span>{t('Aucune sauvegarde pour l’instant.')}<small>{t('La première sera créée automatiquement.')}</small></span></li>
      {/each}
    </ul>
    <button
      type="button"
      class="btn"
      onclick={() => {
        game.manualSnapshot();
        refreshSnapshots();
      }}>{t('Sauvegarder maintenant')}</button
    >
    <p class="status" aria-live="polite">{game.saveStatus ? t(game.saveStatus) : ''}</p>
  </section>

  <section class="danger">
    <h3>⚠ {t('Recommencer à zéro')}</h3>
    <small>{t('Efface toute ta progression de jeu et repart d’une partie neuve. Tes achats boutique et ton profil sont conservés. Une copie de sécurité est créée avant, tu peux la restaurer ci-dessus.')}</small>
    <ConfirmButton label="Recommencer à zéro" confirmLabel="Appuie encore pour tout effacer" timeout={5000} onconfirm={() => game.restartFromScratch() && close()} />
  </section>

  <div class="foot">
    <button type="button" class="btn ghost" onclick={resetOptions}>{t('Options par défaut')}</button>
    <button type="button" class="btn primary" onclick={close}>{t('Fermer')}</button>
  </div>
</Modal>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .head h2 {
    margin: 0 0 8px;
  }

  .close {
    width: 40px;
    height: 40px;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 10px 0;
    border-bottom: 1px solid #ffffff10;
    cursor: pointer;
  }

  .row strong {
    display: block;
  }

  .row small {
    color: var(--muted);
  }

  input[type='checkbox'] {
    width: 22px;
    height: 22px;
    accent-color: var(--gold-deep);
    flex: none;
  }

  .range {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  select {
    background: #100d12;
    color: var(--ink);
    border: 1px solid #70553b;
    border-radius: 7px;
    padding: 8px;
    font: inherit;
  }

  .seg {
    display: flex;
    gap: 4px;
  }

  .seg button {
    padding: 6px 10px;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
  }

  .seg button.on {
    background: var(--gold-deep);
    color: #fff1c9;
  }

  section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #624630;
  }

  .actions,
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0;
  }

  .foot {
    justify-content: space-between;
    margin-top: 18px;
  }

  .pending {
    padding: 10px;
    border: 1px solid var(--danger);
    border-radius: 10px;
  }

  .snapshots {
    list-style: none;
    margin: 8px 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }

  .snapshots li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid #ffffff12;
    border-radius: 9px;
    background: #0006;
  }

  .snapshots small {
    display: block;
    color: var(--muted);
  }

  .status {
    color: var(--muted);
    font-size: 0.88rem;
    min-height: 1.2em;
  }

  .danger small {
    display: block;
    color: var(--muted);
    margin-bottom: 8px;
  }
</style>
