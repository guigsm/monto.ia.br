import en from './en.json';
import pt from './pt.json'; // 🌟 Conectado diretamente ao seu novo arquivo traduzido!
import i18nConfig from '../config/i18n.config';

export { i18nConfig };
export type { I18nConfig } from '../config/i18n.config';

export type Locale = string;
export type Dictionary = typeof en;

// Dicionário purificado: Apenas Brasil e Estados Unidos ativos no core
const dictionaries: Record<string, Dictionary> = {
  'pt-br': pt as Dictionary,
  en: en as Dictionary,
};

export const defaultLocale: Locale = i18nConfig.defaultLocale;

export function isEnabled(): boolean {
  return i18nConfig.enabled === true && i18nConfig.locales.length > 1;
}

/**
 * Whether the blog is generated for every configured locale.
 *
 * When `false` (default), the blog only exists in `defaultLocale` (pt-br).
 * Non-default-locale routes under `/blog` (e.g. `/en/blog`) render an
 * informational fallback instead of real content, and "Blog" is hidden
 * from the nav in those locales.
 */
export function isBlogTranslated(): boolean {
  return i18nConfig.blog?.translated === true;
}

export function getLocales(): Locale[] {
  return i18nConfig.locales;
}

export function getLocaleName(locale: Locale): string {
  return i18nConfig.localeNames?.[locale] ?? locale;
}

export function isValidLocale(locale: string | undefined): locale is Locale {
  if (!locale) return false;
  return i18nConfig.locales.includes(locale);
}

export function resolveLocale(locale: string | undefined): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}

function getNested(dict: Dictionary, key: string): string | undefined {
  const parts = key.split('.');
  let value: unknown = dict;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = vars[name];
    return value !== undefined ? String(value) : match;
  });
}

export function t(key: string, locale: Locale = defaultLocale, vars?: Record<string, string | number>): string {
  const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
  const fallback = dictionaries[defaultLocale];
  const value = (dict && getNested(dict, key)) ?? (fallback && getNested(fallback, key)) ?? key;
  return interpolate(value, vars);
}

/**
 * Per-route slug map: translates a page's URL slug between locales so that
 * pt-br URLs use Portuguese words while en URLs keep the English ones
 * (e.g. `/sobre` ↔ `/en/about`).
 *
 * `localizedPath()` and `swapLocaleInPath()` use this to rewrite the path
 * segment in addition to adding/removing the `/en` prefix. Routes not
 * listed here (home, blog, etc.) keep the same slug in every locale.
 */
export const routeSlugs: Record<string, Partial<Record<Locale, string>>> = {
  about:        { 'pt-br': '/sobre',                      en: '/about' },
  contact:      { 'pt-br': '/contato',                    en: '/contact' },
  projects:     { 'pt-br': '/portfolio',                  en: '/projects' },
  services:     { 'pt-br': '/servicos',                   en: '/services' },
  testimonials: { 'pt-br': '/depoimentos',                en: '/testimonials' },
  privacy:      { 'pt-br': '/politica-de-privacidade',    en: '/privacy-policy' },
  location:     { 'pt-br': '/localizacao',                en: '/location' },
};

/**
 * Rewrites the leading segment(s) of `path` (expressed in `fromLocale`'s
 * slug vocabulary) into `toLocale`'s vocabulary, using `routeSlugs`.
 * Paths not covered by `routeSlugs` are returned unchanged.
 */
function translateSlug(path: string, fromLocale: Locale, toLocale: Locale): string {
  if (fromLocale === toLocale) return path;
  for (const slugs of Object.values(routeSlugs)) {
    const fromSlug = slugs[fromLocale];
    const toSlug = slugs[toLocale];
    if (!fromSlug || !toSlug || fromSlug === toSlug) continue;
    if (path === fromSlug || path.startsWith(`${fromSlug}/`)) {
      return toSlug + path.slice(fromSlug.length);
    }
  }
  return path;
}

/**
 * Builds the URL for `path` (expressed in `defaultLocale`'s slug
 * vocabulary, e.g. `/sobre`, `/contato`, `/portfolio`) in `locale`,
 * translating the slug and adding the `/en`-style prefix as needed.
 */
export function localizedPath(path: string, locale: Locale = defaultLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!isEnabled()) return normalized;
  const translated = translateSlug(normalized, defaultLocale, locale);
  if (locale === defaultLocale) return translated;
  return `/${locale}${translated === '/' ? '' : translated}`;
}

export function stripLocaleFromPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const match = normalized.match(/^\/([^/]+)(\/.*)?$/);
  if (!match) return normalized;
  const [, first, rest] = match;
  if (i18nConfig.locales.includes(first)) {
    return rest && rest.length > 0 ? rest : '/';
  }
  return normalized;
}

/**
 * Returns the equivalent URL for the current page in `targetLocale`,
 * translating both the `/en`-style prefix and the localized slug (e.g.
 * `/sobre` ↔ `/en/about`, `/portfolio/foo` ↔ `/en/projects/foo`).
 */
export function swapLocaleInPath(path: string, targetLocale: Locale): string {
  const currentLocale = getLocaleFromPath(path);
  const base = stripLocaleFromPath(path);
  const ptPath = translateSlug(base, currentLocale, defaultLocale);
  return localizedPath(ptPath, targetLocale);
}

export function getLocaleFromPath(path: string): Locale {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const first = normalized.split('/').filter(Boolean)[0];
  return first && i18nConfig.locales.includes(first) ? first : defaultLocale;
}

/**
 * Maps a project locale code (e.g. `pt-br`) to the 2-letter language code
 * Google Translate expects (e.g. `pt`).
 */
function toGoogleTranslateLangCode(locale: Locale): string {
  return locale.split('-')[0];
}

/**
 * Builds a "translate this page" link via Google Translate's public web UI,
 * pointing at the given absolute/site-relative URL written in `sourceLocale`.
 *
 * Used as a lightweight fallback for content that doesn't have a real
 * translation yet (e.g. the blog when `i18nConfig.blog.translated` is
 * `false`) — opens in a new tab, no extra script or consent impact.
 */
export function getGoogleTranslateUrl(
  targetUrl: string,
  sourceLocale: Locale = defaultLocale,
  targetLocale: Locale = defaultLocale
): string {
  const sl = toGoogleTranslateLangCode(sourceLocale);
  const tl = toGoogleTranslateLangCode(targetLocale);
  return `https://translate.google.com/translate?sl=${sl}&tl=${tl}&u=${encodeURIComponent(targetUrl)}`;
}