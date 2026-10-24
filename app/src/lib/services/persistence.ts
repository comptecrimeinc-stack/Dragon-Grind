import { SAVE_VERSION } from '#lib/game/constants.ts';
import { freshState, normalizeSaveData, type GameState } from '#lib/game/state.ts';
import { KEYS, readJson, readRaw, removeKey, writeJson, writeRaw } from './storage';

export type HealthMessage = 'failed' | 'recovered' | 'recovery' | 'corrupt' | 'backupFail' | 'backupOnly' | 'restoreFail' | 'importBackupFail' | 'importStoreFail' | 'manual';

/** Messages d'état de la sauvegarde (texte français, traduit à l'affichage). */
export const HEALTH_TEXT: Record<HealthMessage, string> = {
  failed: 'Échec de la sauvegarde locale : stockage indisponible ou plein. Exporte une copie avant de fermer le jeu.',
  recovered: 'Sauvegarde locale rétablie.',
  recovery: 'La sauvegarde principale était absente ou illisible. Une copie de secours a été récupérée ; exporte une sauvegarde dès que possible.',
  corrupt: 'La sauvegarde locale était illisible et aucune copie exploitable n’a été trouvée. L’ancien fichier a été conservé quand possible.',
  backupFail: 'Copie de sécurité impossible : progression inchangée. Libère de l’espace ou exporte ta sauvegarde.',
  backupOnly: 'Copie de secours créée, mais la sauvegarde locale reste indisponible. Conserve aussi ton export.',
  restoreFail: 'Restauration annulée : impossible d’enregistrer la copie restaurée. La progression actuelle reste intacte.',
  importBackupFail: 'Import annulé : impossible de créer une copie de sécurité. Exporte d’abord ta progression.',
  importStoreFail: 'Le fichier est valide, mais son enregistrement local a échoué. La progression actuelle n’a pas été remplacée.',
  manual: 'Copie de sauvegarde créée.'
};

export interface SecurityEvent {
  at: number;
  message: string;
}

export function recordSecurityEvent(message: string, now = Date.now()): void {
  const log = readSecurityLog();
  log.push({ at: now, message: String(message).slice(0, 180) });
  writeJson(KEYS.securityLog, log.slice(-50));
}

export function readSecurityLog(): SecurityEvent[] {
  const log = readJson<unknown>(KEYS.securityLog, []);
  return Array.isArray(log) ? log.filter((e): e is SecurityEvent => !!e && typeof e === 'object' && typeof e.message === 'string') : [];
}

export interface LoadResult {
  state: GameState;
  /** Temps écoulé depuis la dernière sauvegarde, à convertir en progression hors ligne. */
  offlineSeconds: number;
  notices: string[];
}

export interface Snapshot {
  t: number;
  l: 'auto' | 'manual' | 'avant' | 'restore' | string;
  d: string;
}

export function readSnapshots(): Snapshot[] {
  const list = readJson<unknown>(KEYS.autosaves, []);
  return Array.isArray(list) ? list.filter((x): x is Snapshot => !!x && typeof x.d === 'string' && !!x.t) : [];
}

/** Nettoie les états éphémères du combat, qui n'ont pas de sens après un rechargement. */
function prepareLoaded(state: GameState, now: number): GameState {
  state.bossTelegraphUntil = 0;
  state.bossInterrupts = 0;
  state.bossStunUntil = 0;
  state.bossWeakenUntil = 0;
  state.combo = 0;
  state.comboAt = 0;
  for (const k of ['strike', 'surge', 'devour']) {
    const until = state.skillCd[k];
    state.skillCd[k] = Number.isFinite(until) ? Math.min(until, now + 60000) : 0;
  }
  state.buffUntil = Math.min(state.buffUntil || 0, now + 8000);
  return state;
}

/**
 * Charge la partie. Si la sauvegarde principale est illisible, reprend la copie la plus
 * récente (copie de sécurité ou sauvegarde automatique). Un décalage d'horloge suspect
 * neutralise ou plafonne la progression hors ligne.
 */
export function loadGame(now = Date.now()): LoadResult {
  const notices: string[] = [];
  const raw = readRaw(KEYS.save) ?? '';
  let state: GameState | null = null;
  if (raw) {
    try {
      state = normalizeSaveData(JSON.parse(raw), false, now);
    } catch {
      state = null;
    }
  }
  if (!state) {
    const candidates: { state: GameState; label: string; stamp: number }[] = [];
    const add = (data: string, label: string, stamp: number) => {
      try {
        const s = normalizeSaveData(JSON.parse(data), false, now);
        candidates.push({ state: s, label, stamp: Math.max(stamp || 0, s.t || 0) });
      } catch {
        /* copie illisible : ignorée */
      }
    };
    const backup = readRaw(KEYS.backup);
    if (backup) add(backup, 'la copie de sécurité précédente', Number(readRaw(KEYS.backupDate)) || 0);
    for (const snap of readSnapshots()) add(snap.d, 'une sauvegarde automatique', snap.t);
    candidates.sort((a, b) => b.stamp - a.stamp);
    if (candidates.length) {
      state = candidates[0].state;
      writeJson(KEYS.save, state);
      notices.push(HEALTH_TEXT.recovery);
      recordSecurityEvent('Sauvegarde principale illisible ; récupération depuis ' + candidates[0].label + '.', now);
    } else if (raw) {
      if (raw.length <= 2 * 1024 * 1024) writeRaw(KEYS.corrupt, raw);
      recordSecurityEvent('Sauvegarde principale illisible et aucune copie valide trouvée.', now);
      const clean = freshState(now);
      writeJson(KEYS.save, clean);
      notices.push(HEALTH_TEXT.corrupt);
      return { state: clean, offlineSeconds: 0, notices };
    } else {
      return { state: freshState(now), offlineSeconds: 0, notices };
    }
  }

  const delta = (now - (state.t || now)) / 1000;
  let offlineSeconds = 0;
  if (delta < -120) {
    notices.push('Horloge système reculée : progression hors ligne désactivée pour cette ouverture.');
    recordSecurityEvent('Recul de l’horloge détecté; gains hors ligne neutralisés pour cette ouverture.', now);
  } else {
    offlineSeconds = Math.max(0, Math.min(delta, 24 * 3600));
    if (delta > 24 * 3600) {
      notices.push('Avance horaire inhabituelle : gains hors ligne plafonnés.');
      recordSecurityEvent('Avance horaire inhabituelle; progression hors ligne plafonnée.', now);
    }
  }
  state.t = now;
  return { state: prepareLoaded(state, now), offlineSeconds, notices };
}

/** Enregistre la partie. `savedAt` permet de dater la sauvegarde au moment où l'onglet a été masqué. */
export function saveGame(state: GameState, savedAt = Date.now()): boolean {
  const serialized = JSON.stringify({ ...state, saveVersion: SAVE_VERSION, t: savedAt });
  return serialized.length > 2 && writeRaw(KEYS.save, serialized);
}

export const SNAPSHOT_MAX = 6;
export const SNAPSHOT_EVERY_MS = 120000;

export const autosaveEnabled = (): boolean => readRaw(KEYS.autosaveOn) !== '0';
export const setAutosaveEnabled = (on: boolean): boolean => writeRaw(KEYS.autosaveOn, on ? '1' : '0');

/** Écrit la liste des copies, en sacrifiant les plus anciennes si le quota est atteint. */
function writeSnapshots(list: Snapshot[]): boolean {
  const a = list.slice();
  while (a.length) {
    if (writeJson(KEYS.autosaves, a)) return true;
    a.shift();
  }
  removeKey(KEYS.autosaves);
  return false;
}

const withoutStamp = (data: string): string => {
  try {
    const o = JSON.parse(data);
    delete o.t;
    return JSON.stringify(o);
  } catch {
    return data;
  }
};

/**
 * Copie de sauvegarde. Les copies automatiques sont espacées de deux minutes et ignorées
 * si rien n'a changé ; `force` crée toujours une copie (avant import, restauration, remise à zéro).
 */
export function createSnapshot(state: GameState, label: Snapshot['l'], force: boolean, now = Date.now()): boolean {
  const data = JSON.stringify(state);
  if (!data || data.length < 20) return false;
  const list = readSnapshots();
  const last = list[list.length - 1];
  if (!force) {
    if (!autosaveEnabled()) return false;
    if (last && now - last.t < SNAPSHOT_EVERY_MS) return false;
    if (last && withoutStamp(last.d) === withoutStamp(data)) return true;
  }
  list.push({ t: now, l: label, d: data });
  while (list.length > SNAPSHOT_MAX) {
    const i = list.findIndex((x) => x.l === 'auto');
    list.splice(i < 0 ? 0 : i, 1);
  }
  return writeSnapshots(list);
}

/** Remplace la partie enregistrée par `next` après avoir sauvegardé l'actuelle. */
export function replaceSave(current: GameState, next: GameState, label: Snapshot['l'], now = Date.now()): 'ok' | 'backupFail' | 'writeFail' {
  if (!createSnapshot(current, label, true, now)) return 'backupFail';
  const previous = readRaw(KEYS.save);
  if (previous) {
    writeRaw(KEYS.backup, previous);
    writeRaw(KEYS.backupDate, String(now));
  }
  return writeJson(KEYS.save, { ...next, t: now, saveVersion: SAVE_VERSION }) ? 'ok' : 'writeFail';
}

export interface ExportPayload {
  app: 'Dragon Grind';
  format: 1;
  exportedAt: string;
  save: GameState;
}

export const exportPayload = (state: GameState, now = Date.now()): ExportPayload => ({
  app: 'Dragon Grind',
  format: 1,
  exportedAt: new Date(now).toISOString(),
  save: JSON.parse(JSON.stringify(state))
});

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

/** Valide strictement un fichier d'export (ou une sauvegarde brute). Lève une erreur si invalide. */
export function parseImport(text: string, now = Date.now()): GameState {
  const parsed = JSON.parse(text);
  const candidate = parsed && typeof parsed === 'object' && 'save' in parsed ? parsed.save : parsed;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || !('gold' in candidate || 'life' in candidate || 'u' in candidate)) {
    throw new Error('format');
  }
  return normalizeSaveData(candidate, true, now);
}
