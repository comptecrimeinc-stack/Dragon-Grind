import { LANGUAGES, RTL_LANGS, type Lang } from '#lib/game/constants.ts';
import { createTranslator, toTemplate, type Dictionary } from './translate';

// Chaque dictionnaire est un module séparé : seul celui de la langue choisie est téléchargé.
const loaders = import.meta.glob<Dictionary>('./locales/*.json', { import: 'default' });

function recordMiss(lang: Lang, s: string): void {
  const w = globalThis as unknown as { __i18nMisses?: Record<string, string[]> };
  const list = ((w.__i18nMisses ??= {})[lang] ??= []);
  const key = toTemplate(s);
  if (!list.includes(key)) list.push(key);
}

export const isLang = (x: unknown): x is Lang => LANGUAGES.some((l) => l.code === x);

class I18n {
  lang = $state<Lang>('fr');
  #translate = $state<(s: string) => string>((s) => s);

  /** Traduit une phrase française dans la langue courante (réactif dans les composants). */
  t = (s: string): string => this.#translate(s);

  get dir(): 'rtl' | 'ltr' {
    return RTL_LANGS.includes(this.lang) ? 'rtl' : 'ltr';
  }

  async setLang(lang: Lang): Promise<void> {
    const loader = loaders[`./locales/${lang}.json`];
    const dict = lang === 'fr' || !loader ? null : await loader();
    this.lang = lang;
    // En développement, les phrases sans traduction sont relevées (voir `window.__i18nMisses`).
    this.#translate = createTranslator(dict, import.meta.env.DEV ? (s) => recordMiss(lang, s) : undefined);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = this.dir;
    }
  }
}

export const i18n = new I18n();
export const t = (s: string): string => i18n.t(s);
