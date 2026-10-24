<script lang="ts">
  import { i18n, t } from '#lib/i18n/i18n.svelte.ts';
  import { readSecurityLog } from '#lib/services/persistence.ts';

  let log = $state(readSecurityLog().slice().reverse());
</script>

<article class="card">
  <h3>🛡️ {t('Sécurité & anti-triche')}</h3>
  <p class="muted">{t('Les valeurs de la sauvegarde sont vérifiées et bornées au chargement comme à l’import. Les clics trop rapides ou trop réguliers sont limités. Toute anomalie est notée ici.')}</p>
  <ul>
    {#each log as e (e.at + e.message)}
      <li><strong>{new Date(e.at).toLocaleString(i18n.lang, { dateStyle: 'short', timeStyle: 'short' })}</strong> {t(e.message)}</li>
    {:else}
      <li class="muted">{t('Aucun événement récent.')}</li>
    {/each}
  </ul>
  <button type="button" class="btn" onclick={() => (log = readSecurityLog().slice().reverse())}>{t('Rafraîchir le journal')}</button>
  <p class="muted note">{t('Note : un jeu 100 % local ne peut jamais être totalement inviolable. Ces protections empêchent la triche occasionnelle et protègent le classement.')}</p>
</article>

<style>
  ul {
    padding-inline-start: 18px;
    font-size: 0.88rem;
  }

  li strong {
    color: var(--gold);
    margin-inline-end: 6px;
  }

  .note {
    margin-top: 10px;
  }
</style>
