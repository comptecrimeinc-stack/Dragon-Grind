import { SoundBoard } from '#lib/audio/sound.ts';
import * as adventure from '#lib/game/adventure.ts';
import { useSkill } from '#lib/game/combat.ts';
import * as collection from '#lib/game/collection.ts';
import { claimContract } from '#lib/game/daily.ts';
import { DRAGONS, FRAMES, LANGUAGES, STAGES, SYSTEM_UNLOCKS, TABS, type AscPathId, type ContractId, type Lang, type SkillId, type TabId } from '#lib/game/constants.ts';
import { applyOfflineProgress, breathe, TapLimiter, tick } from '#lib/game/engine.ts';
import { stageIndex } from '#lib/game/economy.ts';
import { formatAdventure } from '#lib/game/format.ts';
import * as forge from '#lib/game/forge.ts';
import type { Fx, SoundName } from '#lib/game/fx.ts';
import { dedupeHeroes, localRank, rivalJustPassed, upsertHero, type Hero, type PlayerScore } from '#lib/game/leaderboard.ts';
import { isImportantToast, toastTargetTab } from '#lib/game/notifications.ts';
import { checkProfileName, framesUnlocked, isFrameId, type Profile } from '#lib/game/profile.ts';
import { heraldryAchievementCount, selectLineage, tabUnlocked } from '#lib/game/progression.ts';
import { freshState, type AdventureState, type GameState } from '#lib/game/state.ts';
import { i18n, isLang } from '#lib/i18n/i18n.svelte.ts';
import { LeaderboardApi } from '#lib/services/leaderboardApi.ts';
import * as persistence from '#lib/services/persistence.ts';
import { KEYS, readJson, readRaw, writeJson, writeRaw } from '#lib/services/storage.ts';

export interface Toast {
  id: number;
  message: string;
  important: boolean;
}

export interface Surprise {
  id: number;
  kind: collection.SurpriseKind;
  left: number;
  top: number;
  leaving: boolean;
}

export interface Cosmetics {
  owned: string[];
  equipped: string[];
  purchased: string[];
}

export interface Settings {
  logo: boolean;
  motion: boolean;
  quality: 'auto' | 'high' | 'low';
}

export interface OfflineSummary {
  seconds: number;
  earned: number;
}

const PAID_IDS = ['obsidian-skin', 'founder-badge'];
const RETIRED_COSMETICS = ['solar-trail'];

function loadCosmetics(): Cosmetics {
  const raw = readJson<Partial<Cosmetics> & { equipped?: string[] | string }>(KEYS.cosmetics, {});
  const list = (x: unknown): string[] => (Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === 'string' && !RETIRED_COSMETICS.includes(v)))] : []);
  const purchased = list(raw.purchased);
  // Un objet payant n'est possédé que s'il a été « acheté » (déblocage hors ligne).
  const legit = (id: string) => !PAID_IDS.includes(id) || purchased.includes(id);
  const owned = [...new Set([...list(raw.owned), ...purchased])].filter(legit);
  const equipped = list(typeof raw.equipped === 'string' ? [raw.equipped] : raw.equipped).filter((id) => owned.includes(id));
  return { owned, equipped, purchased };
}

function loadProfile(): Profile | null {
  const p = readJson<Partial<Profile> | null>(KEYS.profile, null) ?? readJson<Partial<Profile> | null>(KEYS.profile, null, 'session');
  if (!p || typeof p.name !== 'string' || !p.name) return null;
  // L'ancien jeu gardait aussi le dragon et le cadre dans une clé « héraldique » séparée.
  const h = readJson<{ dragon?: string; frame?: string }>(KEYS.heraldry, {});
  const dragon = DRAGONS.some((d) => d.id === h.dragon) ? h.dragon! : DRAGONS.some((d) => d.id === p.dragon) ? p.dragon! : 'fire';
  const frame = isFrameId(h.frame) ? h.frame : isFrameId(p.frame) ? p.frame : 'cw1';
  return { name: p.name, dragon, frame, createdAt: p.createdAt };
}

function loadSettings(): Settings {
  const s = readJson<Partial<Settings>>(KEYS.settings, {});
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quality = readRaw(KEYS.quality);
  return {
    logo: s.logo !== false,
    motion: typeof s.motion === 'boolean' ? s.motion : reduced,
    quality: quality === 'high' || quality === 'low' ? quality : 'auto'
  };
}

/**
 * État de l'application : la partie (`S`, profonde et réactive), le profil, la boutique
 * et l'interface. Les règles du jeu vivent dans `lib/game` ; ce magasin les appelle,
 * sauvegarde, et traduit leurs effets (annonces, sons) pour l'interface.
 */
export class Game {
  S = $state<GameState>(freshState());
  now = $state(Date.now());
  profile = $state<Profile | null>(null);
  cosmetics = $state<Cosmetics>({ owned: [], equipped: [], purchased: [] });
  settings = $state<Settings>({ logo: true, motion: false, quality: 'auto' });
  heroes = $state<Hero[]>([]);
  languageChosen = $state(false);

  activeTab = $state<TabId>('combat');
  noticeTabs = $state<TabId[]>([]);
  toasts = $state<Toast[]>([]);
  currentToast = $state<Toast | null>(null);
  offline = $state<OfflineSummary | null>(null);
  surprise = $state<Surprise | null>(null);
  settingsOpen = $state(false);
  profileCard = $state<{ kind: 'me' | 'hero' | 'npc' | 'world'; name: string; dragon: string } | null>(null);
  saveStatus = $state('');
  evolveBurst = $state(0);
  autosaveOn = $state(true);

  readonly sound = new SoundBoard(() => ({
    sound: this.S.snd !== 0,
    music: this.S.mus !== 0,
    haptics: this.S.hap !== 0,
    volume: this.S.vol
  }));
  readonly leaderboard = new LeaderboardApi();

  private limiter = new TapLimiter();
  private timers: ReturnType<typeof setInterval>[] = [];
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastSeq = 0;
  private lastStage = -1;
  private lastRank = 0;
  private hiddenSince = 0;
  private saveFailing = false;
  private rateNoticeAt = 0;
  private nextSurpriseAt = 0;
  private lastAutoSubmit = 0;
  private seenTabs = new Set<TabId>();

  readonly fx: Fx = {
    toast: (message) => this.toast(message),
    sound: (name: SoundName) => {
      this.sound.play(name);
      if (name === 'shock' && this.S.shake !== 0) this.shakeScreen();
    }
  };

  /** Secousse d'écran quand une attaque de titan touche (désactivable). */
  private shakeScreen(): void {
    const b = document.body;
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
    setTimeout(() => b.classList.remove('shake'), 500);
  }

  /** Annonces en attente pendant le chargement (la file s'ouvre au démarrage). */
  private pending: string[] = [];

  // ——— Démarrage ———

  load(now = Date.now()): void {
    const result = persistence.loadGame(now);
    this.S = result.state;
    this.pending.push(...result.notices);
    this.profile = loadProfile();
    this.cosmetics = loadCosmetics();
    this.settings = loadSettings();
    this.heroes = dedupeHeroes(readJson(KEYS.heroes, []));
    this.autosaveOn = persistence.autosaveEnabled();
    this.languageChosen = !!this.profile || readRaw(KEYS.languageChosen, 'session') === '1';
    const tab = readRaw(KEYS.activeTab);
    if (TABS.some((t) => t.id === tab)) this.activeTab = tab as TabId;

    const a = adventure.ensureAdventure(this.S, this.cosmetics.purchased.includes('obsidian-skin'), now);
    const advOffline = adventure.applyAdventureOffline(a, now);
    if (advOffline.gold > 0) this.pending.push('Aventure hors ligne : +' + formatAdventure(advOffline.gold) + ' or et matériaux communs · maximum 8 h');

    const offline = applyOfflineProgress(this.S, result.offlineSeconds);
    if (offline.earned > 0) this.offline = offline;

    this.lastStage = stageIndex(this.S);
    for (const t of TABS) if (tabUnlocked(this.S, t.id)) this.seenTabs.add(t.id);
    if (!tabUnlocked(this.S, this.activeTab)) this.activeTab = 'combat';
    this.nextSurpriseAt = now + (240 + Math.random() * 360) * 1000;
    this.save(now);
  }

  async applyLanguage(): Promise<void> {
    const lang = readRaw(KEYS.language);
    await i18n.setLang(isLang(lang) ? lang : 'fr');
  }

  /** Lance les boucles du jeu. Renvoie la fonction d'arrêt. */
  start(): () => void {
    const every = (ms: number, fn: () => void) => this.timers.push(setInterval(() => !document.hidden && fn(), ms));
    every(100, () => this.step());
    every(5000, () => this.save());
    every(350, () => this.adventureStep());
    every(30000, () => persistence.createSnapshot(this.S, 'auto', false));
    every(2000, () => this.maybeSpawnSurprise());
    every(1000, () => this.checkRank());
    const onVisibility = () => this.onVisibilityChange();
    const onHide = () => this.save();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    for (const m of this.pending.splice(0)) this.toast(m);
    return () => {
      this.timers.forEach(clearInterval);
      this.timers = [];
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      this.sound.stopMusic();
    };
  }

  private step(now = Date.now()): void {
    this.now = now;
    tick(this.S, this.fx, now);
    const stage = stageIndex(this.S);
    if (stage > this.lastStage && this.lastStage >= 0) {
      this.sound.play('evolve');
      this.toast('Votre dragon grandit : ' + STAGES[stage].name + ' !');
      this.evolveBurst++;
    }
    this.lastStage = stage;
    for (const t of TABS) {
      if (this.seenTabs.has(t.id) || !tabUnlocked(this.S, t.id)) continue;
      this.seenTabs.add(t.id);
      const msg = SYSTEM_UNLOCKS.find((u) => u.tab === t.id)?.msg;
      if (msg) this.toast(msg);
    }
    if (this.S.tuto !== 1 && this.S.taps >= 1) this.S.tuto = 1;
  }

  private adventureStep(now = Date.now()): void {
    const a = adventure.ensureAdventure(this.S, this.cosmetics.purchased.includes('obsidian-skin'), now);
    adventure.adventureStep(a, this.fx, now);
    adventure.checkAdventureAchievements(a);
    a.lastSeen = now;
  }

  private onVisibilityChange(now = Date.now()): void {
    if (document.hidden) {
      this.hiddenSince = now;
      this.save(now);
      persistence.createSnapshot(this.S, 'auto', false, now);
      return;
    }
    if (!this.hiddenSince) return;
    const away = (now - this.hiddenSince) / 1000;
    this.hiddenSince = 0;
    this.S.t = now;
    const offline = applyOfflineProgress(this.S, away);
    if (offline.earned > 0) this.offline = offline;
    this.save(now);
  }

  // ——— Sauvegarde ———

  save(now = Date.now()): boolean {
    const ok = persistence.saveGame(this.S, document.hidden && this.hiddenSince ? this.hiddenSince : now);
    if (!ok && !this.saveFailing) {
      persistence.recordSecurityEvent('Échec de sauvegarde locale : erreur de stockage', now);
      this.saveStatus = persistence.HEALTH_TEXT.failed;
    } else if (ok && this.saveFailing) {
      this.saveStatus = persistence.HEALTH_TEXT.recovered;
    }
    this.saveFailing = !ok;
    return ok;
  }

  // ——— Annonces ———

  toast(message: string): void {
    if (!message.trim()) return;
    const target = toastTargetTab(message);
    if (target && target !== this.activeTab && !this.noticeTabs.includes(target)) this.noticeTabs.push(target);
    this.toasts.push({ id: ++this.toastSeq, message, important: isImportantToast(message) });
    if (!this.currentToast && !this.offline) this.showNextToast();
  }

  private showNextToast(): void {
    const next = this.toasts.shift() ?? null;
    this.currentToast = next;
    if (!next) return;
    this.toastTimer = setTimeout(() => {
      this.currentToast = null;
      this.toastTimer = setTimeout(() => this.showNextToast(), 280);
    }, next.important ? 7000 : 3200);
  }

  closeOffline(): void {
    this.offline = null;
    if (!this.currentToast) this.showNextToast();
  }

  // ——— Navigation ———

  openTab(tab: TabId): void {
    if (!tabUnlocked(this.S, tab)) tab = 'combat';
    this.activeTab = tab;
    this.noticeTabs = this.noticeTabs.filter((t) => t !== tab);
    this.profileCard = null;
    writeRaw(KEYS.activeTab, tab);
  }

  // ——— Actions de jeu ———

  /** Souffle sur le dragon ; renvoie le mana gagné, ou null si la cadence est dépassée. */
  tap(now = Date.now()): number | null {
    if (!this.limiter.allow(now)) {
      if (now - this.rateNoticeAt > 10000) {
        this.rateNoticeAt = now;
        this.toast('Rythme de clic limité pour préserver l’équilibre du jeu.');
      }
      return null;
    }
    this.sound.startMusic();
    return breathe(this.S, this.fx, now);
  }

  private act(done: boolean): boolean {
    if (done) this.save();
    return done;
  }

  buyItem = (id: string, mode: forge.BuyQuantity) => this.act(forge.buyItem(this.S, id, mode, this.fx));
  buyTalent = (id: string) => this.act(forge.buyTalent(this.S, id));
  relic = (id: string) => this.act(forge.forgeOrEquipRelic(this.S, id, this.fx));
  rebirth = () => this.act(forge.rebirth(this.S, this.fx));
  ascend = () => this.act(forge.ascend(this.S, this.fx));
  buyAscPath = (id: AscPathId) => this.act(forge.buyAscPath(this.S, id, this.fx));
  swearOath = (id: AscPathId) => this.act(forge.swearOath(this.S, id, this.fx));
  useSkill = (id: SkillId) => this.act(useSkill(this.S, id, this.fx));
  claimContract = (id: ContractId) => this.act(claimContract(this.S, id, this.fx));
  selectLineage = (i: number) => this.act(selectLineage(this.S, i, this.fx));
  startIncubation = () => this.act(collection.startIncubation(this.S, this.fx));
  warmEgg = () => {
    collection.warmEgg(this.S, this.fx);
    this.save();
  };
  restoreSanctuary = (id: string) => this.act(collection.restoreSanctuary(this.S, id, this.fx));
  revealSecret = (id: string) => this.act(collection.revealSecret(this.S, id, this.fx));
  dismissTutorial = () => {
    this.S.tuto = 1;
    this.save();
  };

  /** Efface la progression (bouton « Effacer la sauvegarde » de la Chasse). */
  resetGame(): void {
    persistence.createSnapshot(this.S, 'avant', true);
    this.S = freshState();
    adventure.ensureAdventure(this.S, this.cosmetics.purchased.includes('obsidian-skin'));
    this.lastStage = 0;
    this.save();
    this.toast('Partie réinitialisée');
  }

  /** Aventure du joueur, garantie par `load` et la boucle d'aventure (lecture sans effet de bord). */
  get adventureState(): AdventureState {
    return this.S.adventure ?? adventure.ensureAdventure(this.S);
  }

  advPause = () => {
    this.adventureState.paused = !this.adventureState.paused;
    this.save();
  };
  advUpgrade = () => this.act(adventure.upgradeTeam(this.adventureState, this.fx));
  advZone = (zone: number) => this.act(adventure.selectZone(this.adventureState, zone));
  advBossReward = (choice: number) => this.act(adventure.claimBossReward(this.adventureState, choice, this.fx));
  advContract = (id: string) => this.act(adventure.claimAdventureContract(this.adventureState, id, this.fx));
  advAssign = (slot: number, dragonId: string) => {
    if (!adventure.assignTeamSlot(this.adventureState, slot, dragonId)) return;
    this.setHeraldry(dragonId, this.profile?.frame ?? 'cw1');
    this.save();
  };

  // ——— Surprises de la forge ———

  private maybeSpawnSurprise(now = Date.now()): void {
    if (this.surprise || now < this.nextSurpriseAt) return;
    this.nextSurpriseAt = now + (300 + Math.random() * 420) * 1000;
    if ((this.S.taps || 0) <= 3) return;
    const surprise: Surprise = { id: now, kind: collection.rollSurprise(), left: 12 + Math.random() * 66, top: 16 + Math.random() * 56, leaving: false };
    this.surprise = surprise;
    setTimeout(() => {
      if (this.surprise?.id !== surprise.id) return;
      this.surprise.leaving = true;
      setTimeout(() => {
        if (this.surprise?.id === surprise.id) this.surprise = null;
      }, 700);
    }, 22000);
  }

  catchSurprise(): void {
    if (!this.surprise) return;
    collection.collectSurprise(this.S, this.surprise.kind, this.fx);
    this.surprise = null;
    this.save();
  }

  // ——— Paramètres ———

  setAudio(patch: Partial<Pick<GameState, 'snd' | 'hap' | 'shake' | 'mus' | 'vol'>>): void {
    Object.assign(this.S, patch);
    if (patch.mus === 0) this.sound.stopMusic();
    if (patch.mus === 1) this.sound.startMusic();
    this.save();
  }

  setSettings(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    writeJson(KEYS.settings, { logo: this.settings.logo, motion: this.settings.motion });
    writeRaw(KEYS.quality, this.settings.quality);
  }

  async setLanguage(lang: Lang, chosen = true): Promise<void> {
    writeRaw(KEYS.language, lang);
    if (chosen) {
      writeRaw(KEYS.languageChosen, '1', 'session');
      this.languageChosen = true;
    }
    await i18n.setLang(lang);
  }

  get languages() {
    return LANGUAGES;
  }

  setAutosave(on: boolean): void {
    persistence.setAutosaveEnabled(on);
    this.autosaveOn = on;
  }

  // ——— Profil et héraldique ———

  createProfile(name: string, dragon: string): ReturnType<typeof checkProfileName> {
    const check = checkProfileName(name);
    if (!check.ok) return check;
    this.profile = { name: check.name, dragon, frame: 'cw1', createdAt: Date.now() };
    this.persistProfile();
    this.syncHero();
    void this.submitScore(true);
    return check;
  }

  private persistProfile(): void {
    if (!this.profile) return;
    writeJson(KEYS.profile, this.profile) || writeJson(KEYS.profile, this.profile, 'session');
    writeJson(KEYS.heraldry, { name: this.profile.name, dragon: this.profile.dragon, frame: this.profile.frame });
  }

  get achievementCounts() {
    return heraldryAchievementCount(this.S);
  }

  dragonUnlocked(id: string): boolean {
    const d = DRAGONS.find((x) => x.id === id);
    if (!d) return false;
    if (d.unlock === 0) return true;
    if (d.id === 'obsidian') return this.cosmetics.purchased.includes('obsidian-skin');
    const a = this.S.adventure;
    return !!a && (a.unlocked > d.unlock || a.owned.includes(d.id));
  }

  setHeraldry(dragon: string, frame: string): void {
    if (!this.profile) return;
    if (!this.dragonUnlocked(dragon)) {
      const d = DRAGONS.find((x) => x.id === dragon);
      this.toast('🐉 ' + (d?.name ?? 'Ce dragon') + ' est verrouillé. Continue ta progression pour le débloquer !');
      return;
    }
    const unlocked = framesUnlocked(this.achievementCounts.total);
    const f = unlocked.find((x) => x.id === frame) ?? unlocked[unlocked.length - 1] ?? FRAMES[0];
    this.profile = { ...this.profile, dragon, frame: f.id };
    this.persistProfile();
    this.syncHero();
  }

  get score(): PlayerScore {
    return {
      name: this.profile?.name ?? 'Maître de la Forge',
      dragon: this.profile?.dragon ?? 'fire',
      frame: this.profile?.frame ?? 'cw1',
      life: this.S.life || 0,
      kills: this.S.bossKills || 0,
      rk: this.S.rk || 0,
      asc: this.S.asc || 0
    };
  }

  syncHero(): void {
    if (!this.profile) return;
    this.heroes = upsertHero(this.heroes, this.score);
    writeJson(KEYS.heroes, this.heroes) || writeJson(KEYS.heroes, this.heroes, 'session');
  }

  private checkRank(): void {
    if (!this.profile) return;
    const rank = localRank(this.S.life, this.heroes, this.profile.name);
    if (this.lastRank && rank < this.lastRank) {
      const passed = rivalJustPassed(this.S.life);
      if (passed) {
        this.sound.play('pass');
        this.toast('Classement : ' + this.profile.name + ' dépasse ' + passed.name + ' ! Rang ' + rank + ' 🏆');
      }
      this.syncHero();
    }
    this.lastRank = rank;
    if (Date.now() - this.lastAutoSubmit > 120000 && (this.S.life > 100 || this.S.bossKills > 0 || this.S.rk > 0)) {
      this.lastAutoSubmit = Date.now();
      void this.submitScore(true);
    }
  }

  async submitScore(silent: boolean): Promise<{ rank?: number; total?: number } | null> {
    if (!this.profile) {
      if (!silent) this.toast('Crée un profil avant de publier ton score.');
      return null;
    }
    try {
      const r = await this.leaderboard.submit(this.score, !silent);
      if (!silent) this.toast('Score publié · Rang mondial #' + (r.rank ?? '?') + ' / ' + (r.total ?? '?'));
      return r;
    } catch {
      if (!silent) this.toast('Publication mondiale échouée');
      return null;
    }
  }

  // ——— Boutique ———

  private persistCosmetics(): void {
    if (!writeJson(KEYS.cosmetics, this.cosmetics)) this.toast('Impossible d’enregistrer ici. Exporte aussi ta sauvegarde de jeu.');
  }

  /** Débloque (et équipe) un cosmétique, ou bascule son équipement s'il est déjà possédé. */
  toggleCosmetic(id: string): string {
    const c = this.cosmetics;
    if (!c.owned.includes(id)) {
      if (PAID_IDS.includes(id) && !c.purchased.includes(id)) c.purchased.push(id);
      c.owned.push(id);
      if (!c.equipped.includes(id)) c.equipped.push(id);
      if (id === 'obsidian-skin') {
        adventure.grantObsidian(this.adventureState);
        this.toast('Dragon Obsidienne ajouté à ta collection.');
        this.save();
      }
      this.persistCosmetics();
      return 'unlocked';
    }
    c.equipped = c.equipped.includes(id) ? c.equipped.filter((x) => x !== id) : [...c.equipped, id];
    this.persistCosmetics();
    return c.equipped.includes(id) ? 'equipped' : 'removed';
  }

  isEquipped = (id: string): boolean => this.cosmetics.equipped.includes(id);

  // ——— Sauvegardes ———

  exportSave(): void {
    const ok = this.save();
    const blob = new Blob([JSON.stringify(persistence.exportPayload(this.S), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dragon-grind-sauvegarde.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.S.lastExport = Date.now();
    this.save();
    this.saveStatus = ok ? 'Export créé · conserve ce fichier en lieu sûr.' : persistence.HEALTH_TEXT.failed;
    this.toast('Sauvegarde exportée');
  }

  /** Valide un fichier d'import ; l'application ne se fait qu'après confirmation (`applyImport`). */
  async readImport(file: File): Promise<GameState | null> {
    try {
      if (file.size > persistence.MAX_IMPORT_BYTES) throw new Error('too-large');
      return persistence.parseImport(await file.text());
    } catch {
      this.saveStatus = 'Fichier invalide ou illisible : aucune modification appliquée.';
      this.toast('Import impossible : vérifie le fichier JSON.');
      return null;
    }
  }

  /** Remplace la partie (import, restauration, remise à zéro) après une copie de sécurité. */
  replaceGame(next: GameState, label: persistence.Snapshot['l']): boolean {
    const r = persistence.replaceSave(this.S, next, label);
    if (r !== 'ok') {
      const msg = persistence.HEALTH_TEXT[r === 'backupFail' ? (label === 'restore' ? 'backupFail' : 'importBackupFail') : label === 'restore' ? 'restoreFail' : 'importStoreFail'];
      this.saveStatus = msg;
      this.toast(msg);
      return false;
    }
    this.load();
    return true;
  }

  restoreSnapshot(snap: persistence.Snapshot): boolean {
    try {
      return this.replaceGame(persistence.parseImport(snap.d), 'restore');
    } catch {
      this.saveStatus = 'Cette copie est illisible et n’a pas été restaurée.';
      return false;
    }
  }

  manualSnapshot(): void {
    const ok = persistence.createSnapshot(this.S, 'manual', true);
    this.saveStatus = persistence.HEALTH_TEXT[ok ? (this.saveFailing ? 'backupOnly' : 'manual') : 'backupFail'];
  }

  restartFromScratch(): boolean {
    return this.replaceGame(freshState(), 'avant');
  }
}

export const game = new Game();
