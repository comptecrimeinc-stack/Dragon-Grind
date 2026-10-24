/**
 * Accès au stockage du navigateur qui ne lève jamais d'exception : mode privé,
 * quota plein ou stockage bloqué renvoient simplement `null` / `false`.
 * Les clés sont celles du jeu d'origine, pour que les sauvegardes existantes restent lisibles.
 */
export const KEYS = {
  save: 'dragon-grind-v2',
  backup: 'dragon-grind-v2-backup',
  backupDate: 'dragon-grind-v2-backup-date',
  corrupt: 'dragon-grind-v2-corrupt',
  securityLog: 'dragon-grind-v2-security-log',
  autosaves: 'dragon-grind-v2-autosaves',
  autosaveOn: 'dragon-grind-v2-autosave-on',
  profile: 'dragon-grind-v2-profile',
  heraldry: 'dragon-grind-v2-heraldry',
  heroes: 'dragon-grind-v2-heroes',
  cosmetics: 'dragonGrindCosmeticShop_v1',
  language: 'dragon-grind-language-v1',
  languageChosen: 'dragon-grind-language-chosen',
  settings: 'dragon-grind-settings-v3',
  activeTab: 'dragonGrindActiveSkillTab',
  quality: 'dragon-grind-quality'
} as const;

function store(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
  } catch {
    return null;
  }
}

export function readRaw(key: string, kind: 'local' | 'session' = 'local'): string | null {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Écrit une valeur ; renvoie false si le navigateur refuse (quota, mode privé…). */
export function writeRaw(key: string, value: string, kind: 'local' | 'session' = 'local'): boolean {
  try {
    const s = store(kind);
    if (!s) return false;
    s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string, kind: 'local' | 'session' = 'local'): void {
  try {
    store(kind)?.removeItem(key);
  } catch {
    /* stockage indisponible : rien à supprimer */
  }
}

export function readJson<T>(key: string, fallback: T, kind: 'local' | 'session' = 'local'): T {
  const raw = readRaw(key, kind);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const writeJson = (key: string, value: unknown, kind: 'local' | 'session' = 'local'): boolean => writeRaw(key, JSON.stringify(value), kind);
