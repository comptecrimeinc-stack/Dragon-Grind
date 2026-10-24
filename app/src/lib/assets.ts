/** Chemins des images servies depuis `public/` (relatifs à la base du site). */
const base = import.meta.env.BASE_URL;

export const asset = (file: string): string => base + 'assets/' + file;

/** Art du dragon de la forge : 7 lignées × 6 stades. */
export const dragonArt = (lineage: number, stage: number): string =>
  asset(`dragons/${Math.max(0, Math.min(6, lineage))}-${Math.max(0, Math.min(5, stage))}.webp`);

export const LOGO = asset('img_00.jpg');
export const GATE_DRAGON = asset('img_01.webp');
export const SHOP_MARK = asset('img_10.webp');
export const FOREST_AURA = asset('img_13.png');
