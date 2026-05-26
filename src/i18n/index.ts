import en from './en.json';
import pt from './pt.json'; // 🌟 Conectado diretamente ao seu novo arquivo traduzido!
import i18nConfig from '../config/i18n.config';

export { i18nConfig };
export type { I18nConfig } from '../config/i18n.config';

export type Locale = string;
export type Dictionary = typeof en;

// Dicionário purificado: Apenas Brasil e Estados Unidos ativos no core
const dictionaries: Record<string, Dictionary> = {
  pt: pt as Dictionary,
  en: en as Dictionary,
};

export const defaultLocale: Locale = i18nConfig.defaultLocale;

export function isEnabled(): boolean {
  return i18nConfig.enabled === true && i18nConfig.locales.length > 1;
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

export function localizedPath(path: string, locale: Locale = defaultLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!isEnabled()) return normalized;
  if (locale === defaultLocale) return normalized;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
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

export function swapLocaleInPath(path: string, targetLocale: Locale): string {
  const base = stripLocaleFromPath(path);
  return localizedPath(base, targetLocale);
}

export function getLocaleFromPath(path: string): Locale {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const first = normalized.split('/').filter(Boolean)[0];
  return first && i18nConfig.locales.includes(first) ? first : defaultLocale;
}