import type { TabId } from './constants';

/** Les annonces marquantes restent affichées plus longtemps. */
export const isImportantToast = (msg: string): boolean =>
  /succès|découvert|légendaire|boss de zone vaincu|titan vaincu|éclosion|nouveau dragon|secret découvert|ascension/i.test(msg);

/** Onglet concerné par une annonce : il reçoit une pastille tant qu'on ne l'a pas ouvert. */
export function toastTargetTab(msg: string): TabId | null {
  if (/aventure|boss de zone|récompense du boss|expédition|recruté|équipe renforcée/i.test(msg)) return 'expedition';
  if (/dragon|lignée|éclosion|secret|collection|sanctuaire/i.test(msg)) return 'bestiaire';
  if (/relique|amélioration|forge|braise|talent/i.test(msg)) return 'forge';
  if (/renaissance|ascension|classement|étoile|sceau/i.test(msg)) return 'renaissance';
  if (/contrat accompli/i.test(msg)) return 'combat';
  return null;
}
