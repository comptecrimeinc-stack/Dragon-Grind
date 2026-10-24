import { MAX_GAME_VALUE, SAVE_VERSION, STARTER_DRAGONS, type AscPathId, type RelicSlot } from './constants';

export interface DailyState {
  date: string;
  progress: Record<string, number>;
  claimed: Record<string, number>;
}

export interface AdventureState {
  gold: number;
  crystals: number;
  fragments: number;
  materials: number;
  chapter: number;
  zone: number;
  unlocked: number;
  owned: string[];
  team: string[];
  levels: Record<string, number>;
  kills: number;
  bossWins: number;
  zoneKills: number;
  upgrades: number;
  paused: boolean;
  pendingBoss: boolean;
  claimedBoss: Record<string, number>;
  achievements: Record<string, number>;
  selectedDragon: string;
  daily: DailyState;
  lastSeen: number;
  goldRate: number;
  /** Jauge d'avancement vers la prochaine victoire automatique. */
  meter: number;
  obsidianPurchasedUnlock?: boolean;
}

/** État complet d'une partie, tel qu'il est sauvegardé dans le navigateur. */
export interface GameState {
  /** Mana disponible. */
  gold: number;
  /** Mana récolté pendant le cycle de renaissance en cours. */
  run: number;
  /** Mana récolté depuis le début. */
  life: number;
  taps: number;
  embers: number;
  /** Braises gagnées depuis la dernière ascension (base du bonus de braise). */
  eAll: number;
  /** Renaissances du cycle d'ascension en cours. */
  ranks: number;
  /** Renaissances au total. */
  rk: number;
  stars: number;
  asc: number;
  claw: number;
  u: Record<string, number>;
  tal: Record<string, number>;
  ach: Record<string, number>;
  /** Lignée visuelle sélectionnée. */
  v: number;
  vu: Record<string, number>;
  /** Indice du titan actuel (= titans vaincus dans la chasse). */
  boss: number;
  bossHp: number;
  bossKills: number;
  bossAttackAt: number;
  bossTelegraphUntil: number;
  bossInterrupts: number;
  bossStunUntil: number;
  bossWeakenUntil: number;
  combo: number;
  comboAt: number;
  daily: DailyState;
  ascPts: number;
  ascTal: Record<AscPathId, number>;
  skillCd: Record<string, number>;
  buffUntil: number;
  relicShards: number;
  relicOwned: string[];
  relicEquip: Record<RelicSlot, string>;
  eggsOpened: number;
  eggWarm: number;
  tuto: number;
  dragonDex: Record<string, number>;
  sanctuaries: Record<string, number>;
  secrets: Record<string, number>;
  adventure: AdventureState | null;
  path: AscPathId | '';
  pathLoy: number;
  oaths: number;
  playMs: number;
  evCaught: number;
  lastExport: number;
  snd: number;
  hap: number;
  shake: number;
  mus: number;
  vol: number;
  saveVersion: number;
  t: number;
}

export function freshDaily(date = ''): DailyState {
  return { date, progress: { taps: 0, boss: 0, buys: 0 }, claimed: {} };
}

export function freshAdventure(now = Date.now()): AdventureState {
  return {
    gold: 500,
    crystals: 0,
    fragments: 0,
    materials: 10,
    chapter: 0,
    zone: 0,
    unlocked: 1,
    owned: [...STARTER_DRAGONS],
    team: [...STARTER_DRAGONS],
    levels: { fire: 1, water: 1, nature: 1 },
    kills: 0,
    bossWins: 0,
    zoneKills: 0,
    upgrades: 0,
    paused: false,
    pendingBoss: false,
    claimedBoss: {},
    achievements: {},
    selectedDragon: 'fire',
    daily: { date: '', progress: {}, claimed: {} },
    lastSeen: now,
    goldRate: 2,
    meter: 0
  };
}

export function freshState(now = Date.now()): GameState {
  return {
    gold: 0, run: 0, life: 0, taps: 0, embers: 0, eAll: 0, ranks: 0, rk: 0, stars: 0, asc: 0, claw: 0,
    u: {}, tal: {}, ach: {}, v: 0, vu: {},
    boss: 0, bossHp: 0, bossKills: 0, bossAttackAt: 0, bossTelegraphUntil: 0, bossInterrupts: 0, bossStunUntil: 0, bossWeakenUntil: 0,
    combo: 0, comboAt: 0,
    daily: freshDaily(),
    ascPts: 0, ascTal: { devourer: 0, archmage: 0, eternal: 0, void: 0 },
    skillCd: {}, buffUntil: 0,
    relicShards: 0, relicOwned: [], relicEquip: { weapon: '', focus: '', armor: '' },
    eggsOpened: 0, eggWarm: 0, tuto: 0,
    dragonDex: {}, sanctuaries: {}, secrets: {},
    adventure: null,
    path: '', pathLoy: 0, oaths: 0,
    playMs: 0, evCaught: 0, lastExport: 0,
    snd: 1, hap: 1, shake: 1, mus: 1, vol: 70,
    saveVersion: SAVE_VERSION,
    t: now
  };
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Copie superficielle qui ignore les clés capables de polluer les prototypes. */
function cleanRecord(value: unknown): Record<string, any> {
  const out: Record<string, any> = {};
  if (!isRecord(value)) return out;
  for (const k of Object.keys(value)) if (!FORBIDDEN_KEYS.has(k)) out[k] = value[k];
  return out;
}

export class SaveValidationError extends Error {}

function numberMap(value: unknown, label: string, integer: boolean, strict: boolean): Record<string, number> {
  if (!isRecord(value)) {
    if (strict) throw new SaveValidationError('Carte invalide : ' + label);
    return {};
  }
  const out: Record<string, number> = {};
  for (const k of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    const raw = value[k];
    if (strict && (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0)) throw new SaveValidationError('Valeur invalide : ' + label + '.' + k);
    let n = Number(raw);
    if (!Number.isFinite(n) || n < 0) n = 0;
    n = Math.min(MAX_GAME_VALUE, n);
    out[k] = integer ? Math.floor(n) : n;
  }
  return out;
}

const NUMERIC_KEYS = ['gold', 'run', 'life', 'taps', 'embers', 'eAll', 'ranks', 'rk', 'stars', 'asc', 'claw', 'boss', 'bossHp', 'bossKills', 'bossAttackAt', 'bossTelegraphUntil', 'bossInterrupts', 'bossStunUntil', 'bossWeakenUntil', 'combo', 'comboAt', 'ascPts', 'buffUntil', 'relicShards', 'eggWarm', 'eggsOpened', 'tuto', 't', 'snd', 'hap', 'shake', 'mus', 'vol', 'v', 'playMs', 'evCaught', 'lastExport', 'oaths', 'pathLoy'] as const;
const FLOAT_KEYS = new Set(['gold', 'run', 'life', 'bossHp', 'relicShards', 'eggWarm', 't']);
const BOUNDS: Partial<Record<string, number>> = { eggWarm: 1, vol: 100, snd: 1, hap: 1, shake: 1, mus: 1, v: 6 };
const PATHS: AscPathId[] = ['devourer', 'archmage', 'eternal', 'void'];

function normalizeDaily(value: unknown, strict: boolean, withDefaults: boolean): DailyState {
  const src = isRecord(value) ? cleanRecord(value) : {};
  const progressDefaults: Record<string, number> = withDefaults ? { taps: 0, boss: 0, buys: 0 } : {};
  if (strict && src.progress !== undefined && !isRecord(src.progress)) throw new SaveValidationError('Progression quotidienne invalide');
  if (strict && src.claimed !== undefined && !isRecord(src.claimed)) throw new SaveValidationError('Récompenses quotidiennes invalides');
  return {
    date: typeof src.date === 'string' ? src.date : '',
    progress: { ...progressDefaults, ...numberMap(src.progress ?? {}, 'progression quotidienne', true, strict) },
    claimed: cleanRecord(src.claimed)
  };
}

function normalizeAdventure(value: unknown, strict: boolean): AdventureState | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) {
    if (strict) throw new SaveValidationError('Progression d’aventure invalide');
    return null;
  }
  const defaults = freshAdventure();
  const a: AdventureState = { ...defaults, ...cleanRecord(value) } as AdventureState;
  for (const k of ['gold', 'crystals', 'fragments', 'materials', 'chapter', 'zone', 'unlocked', 'kills', 'bossWins', 'zoneKills', 'upgrades', 'lastSeen', 'goldRate', 'meter'] as const) {
    const n = Number(a[k]);
    a[k] = Number.isFinite(n) && n >= 0 ? Math.min(MAX_GAME_VALUE, n) : defaults[k];
  }
  // Ancien nom du compteur interne.
  const legacyMeter = Number((value as Record<string, unknown>)._meter);
  if (!('meter' in value) && Number.isFinite(legacyMeter)) a.meter = legacyMeter;
  for (const k of ['owned', 'team'] as const) {
    const list = Array.isArray(a[k]) ? a[k] : defaults[k];
    a[k] = list.filter((x): x is string => typeof x === 'string' && x.length <= 80);
  }
  a.levels = numberMap(a.levels ?? {}, 'niveaux d’aventure', true, strict && isRecord(a.levels));
  a.claimedBoss = cleanRecord(a.claimedBoss);
  a.achievements = cleanRecord(a.achievements);
  a.daily = normalizeDaily(a.daily, strict, false);
  a.paused = !!a.paused;
  a.pendingBoss = !!a.pendingBoss;
  if (typeof a.selectedDragon !== 'string') a.selectedDragon = 'fire';
  delete (a as unknown as Record<string, unknown>)._meter;
  delete (a as unknown as Record<string, unknown>).obsidianTestUnlock;
  return a;
}

/**
 * Valide et borne une sauvegarde (chargement local ou import de fichier).
 * En mode strict, toute valeur invalide lève une erreur au lieu d'être corrigée.
 */
export function normalizeSaveData(input: unknown, strict = false, now = Date.now()): GameState {
  if (!isRecord(input)) throw new SaveValidationError('La sauvegarde doit être un objet JSON.');
  const state = freshState(now) as unknown as Record<string, any>;
  const src = cleanRecord(input);

  for (const k of NUMERIC_KEYS) {
    if (!(k in src)) continue;
    const raw = src[k];
    if (strict && (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0)) throw new SaveValidationError('Valeur numérique invalide : ' + k);
    let n = Number(raw);
    if (!Number.isFinite(n) || n < 0) n = 0;
    n = Math.min(MAX_GAME_VALUE, n);
    if (!FLOAT_KEYS.has(k)) n = Math.floor(n);
    const bound = BOUNDS[k];
    if (bound !== undefined) n = Math.min(bound, n);
    state[k] = n;
  }

  for (const k of ['u', 'tal', 'ach', 'vu', 'ascTal', 'skillCd', 'dragonDex', 'sanctuaries', 'secrets']) {
    if (src[k] !== undefined && !isRecord(src[k]) && strict) throw new SaveValidationError('Structure invalide : ' + k);
  }
  state.u = numberMap(src.u ?? {}, 'améliorations', true, strict);
  state.tal = numberMap(src.tal ?? {}, 'talents', true, strict);
  state.ascTal = { devourer: 0, archmage: 0, eternal: 0, void: 0, ...numberMap(src.ascTal ?? {}, 'talents de transcendance', true, strict) };
  state.skillCd = numberMap(src.skillCd ?? {}, 'temps de recharge', false, strict);
  state.dragonDex = numberMap(src.dragonDex ?? {}, 'codex des dragons', true, strict);
  state.ach = cleanRecord(src.ach);
  state.vu = cleanRecord(src.vu);
  state.sanctuaries = cleanRecord(src.sanctuaries);
  state.secrets = cleanRecord(src.secrets);

  if (src.daily !== undefined && !isRecord(src.daily) && strict) throw new SaveValidationError('Contrats quotidiens invalides');
  state.daily = normalizeDaily(src.daily, strict, true);

  if (src.relicOwned !== undefined && !Array.isArray(src.relicOwned) && strict) throw new SaveValidationError('Collection de reliques invalide');
  const owned: unknown[] = Array.isArray(src.relicOwned) ? src.relicOwned : [];
  state.relicOwned = [...new Set(owned.filter((x): x is string => typeof x === 'string' && x.length <= 100))];

  if (src.relicEquip !== undefined && !isRecord(src.relicEquip) && strict) throw new SaveValidationError('Équipement de reliques invalide');
  const equip = cleanRecord(src.relicEquip);
  state.relicEquip = {
    weapon: typeof equip.weapon === 'string' ? equip.weapon : '',
    focus: typeof equip.focus === 'string' ? equip.focus : '',
    armor: typeof equip.armor === 'string' ? equip.armor : ''
  };

  state.adventure = normalizeAdventure(src.adventure, strict);
  state.path = PATHS.includes(src.path) ? src.path : '';

  const sv = Number(src.saveVersion);
  state.saveVersion = Number.isFinite(sv) && sv >= 1 ? Math.floor(sv) : SAVE_VERSION;
  if (!(Number(state.t) > 0)) state.t = now;
  return state as GameState;
}
