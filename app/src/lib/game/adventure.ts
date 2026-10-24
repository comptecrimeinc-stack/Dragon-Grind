import { CHAPTERS, DRAGONS, ENEMIES, ENEMY_ICONS, STARTER_DRAGONS, ZONE_COUNT, ZONE_KILLS_FOR_BOSS } from './constants';
import { localDate } from './daily';
import { formatAdventure as fmt } from './format';
import type { Fx } from './fx';
import { freshAdventure, type AdventureState, type GameState } from './state';

/**
 * Renvoie l'aventure du joueur en la créant si besoin et en corrigeant ses invariants :
 * dragons de départ toujours possédés, équipe de trois dragons possédés, zone bornée.
 */
export function ensureAdventure(S: GameState, obsidianPurchased = false, now = Date.now()): AdventureState {
  if (!S.adventure) S.adventure = freshAdventure(now);
  const a = S.adventure;
  a.chapter = Math.max(0, Math.min(5, Math.floor(a.chapter || 0)));
  a.zone = Math.max(0, Math.min(ZONE_COUNT - 1, Math.floor(a.zone || 0)));
  a.unlocked = Math.max(1, Math.min(ZONE_COUNT, Math.floor(a.unlocked || 1)));
  a.owned = a.owned.filter((id) => DRAGONS.some((d) => d.id === id));
  for (const id of STARTER_DRAGONS) if (!a.owned.includes(id)) a.owned.push(id);
  a.team = a.team.slice(0, 3);
  while (a.team.length < 3) a.team.push(a.owned[a.team.length] || a.owned[0]);
  a.team = a.team.map((id, i) => (a.owned.includes(id) ? id : a.owned[i] || a.owned[0]));
  if (obsidianPurchased) grantObsidian(a);
  return a;
}

export function grantObsidian(a: AdventureState): void {
  if (!a.owned.includes('obsidian')) a.owned.push('obsidian');
  a.levels.obsidian = Math.max(1, a.levels.obsidian || 1);
  a.obsidianPurchasedUnlock = true;
}

export const dragonLevel = (a: AdventureState, id: string): number => a.levels[id] || 1;
export const dragonPower = (a: AdventureState, id: string): number => {
  const d = DRAGONS.find((x) => x.id === id) || DRAGONS[0];
  return d.power * (1 + 0.22 * (dragonLevel(a, id) - 1));
};

/** Puissance d'équipe, avec bonus de composition (attaque, garde, soutien). */
export function teamPower(a: AdventureState): number {
  const raw = a.team.reduce((sum, id) => sum + dragonPower(a, id), 0);
  const has = (ids: string[]) => a.team.some((id) => ids.includes(id));
  return raw * (has(['fire', 'storm', 'solar']) ? 1.06 : 1) * (has(['water', 'ice']) ? 1.05 : 1) * (has(['nature', 'shadow']) ? 1.08 : 1);
}

export const goldRate = (a: AdventureState): number => Math.max(1, (a.zone + 1) * 1.5 + teamPower(a) * 0.13);
export const zoneName = (i: number): string => CHAPTERS[Math.floor(i / 3)].zones[i % 3];
export const chapterOf = (zone: number) => CHAPTERS[Math.floor(zone / 3)];
export const enemyName = (zone: number): string => ENEMIES[Math.min(ENEMIES.length - 1, Math.floor(zone / 2))];
export const enemyIcon = (zone: number): string => ENEMY_ICONS[Math.min(7, Math.floor(zone / 2))];
export const upgradeCost = (a: AdventureState): { gold: number; materials: number } => ({
  gold: Math.ceil(80 * Math.pow(1.32, a.upgrades || 0)),
  materials: 2 + Math.floor((a.upgrades || 0) / 3)
});
/** Jauge de dégâts à remplir pour vaincre un ennemi de la zone. */
export const enemyToughness = (zone: number): number => Math.max(12, (zone + 1) * 18);

export function ensureAdventureDaily(a: AdventureState, now: number): void {
  const today = localDate(now);
  if (a.daily.date !== today) a.daily = { date: today, progress: { kills: 0, upgrades: 0, explore: 0, eggs: 0, boss: 0 }, claimed: {} };
}

export function bumpAdventureDaily(a: AdventureState, key: string, now = Date.now()): void {
  ensureAdventureDaily(a, now);
  a.daily.progress[key] = (a.daily.progress[key] || 0) + 1;
}

/** Recrute les dragons dont la zone de déblocage est atteinte. */
export function unlockDragons(a: AdventureState, fx: Fx): void {
  for (const d of DRAGONS) {
    if (!d.purchaseRequired && a.unlocked >= d.unlock + 1 && !a.owned.includes(d.id)) {
      a.owned.push(d.id);
      a.levels[d.id] = 1;
      fx.toast('Nouveau dragon recruté : ' + d.name + ' !');
    }
  }
}

export function winEnemy(a: AdventureState, fx: Fx, now = Date.now(), rng = Math.random): void {
  a.kills++;
  a.zoneKills++;
  a.gold += Math.floor(5 + (a.zone + 1) * 2 + teamPower(a) * 0.22);
  a.materials += rng() < 0.28 ? 1 : 0;
  bumpAdventureDaily(a, 'kills', now);
  if (a.zoneKills < ZONE_KILLS_FOR_BOSS) return;
  a.zoneKills = 0;
  a.pendingBoss = true;
  a.gold += Math.floor(50 * (a.zone + 1));
  if (a.zone + 1 < a.unlocked) a.unlocked = Math.max(a.unlocked, a.zone + 2);
  else if (a.unlocked < ZONE_COUNT) a.unlocked++;
  unlockDragons(a, fx);
  a.chapter = Math.min(5, Math.floor((a.unlocked - 1) / 3));
  if (a.claimedBoss[a.zone]) {
    // Boss déjà vaincu une première fois : petit bonus et le farming continue.
    a.pendingBoss = false;
    a.gold += Math.floor(25 * (a.zone + 1));
  } else fx.toast('Boss de zone vaincu ! Choisis une récompense.');
}

/** Un pas de combat automatique (appelé toutes les 350 ms). */
export function adventureStep(a: AdventureState, fx: Fx, now = Date.now(), rng = Math.random): void {
  ensureAdventureDaily(a, now);
  if (a.paused || a.pendingBoss) return;
  a.meter = (a.meter || 0) + teamPower(a) * 0.35;
  if (a.meter >= enemyToughness(a.zone)) {
    a.meter = 0;
    winEnemy(a, fx, now, rng);
  }
  a.goldRate = goldRate(a);
  a.gold += a.goldRate * 0.35;
}

export function upgradeTeam(a: AdventureState, fx: Fx, now = Date.now()): boolean {
  const cost = upgradeCost(a);
  if (a.gold < cost.gold || a.materials < cost.materials || a.pendingBoss) return false;
  a.gold -= cost.gold;
  a.materials -= cost.materials;
  a.upgrades++;
  for (const id of a.team) a.levels[id] = dragonLevel(a, id) + 1;
  bumpAdventureDaily(a, 'upgrades', now);
  fx.toast('Équipe renforcée !');
  return true;
}

export function selectZone(a: AdventureState, zone: number, now = Date.now()): boolean {
  if (zone < 0 || zone >= a.unlocked) return false;
  a.zone = zone;
  a.chapter = Math.floor(zone / 3);
  a.zoneKills = 0;
  a.paused = false;
  bumpAdventureDaily(a, 'explore', now);
  return true;
}

export function assignTeamSlot(a: AdventureState, slot: number, dragonId: string): boolean {
  if (!a.owned.includes(dragonId) || slot < 0 || slot > 2) return false;
  a.team[slot] = dragonId;
  a.selectedDragon = dragonId;
  return true;
}

export const BOSS_REWARDS = [
  { name: 'Réserve du voyageur', desc: '+ or' },
  { name: 'Fragments ciblés', desc: '+ 20 fragments' },
  { name: 'Matériaux rares', desc: '+ 12 matériaux' }
];

export function claimBossReward(a: AdventureState, choice: number, fx: Fx, now = Date.now()): boolean {
  if (!a.pendingBoss || a.claimedBoss[a.zone]) return false;
  if (choice === 0) a.gold += Math.floor(200 + 50 * a.zone);
  else if (choice === 1) a.fragments += 20;
  else if (choice === 2) a.materials += 12;
  else return false;
  a.claimedBoss[a.zone] = 1;
  a.pendingBoss = false;
  a.bossWins++;
  bumpAdventureDaily(a, 'boss', now);
  fx.toast('Récompense du boss récupérée : ' + BOSS_REWARDS[choice].name);
  return true;
}

export interface AdventureContract {
  id: string;
  name: string;
  desc: string;
  goal: number;
  reward: number;
}

export function adventureContracts(a: AdventureState): AdventureContract[] {
  const r = goldRate(a);
  return [
    { id: 'kills', name: 'Chasse aux créatures', desc: 'Vaincre 12 ennemis', goal: 12, reward: Math.max(50, Math.floor(r * 60)) },
    { id: 'upgrades', name: 'Entraînement', desc: 'Améliorer l’équipe 1 fois', goal: 1, reward: Math.max(40, Math.floor(r * 45)) },
    { id: 'explore', name: 'Cartographe', desc: 'Visiter une autre zone', goal: 1, reward: Math.max(40, Math.floor(r * 45)) },
    { id: 'eggs', name: 'Curiosité draconique', desc: 'Faire éclore un œuf dans la forge', goal: 1, reward: Math.max(40, Math.floor(r * 45)) },
    { id: 'boss', name: 'Chasseur de boss', desc: 'Vaincre un boss', goal: 1, reward: Math.max(80, Math.floor(r * 90)) }
  ];
}

export const adventureDailyBonus = (a: AdventureState): number => Math.max(100, Math.floor(goldRate(a) * 90));

export function claimAdventureContract(a: AdventureState, id: string, fx: Fx, now = Date.now()): boolean {
  ensureAdventureDaily(a, now);
  const q = adventureContracts(a).find((c) => c.id === id);
  if (!q || a.daily.claimed[id] || (a.daily.progress[id] || 0) < q.goal) return false;
  a.gold += q.reward;
  a.daily.claimed[id] = 1;
  fx.toast('Contrat accompli : +' + fmt(q.reward) + ' or');
  const claimedCount = adventureContracts(a).filter((c) => a.daily.claimed[c.id]).length;
  if (claimedCount >= 4 && !a.daily.claimed.bonus) {
    a.daily.claimed.bonus = 1;
    const bonus = adventureDailyBonus(a);
    a.gold += bonus;
    fx.toast('Bonus 4/5 récupéré : +' + fmt(bonus) + ' or');
  }
  return true;
}

/** Vue des contrats d'aventure, sans modifier l'état (les jours écoulés comptent pour zéro). */
export function adventureDailyView(a: AdventureState, now = Date.now()) {
  const current = a.daily.date === localDate(now);
  return adventureContracts(a).map((q) => ({
    ...q,
    progress: current ? Math.min(q.goal, a.daily.progress[q.id] || 0) : 0,
    claimed: current && !!a.daily.claimed[q.id]
  }));
}

export const ADVENTURE_ACHIEVEMENTS = [
  { id: 'first', name: 'Premier pas', desc: 'Vaincre ton premier ennemi', ok: (a: AdventureState) => a.kills >= 1, reward: 'Titre : Éclaireur' },
  { id: 'chapter1', name: 'Explorateur', desc: 'Débloquer 3 zones', ok: (a: AdventureState) => a.unlocked >= 3, reward: 'Couronne : braise (rang I)' },
  { id: 'team3', name: 'Trio lié', desc: 'Améliorer l’équipe 3 fois', ok: (a: AdventureState) => a.upgrades >= 3, reward: 'Effet : braises' },
  { id: 'boss5', name: 'Briseur de sceaux', desc: 'Vaincre 5 boss', ok: (a: AdventureState) => a.bossWins >= 5, reward: 'Titre : Briseur de sceaux' },
  { id: 'chapters', name: 'Voyageur des six terres', desc: 'Atteindre le chapitre VI', ok: (a: AdventureState) => a.chapter >= 5, reward: 'Couronne draconique (rang V)' },
  { id: 'collection', name: 'Lien draconique', desc: 'Réunir les 7 dragons', ok: (a: AdventureState) => a.owned.length >= 7, reward: 'Aura : constellation' }
];

export function checkAdventureAchievements(a: AdventureState): void {
  for (const x of ADVENTURE_ACHIEVEMENTS) if (!a.achievements[x.id] && x.ok(a)) a.achievements[x.id] = 1;
}

/** Gains hors ligne de l'aventure : or et matériaux communs, plafonnés à 8 h. */
export function applyAdventureOffline(a: AdventureState, now = Date.now()): { gold: number; materials: number } {
  const prev = a.lastSeen || now;
  const elapsed = Math.max(0, Math.min(8 * 3600, (now - prev) / 1000));
  a.lastSeen = now;
  a.goldRate = goldRate(a);
  if (elapsed <= 30) return { gold: 0, materials: 0 };
  const gold = Math.floor(goldRate(a) * elapsed * 0.6);
  const materials = Math.floor(elapsed / 1800);
  a.gold += gold;
  a.materials += materials;
  return { gold, materials };
}
