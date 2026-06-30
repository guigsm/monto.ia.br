/** Maps project locale codes to BCP 47 tags accepted by Intl.DateTimeFormat. */
const LOCALE_TO_INTL: Record<string, string> = {
  'pt-br': 'pt-BR',
  en: 'en-US',
};

/** Converts a project locale code (e.g. `pt-br`) to an Intl-compatible tag (e.g. `pt-BR`). */
export function localeToIntl(locale: string): string {
  return LOCALE_TO_INTL[locale] ?? locale;
}

/**
 * Format a date for display.
 * Accepts either a project locale code (e.g. `pt-br`) or an Intl tag (e.g. `pt-BR`).
 */
export function formatDate(date: Date, locale = 'pt-BR'): string {
  const intlLocale = localeToIntl(locale);
  return new Intl.DateTimeFormat(intlLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Calculate reading time for content
 */
export function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if a URL is external
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Resolve a flat array of social profile URLs into structured link objects.
 * Matches each URL against known platforms to derive icon name and label.
 */
const SOCIAL_PLATFORMS = [
  { key: 'github',        match: /github\.com/i,                              label: 'GitHub',      icon: 'github'                    },
  { key: 'twitter',       match: /x\.com|twitter\.com/i,                     label: 'X / Twitter', icon: 'x-twitter'                 },
  { key: 'linkedin',      match: /linkedin\.com/i,                            label: 'LinkedIn',    icon: 'linkedin'                  },
  { key: 'instagram',     match: /instagram\.com/i,                           label: 'Instagram',   icon: 'instagram'                 },
  { key: 'bluesky',       match: /bsky\.app|bluesky\.social/i,               label: 'Bluesky',     icon: 'bluesky'                   },
  { key: 'google-place',  match: /share\.google|maps\.google|google\.com\/maps/i, label: 'Google', icon: 'simple-icons:google'       },
] as const;

export interface ResolvedSocialLink {
  key: string;
  href: string;
  label: string;
  icon: string;
}

export function resolveSocialLinks(urls: string[]): ResolvedSocialLink[] {
  return urls.flatMap((href) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.match.test(href));
    if (!platform) return [];
    return [{ key: platform.key, href, label: platform.label, icon: platform.icon }];
  });
}
