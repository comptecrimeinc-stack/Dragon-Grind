// Tables de données du jeu. Aucune logique ici : uniquement les valeurs d'équilibrage
// et les contenus (noms, descriptions) tels qu'affichés en français, langue source.

export const SAVE_KEY = 'dragon-grind-v2';
export const SAVE_VERSION = 7;
export const MAX_GAME_VALUE = 1e300;
export const STAR_BRAISE_THRESHOLD = 5;

export const ITEM_CAP_DEFAULT = 50;
export const CLAW_CAP = 60;
export const TITAN_CAP = 30;
export const REBIRTH_CAP = 20;
export const ASC_CAP = 10;

export const MAX_FORGE_CPS = 12;
export const COMBO_WINDOW_MS = 1200;
export const COMBO_MAX = 25;
export const EGG_TAPS_TO_HATCH = 15;

/** Bonus de production par lignée découverte et par sanctuaire restauré. */
export const DEX_BONUS = 0.012;
export const SANCTUARY_BONUS = 0.03;

export interface Stage {
  name: string;
  threshold: number;
}

/** Stades d'évolution du dragon, atteints selon le mana total récolté. */
export const STAGES: Stage[] = [
  { name: 'Dragonneau', threshold: 0 },
  { name: 'Jeune Dragon', threshold: 1e3 },
  { name: 'Dragon', threshold: 1e5 },
  { name: 'Dragon ailé', threshold: 1e7 },
  { name: 'Dragon ancien', threshold: 1e9 },
  { name: 'Grand dragon d’Europe', threshold: 1e11 }
];

export interface Item {
  id: string;
  name: string;
  /** Coût de base. */
  base: number;
  /** Croissance du coût par exemplaire. */
  growth: number;
  /** Mana par seconde par exemplaire (absent pour les griffes). */
  sps?: number;
}

export const ITEMS: Item[] = [
  { id: 'claw', name: 'Griffes runiques', base: 25, growth: 1.4 },
  { id: 'lut', name: 'Lutin collecteur', base: 15, growth: 1.15, sps: 0.3 },
  { id: 'cri', name: 'Cristal runique', base: 100, growth: 1.15, sps: 2.2 },
  { id: 'san', name: 'Sanctuaire elfique', base: 700, growth: 1.15, sps: 13 },
  { id: 'tou', name: 'Tour d’archimage', base: 5000, growth: 1.15, sps: 75 },
  { id: 'por', name: 'Portail dimensionnel', base: 35000, growth: 1.15, sps: 430 },
  { id: 'nex', name: 'Nexus astral', base: 2e5, growth: 1.15, sps: 2600 },
  { id: 'ame', name: 'Âme du monde', base: 1.4e6, growth: 1.15, sps: 14500 },
  { id: 'eve', name: 'Éveil des dieux', base: 8e6, growth: 1.15, sps: 82000 }
];

export interface Talent {
  id: string;
  name: string;
  desc: string;
  base: number;
  max: number;
}

export const TALENTS: Talent[] = [
  { id: 'eye', name: 'Œil d’ambre', desc: '+40 % de mana par souffle', base: 3, max: 10 },
  { id: 'vein', name: 'Veine de mana', desc: '+20 % de production', base: 5, max: 10 },
  { id: 'pact', name: 'Pacte des gnomes', desc: '−3 % sur le coût des améliorations', base: 8, max: 10 },
  { id: 'gift', name: 'Offrande du sanctuaire', desc: 'Après une renaissance, démarrer avec 500 mana par niveau', base: 4, max: 10 },
  { id: 'sleep', name: 'Sommeil profond', desc: '+2 h de production hors-ligne', base: 6, max: 6 }
];

export const PRODUCTION_MILESTONES = [
  { rank: 3, mult: 2, label: 'Sceau éveillé' },
  { rank: 8, mult: 5, label: 'Sceau renforcé' },
  { rank: 15, mult: 10, label: 'Sceau majeur' },
  { rank: 20, mult: 30, label: 'Sceau draconique' }
];

/** Lignées visuelles du dragon de la forge (art, particules, synergie contre les titans). */
export interface Lineage {
  name: string;
  color: string;
  fx: 'snow' | 'ember' | 'bolt' | 'spore' | 'smoke' | 'dust';
  burst: string;
  light: [number, number, number];
}

export const LINEAGES: Lineage[] = [
  { name: 'Eau', color: '#39baff', fx: 'snow', burst: '#cfeeff', light: [0.25, 0.65, 1] },
  { name: 'Feu', color: '#ff6338', fx: 'ember', burst: '#ffb050', light: [1, 0.32, 0.12] },
  { name: 'Foudre', color: '#b99bff', fx: 'bolt', burst: '#c9b2ff', light: [0.62, 0.42, 1] },
  { name: 'Nature', color: '#66d65c', fx: 'spore', burst: '#8dff8a', light: [0.35, 1, 0.28] },
  { name: 'Glace', color: '#8fd6ff', fx: 'snow', burst: '#cfeeff', light: [0.55, 0.82, 1] },
  { name: 'Ombre', color: '#a36bdb', fx: 'smoke', burst: '#ff4a5a', light: [0.58, 0.3, 0.9] },
  { name: 'Solaire', color: '#ffd36a', fx: 'dust', burst: '#ffe08a', light: [1, 0.78, 0.28] }
];

/** Titans dont chaque lignée triomphe plus facilement (indices de TITANS). */
export const LINEAGE_TARGETS: Record<number, number[]> = {
  0: [0, 3],
  1: [1],
  2: [2],
  3: [3],
  4: [0],
  5: [5],
  6: [1, 4]
};

export const TITANS = [
  'Sentinelle des cendres',
  'Basilic des profondeurs',
  'Wyverne brise-couronne',
  'Colosse de braise',
  'Roi-dragon oublié',
  'Dévoreur astral'
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export type DamageSource = 'tap' | 'passive' | 'strike' | 'devour';

export interface TitanTrait {
  trait: string;
  detail: string;
  mods: Record<DamageSource, number>;
  attacks: [string, string, string];
  needs: [number, number, number];
}

export const TITAN_TRAITS: TitanTrait[] = [
  { trait: 'Carapace de cendre', detail: 'Les clics infligent 20 % de dégâts en moins ; Frappe draconique inflige 35 % de dégâts supplémentaires.', mods: { tap: 0.8, passive: 1, strike: 1.35, devour: 1 }, attacks: ['Marteau de scories', 'Pluie de braises', 'Fournaise primordiale'], needs: [8, 10, 12] },
  { trait: 'Regard pétrifiant', detail: 'Les clics sont 25 % plus efficaces, mais les compétences infligent 20 % de dégâts en moins.', mods: { tap: 1.25, passive: 1, strike: 0.8, devour: 0.8 }, attacks: ['Regard pétrifiant', 'Morsure calcifiante', 'Prison de pierre'], needs: [7, 10, 13] },
  { trait: 'Ailes du cyclone', detail: 'La production passive inflige moitié moins de dégâts ; les frappes actives sont plus efficaces.', mods: { tap: 1.1, passive: 0.5, strike: 1.1, devour: 1.15 }, attacks: ['Rafale rasante', 'Cyclone dévastateur', 'Ouragan brise-couronne'], needs: [9, 11, 13] },
  { trait: 'Armure titanesque', detail: 'Les clics sont peu efficaces ; les compétences actives percent son armure.', mods: { tap: 0.65, passive: 1.2, strike: 1.5, devour: 1.3 }, attacks: ['Piétinement sismique', 'Poing des montagnes', 'Effondrement du monde'], needs: [8, 11, 14] },
  { trait: 'Sang royal', detail: 'Résiste légèrement aux dégâts passifs, mais ses points faibles s’ouvrent aux compétences actives.', mods: { tap: 0.9, passive: 0.85, strike: 1.2, devour: 1.2 }, attacks: ['Décret du roi-dragon', 'Souffle souverain', 'Sentence draconique'], needs: [9, 11, 14] },
  { trait: 'Faim astrale', detail: 'Absorbe une partie des dégâts passifs ; Dévoration est particulièrement puissante contre lui.', mods: { tap: 0.85, passive: 0.5, strike: 1.1, devour: 1.6 }, attacks: ['Faille gravitationnelle', 'Nuit dévorante', 'Effacement astral'], needs: [8, 10, 13] }
];

export type RelicSlot = 'weapon' | 'focus' | 'armor';
export type RelicEffectKind = 'dmg' | 'passive' | 'production' | 'combo' | 'loss' | 'stun';

export interface Relic {
  id: string;
  slot: RelicSlot;
  slotName: string;
  set: 'breaker' | 'archon';
  icon: string;
  name: string;
  cost: number;
  desc: string;
  effect: RelicEffectKind;
  value: number;
}

export const RELICS: Relic[] = [
  { id: 'titanfang', slot: 'weapon', slotName: 'Arme', set: 'breaker', icon: '🦷', name: 'Croc du titan', cost: 2, desc: '+18 % aux dégâts infligés aux titans.', effect: 'dmg', value: 0.18 },
  { id: 'emberheart', slot: 'weapon', slotName: 'Arme', set: 'archon', icon: '🔥', name: 'Cœur de braise', cost: 4, desc: '+30 % aux dégâts passifs contre les titans.', effect: 'passive', value: 0.3 },
  { id: 'archseal', slot: 'focus', slotName: 'Focus', set: 'archon', icon: '🔮', name: 'Sceau d’archimage', cost: 3, desc: '+12 % de production de mana et compétences 8 % plus rapides.', effect: 'production', value: 0.12 },
  { id: 'cometmirror', slot: 'focus', slotName: 'Focus', set: 'breaker', icon: '🪞', name: 'Miroir du combo', cost: 5, desc: 'Chaque niveau de combo ajoute 1 % de dégâts supplémentaires aux titans.', effect: 'combo', value: 0.01 },
  { id: 'astralscale', slot: 'armor', slotName: 'Armure', set: 'archon', icon: '🌌', name: 'Écaille astrale', cost: 3, desc: 'Réduit de 40 % la perte de mana quand une attaque touche.', effect: 'loss', value: 0.4 },
  { id: 'sunward', slot: 'armor', slotName: 'Armure', set: 'breaker', icon: '☀️', name: 'Égide solaire', cost: 5, desc: 'Prolonge de 3 secondes la vulnérabilité après une interruption.', effect: 'stun', value: 3000 }
];

export const RELIC_SLOTS: { slot: RelicSlot; label: string }[] = [
  { slot: 'weapon', label: 'Arme' },
  { slot: 'focus', label: 'Focus' },
  { slot: 'armor', label: 'Armure' }
];

export const RELIC_SETS = [
  { id: 'breaker', name: 'Ensemble du Briseur', icon: '⚔️', pieces: ['titanfang', 'cometmirror', 'sunward'], two: '2 pièces : +12 % de dégâts contre les titans.', three: '3 pièces : les interruptions accordent deux fois plus de mana et prolongent la vulnérabilité de 3 s supplémentaires.' },
  { id: 'archon', name: 'Ensemble de l’Archonte', icon: '🔮', pieces: ['emberheart', 'archseal', 'astralscale'], two: '2 pièces : +8 % de production de mana.', three: '3 pièces : Surcharge arcanique ×7 au lieu de ×5 et recharges des compétences réduites de 15 %.' }
] as const;

export type AscPathId = 'devourer' | 'archmage' | 'eternal' | 'void';

export const ASC_PATHS: { id: AscPathId; name: string; title: string; desc: string; max: number }[] = [
  { id: 'devourer', name: 'Dévoreur', title: 'Voie du Dévoreur', desc: '+12 % aux dégâts de souffle par niveau.', max: 5 },
  { id: 'archmage', name: 'Archimage', title: 'Voie de l’Archimage', desc: '+8 % de production et compétences plus rapides par niveau.', max: 5 },
  { id: 'eternal', name: 'Éternel', title: 'Voie de l’Éternel', desc: '+2 % de valeur par étoile et par niveau.', max: 5 },
  { id: 'void', name: 'Néant', title: 'Voie du Néant', desc: '+8 % de récompenses des titans par niveau.', max: 5 }
];

export const OATH_PATHS: { id: AscPathId; icon: string; name: string; step: number; effect: string }[] = [
  { id: 'devourer', icon: '🔥', name: 'Serment des Cendres', step: 0.25, effect: 'Puissance du souffle' },
  { id: 'archmage', icon: '🌊', name: 'Serment des Marées', step: 0.25, effect: 'Production de mana' },
  { id: 'eternal', icon: '⭐', name: 'Serment de l’Aube', step: 0.15, effect: 'Braises de renaissance' },
  { id: 'void', icon: '🌌', name: 'Serment du Néant', step: 0.3, effect: 'Fragments de transcendance' }
];

export type SkillId = 'strike' | 'surge' | 'devour';

export const SKILLS: { id: SkillId; icon: string; name: string; base: number; gate: string }[] = [
  { id: 'strike', icon: '🔥', name: 'Frappe draconique', base: 12000, gate: 'Débloquée à la 1re renaissance' },
  { id: 'surge', icon: '⚡', name: 'Surcharge arcanique', base: 30000, gate: 'Débloquée à la 3e renaissance' },
  { id: 'devour', icon: '☄️', name: 'Dévoration', base: 45000, gate: 'Débloquée à l’ascension I' }
];

export type ContractId = 'taps' | 'boss' | 'buys' | 'combo' | 'dmg' | 'egg' | 'surp' | 'tal';

export const CONTRACT_POOL: { id: ContractId; name: string; desc: string }[] = [
  { id: 'taps', name: 'Maîtriser la flamme', desc: 'Effectuer 100 souffles' },
  { id: 'boss', name: 'Chasseur de titans', desc: 'Vaincre 1 titan' },
  { id: 'buys', name: 'Préparer la forge', desc: 'Acheter 3 améliorations' },
  { id: 'combo', name: 'Furie maîtrisée', desc: 'Atteindre un combo ×1,60 (10 souffles enchaînés)' },
  { id: 'dmg', name: 'Percée runique', desc: 'Infliger des dégâts aux titans' },
  { id: 'egg', name: 'Gardien des œufs', desc: 'Faire éclore 1 œuf' },
  { id: 'surp', name: 'Œil du dragon', desc: 'Attraper 1 surprise de la forge' },
  { id: 'tal', name: 'Étudiant en braises', desc: 'Acheter 1 talent de braise' }
];

/** Récompense = base + production passive × secondes + puissance de souffle × souffles. */
export const CONTRACT_REWARDS: Record<ContractId, { base: number; perBoss?: number; perKill?: number; incomeSeconds: number; breaths: number }> = {
  taps: { base: 50, perBoss: 0.08, incomeSeconds: 20, breaths: 75 },
  boss: { base: 150, perKill: 0.1, incomeSeconds: 30, breaths: 125 },
  buys: { base: 75, perBoss: 0.08, incomeSeconds: 20, breaths: 50 },
  combo: { base: 100, perBoss: 0.08, incomeSeconds: 25, breaths: 100 },
  dmg: { base: 125, perBoss: 0.08, incomeSeconds: 30, breaths: 125 },
  egg: { base: 150, incomeSeconds: 20, breaths: 75 },
  surp: { base: 125, perBoss: 0.05, incomeSeconds: 25, breaths: 100 },
  tal: { base: 100, incomeSeconds: 20, breaths: 75 }
};

export const DRAGON_DEX = [
  { id: '0', name: 'Eau', icon: '💧', desc: 'Courants mystiques et écailles nacrées.' },
  { id: '1', name: 'Feu', icon: '🔥', desc: 'Flammes vives et puissance volcanique.' },
  { id: '2', name: 'Foudre', icon: '⚡', desc: 'Vitesse, éclairs et énergie arcanique.' },
  { id: '3', name: 'Nature', icon: '🌿', desc: 'Racines anciennes et croissance.' },
  { id: '4', name: 'Glace', icon: '❄️', desc: 'Cristaux, givre et souffle hivernal.' },
  { id: '5', name: 'Ombre', icon: '🌑', desc: 'Voiles obscurs et magie du Néant.' },
  { id: '6', name: 'Solaire', icon: '☀️', desc: 'Lumière sacrée et énergie céleste.' }
];

/** Identifiant de dragon d'aventure correspondant à chaque entrée du codex. */
export const DEX_TO_DRAGON = ['water', 'fire', 'storm', 'nature', 'ice', 'shadow', 'solar'];

export const SANCTUARIES = [
  { id: 'water', name: 'Sanctuaire des marées', icon: '💧', cost: 2500, desc: 'Une source de mana ruisselle entre des arches anciennes.' },
  { id: 'fire', name: 'Forge du volcan', icon: '🔥', cost: 25000, desc: 'Les braises éternelles alimentent les souffles.' },
  { id: 'storm', name: 'Aiguille de foudre', icon: '⚡', cost: 250000, desc: 'Un cristal capte l’énergie des tempêtes.' },
  { id: 'nature', name: 'Bosquet primordial', icon: '🌿', cost: 2500000, desc: 'Les racines du monde irriguent la forge.' },
  { id: 'ice', name: 'Palais de givre', icon: '❄️', cost: 25000000, desc: 'La glace cristallise le mana en continu.' },
  { id: 'shadow', name: 'Portail du Néant', icon: '🌑', cost: 250000000, desc: 'Une faille transforme l’obscurité en puissance.' },
  { id: 'solar', name: 'Autel solaire', icon: '☀️', cost: 2500000000, desc: 'Un rayon céleste bénit toutes les lignées.' }
];

export const SYSTEM_UNLOCKS: { tab: TabId; msg: string; life: number }[] = [
  { tab: 'forge', msg: 'Nouveau système : la Forge ! Améliorations, talents et reliques t’y attendent.', life: 100 },
  { tab: 'bestiaire', msg: 'Nouveaux systèmes : le Bestiaire et l’Expédition !', life: 1000 },
  { tab: 'expedition', msg: '', life: 1000 },
  { tab: 'renaissance', msg: 'Nouveau système : la Renaissance ! Le grand cycle de la forge commence.', life: 10000 }
];

export type TabId = 'combat' | 'forge' | 'bestiaire' | 'expedition' | 'classement' | 'renaissance' | 'profil' | 'boutique';

export const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'combat', icon: '⚔️', label: 'Chasse' },
  { id: 'forge', icon: '📖', label: 'Forge' },
  { id: 'bestiaire', icon: '🐲', label: 'Bestiaire' },
  { id: 'expedition', icon: '🗺️', label: 'Expédition' },
  { id: 'classement', icon: '🏆', label: 'Classement' },
  { id: 'renaissance', icon: '🌟', label: 'Renaissance' },
  { id: 'profil', icon: '🛡️', label: 'Profil' },
  { id: 'boutique', icon: '✨', label: 'Boutique' }
];

export interface Rival {
  name: string;
  title: string;
  life: number;
  kills: number;
  dragon: string;
}

/** Rivaux aux scores fixes : les dépasser un à un achève la légende. */
export const RIVALS: Rival[] = [
  { name: 'Voranth l’Ancien', title: 'Le premier forgeron', life: 1e13, kills: 29, dragon: 'solar' },
  { name: 'Aurore-Soleil', title: 'Prêtresse de l’aube', life: 1.7e12, kills: 27, dragon: 'solar' },
  { name: 'Noctis Voile-de-Cendre', title: 'Voleur d’ombres', life: 3e11, kills: 25, dragon: 'shadow' },
  { name: 'Sigrid du Givre', title: 'Reine du givre éternel', life: 5.5e10, kills: 23, dragon: 'ice' },
  { name: 'Kaelis Vif-Argent', title: 'Maître des tempêtes', life: 1e10, kills: 21, dragon: 'storm' },
  { name: 'Syl Racine-Vive', title: 'Gardienne des racines', life: 1.8e9, kills: 18, dragon: 'nature' },
  { name: 'Brasek le Rouge', title: 'Champion des braises', life: 3.3e8, kills: 15, dragon: 'fire' },
  { name: 'Oldemar Forge-Neige', title: 'Nain des montagnes', life: 6e7, kills: 13, dragon: 'ice' },
  { name: 'Néréa des Marées', title: 'Oracle des marées', life: 1.1e7, kills: 11, dragon: 'water' },
  { name: 'Yzolt l’Éveillé', title: 'Savant arcanique', life: 2e6, kills: 9, dragon: 'shadow' },
  { name: 'Tisandre Sans-Peur', title: 'Mercenaire indomptable', life: 3.6e5, kills: 7, dragon: 'fire' },
  { name: 'Ekwyn Haut-Vent', title: 'Éclaireur des cimes', life: 6.6e4, kills: 5, dragon: 'storm' },
  { name: 'Gédéon Poing-de-Pierre', title: 'Tailleur de pierre', life: 1.2e4, kills: 3, dragon: 'nature' },
  { name: 'Morgane Cendre', title: 'Herboriste des cendres', life: 2.2e3, kills: 2, dragon: 'nature' },
  { name: 'Piotr le Novice', title: 'Apprenti tout juste éveillé', life: 400, kills: 1, dragon: 'fire' }
];

export interface DragonMeta {
  id: string;
  name: string;
  line: string;
  icon: string;
  role: 'Attaquant' | 'Gardien' | 'Soutien';
  power: number;
  /** Indice de zone à débloquer (99 : achat requis). */
  unlock: number;
  purchaseRequired?: boolean;
  desc: string;
  portrait: string;
}

/** Dragons de l'aventure et du profil (portrait de guilde, classement). */
export const DRAGONS: DragonMeta[] = [
  { id: 'fire', name: 'Pyra', line: 'Feu', icon: '🔥', role: 'Attaquant', power: 14, unlock: 0, desc: 'Dégâts élevés et brûlure.', portrait: 'img_02.webp' },
  { id: 'water', name: 'Néréa', line: 'Eau', icon: '💧', role: 'Gardien', power: 11, unlock: 0, desc: 'Réduit les dégâts subis.', portrait: 'img_03.webp' },
  { id: 'nature', name: 'Sylve', line: 'Nature', icon: '🌿', role: 'Soutien', power: 10, unlock: 0, desc: 'Renforce toute l’équipe.', portrait: 'img_04.webp' },
  { id: 'storm', name: 'Volt', line: 'Foudre', icon: '⚡', role: 'Attaquant', power: 17, unlock: 3, desc: 'Frappes rapides.', portrait: 'img_05.webp' },
  { id: 'ice', name: 'Givre', line: 'Glace', icon: '❄️', role: 'Gardien', power: 16, unlock: 6, desc: 'Résistance et contrôle.', portrait: 'img_06.webp' },
  { id: 'shadow', name: 'Noctis', line: 'Ombre', icon: '🌑', role: 'Soutien', power: 19, unlock: 9, desc: 'Affaiblit les ennemis.', portrait: 'img_07.webp' },
  { id: 'solar', name: 'Aurore', line: 'Solaire', icon: '☀️', role: 'Attaquant', power: 23, unlock: 12, desc: 'Puissance lumineuse.', portrait: 'img_08.webp' },
  { id: 'obsidian', name: 'Obsidienne', line: 'Obsidienne', icon: '🐉', role: 'Soutien', power: 10, unlock: 99, purchaseRequired: true, desc: 'Un dragon de collection à la puissance d’un dragon de départ, sans bonus premium.', portrait: 'img_09.webp' }
];

export const STARTER_DRAGONS = ['fire', 'water', 'nature'];

/** Lignée visuelle (indice LINEAGES) utilisée pour l'art d'un dragon d'aventure. */
export const DRAGON_LINEAGE: Record<string, number> = { fire: 1, water: 0, nature: 3, storm: 2, ice: 4, shadow: 5, solar: 6, obsidian: 5 };

export const CHAPTERS = [
  { name: 'Vallée oubliée', icon: '🌄', zones: ['Sentier des braises', 'Prairie des échos', 'Tanière du vieux roc'], desc: 'Les premières traces d’une ancienne civilisation draconique.' },
  { name: 'Terres ardentes', icon: '🌋', zones: ['Faille rouge', 'Forêt calcinée', 'Cœur du volcan'], desc: 'Les flammes réveillent les gardiens de la montagne.' },
  { name: 'Royaume de glace', icon: '❄️', zones: ['Col des brumes', 'Lac gelé', 'Palais de givre'], desc: 'Une ancienne magie dort sous la glace.' },
  { name: 'Forêt des anciens', icon: '🌳', zones: ['Racines vivantes', 'Clairière lunaire', 'Arbre-monde'], desc: 'La forêt teste la confiance entre dragon et dresseur.' },
  { name: 'Îles du chaos', icon: '🌪️', zones: ['Récif foudroyé', 'Île fracturée', 'Œil du chaos'], desc: 'Des îles dérivent au-dessus d’un océan instable.' },
  { name: 'Sanctuaire draconique', icon: '🐉', zones: ['Porte des anciens', 'Temple des lignées', 'Sanctuaire draconique'], desc: 'Le dernier sanctuaire révèle le secret des dragons.' }
];

export const ZONE_COUNT = 18;
export const ZONE_KILLS_FOR_BOSS = 10;

export const ENEMIES = ['Louveteaux cendrés', 'Gobelins des ruines', 'Dragons sauvages', 'Golems de lave', 'Spectres du givre', 'Sentinelles sylvestres', 'Éclaireurs du chaos', 'Gardiens anciens'];
export const ENEMY_ICONS = ['🐾', '🪨', '🐲', '🔥', '👻', '🌿', '🌪️', '🐉'];

export const FRAME_IDS = ['cw1', 'cw2', 'cw3', 'cw4', 'cw5'] as const;
export type FrameId = (typeof FRAME_IDS)[number];

export interface FrameDef {
  id: FrameId;
  name: string;
  short: string;
  desc: string;
  need: number;
  color: string;
  hi: string;
  lo: string;
  gem: string;
  glyph: string;
  req: string;
}

/** Cadres héraldiques : débloqués par le nombre de succès (forge + aventure). */
export const FRAMES: FrameDef[] = [
  { id: 'cw1', name: 'Couronne de braise · Rang I', short: 'Couronne de braise (rang I)', desc: 'L’étincelle de l’éveil du forgeron', need: 0, color: '#e8834a', hi: '#ffd9a8', lo: '#4a2410', gem: '#e85b2a', glyph: '✦', req: 'Disponible dès le départ' },
  { id: 'cw2', name: 'Couronne de givre · Rang II', short: 'Couronne de givre (rang II)', desc: 'Le sceau des expéditions glacées', need: 3, color: '#9fd4f5', hi: '#ecf7ff', lo: '#23415e', gem: '#5fb0ff', glyph: '❖', req: '3 succès' },
  { id: 'cw3', name: 'Couronne d’ombre · Rang III', short: 'Couronne d’ombre (rang III)', desc: 'L’insigne des élites de l’ombre', need: 7, color: '#b48cf2', hi: '#eadcff', lo: '#33215e', gem: '#e3d2ff', glyph: '✧', req: '7 succès' },
  { id: 'cw4', name: 'Couronne des tempêtes · Rang IV', short: 'Couronne des tempêtes (rang IV)', desc: 'La marque des maîtres de la tempête', need: 15, color: '#5fb0ff', hi: '#d6ecff', lo: '#1f3a66', gem: '#ffe9b8', glyph: '❈', req: '15 succès' },
  { id: 'cw5', name: 'Couronne draconique · Rang V', short: 'Couronne draconique (rang V)', desc: 'La couronne des légendes de la forge', need: 30, color: '#ff9a4d', hi: '#ffe0a0', lo: '#7a1e08', gem: '#ff4a3d', glyph: '♛', req: '30 succès · fin de jeu' }
];

export interface Cosmetic {
  id: string;
  name: string;
  icon: string;
  desc: string;
  kind?: string;
  price?: string;
}

export const FREE_COSMETICS: Cosmetic[] = [
  { id: 'ember-frame', name: 'Cadre Braise', icon: '🔥', desc: 'Un cadre de profil entouré de flammes et de braises animées.', kind: 'Cadre' },
  { id: 'moon-title', name: 'Titre : Veilleur lunaire', icon: '🌙', desc: 'Un titre décoratif pour les dresseurs patients.', kind: 'Titre' },
  { id: 'forest-aura', name: 'Aura Sylvestre', icon: '🌿', desc: 'Une aura vert émeraude et or, avec des feuilles lumineuses et un halo de forêt ancienne.', kind: 'Aura' }
];

export const PAID_COSMETICS: Cosmetic[] = [
  { id: 'obsidian-skin', name: 'Dragon Obsidienne', icon: '🐉', kind: 'Dragon de collection', price: '0,99 €', desc: 'Débloque Obsidienne dans les dragons possédés. Même puissance de base qu’un dragon de départ, sans bonus premium.' },
  { id: 'founder-badge', name: 'Badge de soutien', icon: '🏅', price: '0,99 €', desc: 'Tu apprécies Dragon Grind ? Ce petit badge aide à financer son développement. Merci de faire partie de l’aventure !' }
];

export const COSMETIC_LABELS: Record<string, string> = {
  'ember-frame': 'Cadre Braise',
  'moon-title': 'Veilleur lunaire',
  'forest-aura': 'Aura sylvestre',
  'obsidian-skin': 'Dragon Obsidienne',
  'founder-badge': 'Badge de soutien'
};

export const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文（普通话）', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰' }
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];
export const RTL_LANGS: Lang[] = ['ar', 'ur'];
