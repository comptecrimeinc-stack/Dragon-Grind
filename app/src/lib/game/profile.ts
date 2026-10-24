import { FRAMES, FRAME_IDS, type FrameDef, type FrameId } from './constants';

export interface Profile {
  name: string;
  dragon: string;
  frame: FrameId;
  createdAt?: number;
}

export const NAME_MIN = 2;
export const NAME_MAX = 22;

/** Ramène un nom à sa forme comparable : minuscules, sans accents ni leetspeak, répétitions compressées. */
export function normalizeProfileName(raw: string): string {
  const leet: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', $: 's', '!': 'i', '€': 'e' };
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[0134578@$!€*·._\-\s|/#]/g, (ch) => leet[ch] ?? '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1');
}

/** Liste multilingue de termes refusés : insultes, haine, contenu sexuel, drogues, usurpation. */
const BLOCKLIST = [
  // FR
  'merde', 'putain', 'pute', 'salope', 'connard', 'connasse', 'encule', 'enculer', 'pedale', 'nique', 'niquer', 'bite', 'couille', 'chatte', 'trouduc', 'bordel', 'bougnoule', 'negro', 'negre', 'youpin', 'salejuif', 'islamo', 'terroriste', 'petasse', 'branleur', 'branle', 'suce', 'sucer', 'tapette', 'tarlouze', 'fiotte', 'grognasse', 'salopard', 'enfoire', 'batard', 'abruti', 'idiot', 'imbecile', 'niquetamere', 'chier', 'chiant', 'foutre',
  // EN
  'fuck', 'shit', 'asshole', 'arsehole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy', 'cock', 'motherfucker', 'stfu', 'wtf', 'slut', 'whore', 'nigger', 'nigga', 'faggot', 'fag', 'retard', 'tranny', 'rape', 'rapist', 'nazi', 'hitler', 'kkk', 'pedophile', 'paedophile', 'pedo', 'paedo', 'childporn', 'onlyfans', 'porn', 'sex', 'xxx', 'anal', 'oral', 'cum', 'semen', 'boob', 'tits', 'titty', 'horny', 'hentai', 'nsfw',
  // ES / PT / IT / DE / NL / PL / RU (translittéré)
  'puta', 'puto', 'mierda', 'cabron', 'cono', 'joder', 'hijoputa', 'gilipollas', 'maricon', 'pendejo', 'verga', 'chingar', 'culero', 'pinche', 'perra', 'zorra', 'estupido',
  'scheisse', 'arschloch', 'arsch', 'fick', 'hure', 'schlampe', 'schwuchtel', 'fotze', 'wichser', 'hurensohn', 'judenschwein',
  'cazzo', 'puttana', 'troia', 'stronzo', 'vaffanculo', 'fanculo', 'figa', 'coglione', 'bastardo', 'mignotta',
  'porra', 'caralho', 'viado', 'foda', 'foder', 'buceta', 'cuzao', 'filhodaputa', 'arrombado', 'otario',
  'kanker', 'tyfus', 'hoer', 'kut', 'godver', 'eikel',
  'kurwa', 'chuj', 'pierdol', 'suka', 'dziwka', 'cipa',
  'blyat', 'blin', 'pizda', 'khuy', 'yebat', 'cyka', 'pidor', 'debil',
  // haine, violence, drogues, mineurs
  'killall', 'murder', 'suicide', 'bomb', 'shooting', 'jihad', 'isis', 'alqaeda', 'whitepower', 'siegheil', 'heilhitler', 'gasjews', 'holocaustdeny',
  'cocaine', 'cocaina', 'heroin', 'heroine', 'meth', 'crack', 'mdma', 'lsd', 'weed420', 'drugdealer',
  'childsex', 'kidssex', 'underage', 'lolita', 'preteen', 'incest',
  // usurpation
  'admin', 'administrator', 'moderator', 'systeme', 'system', 'official', 'support', 'null', 'undefined'
].map(normalizeProfileName).filter((w) => w.length >= 3);

const PATTERNS = [/n[i1l]gg/, /f[a@]g+o?t/, /c[uü]nt/, /f[u*]+ck/, /sh[i1]t/, /b[i1]tch/, /p[e3]d[o0]/, /r[a@]p[e3]/, /h[i1]tl[e3]r/, /n[a@]z[i1]/, /s[e3]x[xy]/, /p[o0]rn/, /xxx/, /n[i1]q+u?[e3]/, /put[e3a@]/, /sal[o0]p/];

export type NameCheck = { ok: true; name: string } | { ok: false; reason: 'empty' | 'short' | 'long' | 'chars' | 'link' | 'blocked' };

export function checkProfileName(name: string): NameCheck {
  const raw = String(name || '').trim();
  if (!raw) return { ok: false, reason: 'empty' };
  if (raw.length < NAME_MIN) return { ok: false, reason: 'short' };
  if (raw.length > NAME_MAX) return { ok: false, reason: 'long' };
  if (/[<>{}[\]\\/]/.test(raw)) return { ok: false, reason: 'chars' };
  if (/(https?:|www\.|@)/i.test(raw)) return { ok: false, reason: 'link' };
  const norm = normalizeProfileName(raw);
  if (norm.length < NAME_MIN) return { ok: false, reason: 'short' };
  if (BLOCKLIST.some((w) => norm.includes(w)) || PATTERNS.some((re) => re.test(norm))) return { ok: false, reason: 'blocked' };
  return { ok: true, name: raw };
}

export const NAME_ERRORS: Record<Exclude<NameCheck, { ok: true }>['reason'], string> = {
  empty: 'Entre un nom pour ton héros.',
  short: 'Le nom doit faire au moins 2 caractères.',
  long: 'Le nom doit faire au maximum 22 caractères.',
  chars: 'Ce nom contient des caractères non autorisés.',
  link: 'Les liens et mentions ne sont pas autorisés dans le nom.',
  blocked: 'Ce nom ne peut pas être utilisé.'
};

export const isFrameId = (x: unknown): x is FrameId => FRAME_IDS.includes(x as FrameId);
export const frameDef = (id: string): FrameDef => FRAMES.find((f) => f.id === id) ?? FRAMES[0];
export const framesUnlocked = (achievementCount: number): FrameDef[] => FRAMES.filter((f) => achievementCount >= f.need);

let crownInstance = 0;

/**
 * Couronne héraldique en SVG (contenu d'un viewBox 0 0 200 200).
 * Chaque appel reçoit un identifiant de dégradé unique pour éviter les collisions dans le document.
 */
export function crownSvg(id: FrameId): string {
  const f = frameDef(id);
  const R = { cw1: { w: 18, g: 4, orn: 0 }, cw2: { w: 19, g: 6, orn: 6 }, cw3: { w: 20, g: 8, orn: 8 }, cw4: { w: 21, g: 10, orn: 10 }, cw5: { w: 22, g: 12, orn: 13 } }[f.id];
  const C = 100;
  const RAD = 86;
  const gid = 'dgCrown-' + f.id + '-' + ++crownInstance;
  let s = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${f.hi}"/><stop offset=".45" stop-color="${f.color}"/><stop offset="1" stop-color="${f.lo}"/></linearGradient></defs>`;
  s += `<circle cx="${C}" cy="${C}" r="${RAD}" fill="none" stroke="url(#${gid})" stroke-width="${R.w}"/>`;
  s += `<circle cx="${C}" cy="${C}" r="${RAD}" fill="none" stroke="${f.hi}" stroke-width="1.8" opacity=".75"/>`;
  const gm = Math.max(4.5, R.w * 0.52);
  for (let i = 0; i < R.g; i++) {
    const a = ((i * 360) / R.g) * (Math.PI / 180);
    const x = C + RAD * Math.sin(a);
    const y = C - RAD * Math.cos(a);
    s += `<path d="M${x.toFixed(1)} ${(y - gm).toFixed(1)} L${(x + gm).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + gm).toFixed(1)} L${(x - gm).toFixed(1)} ${y.toFixed(1)} Z" fill="${f.gem}" stroke="#140f17" stroke-width="1.6"/>`;
  }
  if (R.orn > 0) {
    const fw = Math.max(3, R.orn * 0.75);
    const tip = C - RAD - R.orn;
    const base = C - RAD + R.w / 2 - 2;
    const mid = C - RAD - R.orn * 0.45;
    for (let i = 0; i < R.g; i++) {
      s += `<g transform="rotate(${(((i + 0.5) * 360) / R.g).toFixed(1)} ${C} ${C})"><path d="M${C} ${base} Q${C + fw} ${mid} ${C} ${tip} Q${C - fw} ${mid} ${C} ${base} Z" fill="url(#${gid})" stroke="#140f17" stroke-width="1.3"/></g>`;
    }
  }
  if (f.id === 'cw5') s += `<circle cx="${C}" cy="${C}" r="${RAD + R.orn}" fill="none" stroke="${f.hi}" stroke-width="1.6" opacity=".5"/>`;
  return s;
}
