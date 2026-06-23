/**
 * Navigation Configuration
 *
 * Defines navigation menus for the site. Astro handles routing via the
 * filesystem — this only controls which links appear in nav menus.
 *
 * - `navItems`       → main (header) navigation
 * - `footerNavItems` → footer navigation, configured independently from
 *                      the header so you can show different links in the
 *                      footer (e.g. add a Privacy link, drop About, etc.)
 * - `legalLinks`     → small legal-style links (Privacy, Terms, Imprint…)
 *                      shown in the footer's bottom row when supported
 *                      by the active footer layout.
 */

import { defaultLocale, isBlogTranslated } from '@/i18n';
import contactPage from '../content/pages/contact.json';
import testimonialsPage from '../content/pages/testimonials.json';

// Visibilidade das páginas blindadas controlada pelo campo showInMenu no Keystatic.
// Undefined (campo ausente) trata como true para não quebrar ambientes sem o campo.
type WithShowInMenu = { showInMenu?: boolean };
const blindadaVisible: Record<string, boolean> = {
  '/contato': (contactPage as WithShowInMenu).showInMenu !== false,
  '/depoimentos': (testimonialsPage as WithShowInMenu).showInMenu !== false,
};

export interface NavItem {
  label: string;
  href: string;
  order: number;
  external?: boolean;
  /**
   * Identifies this item for locale-aware filtering (e.g. `'blog'`).
   * Used by `getNavItems`/`getFooterNavItems` to hide the Blog link in
   * locales where the blog isn't available — see
   * `src/config/i18n.config.ts` (`i18n.blog.translated`).
   */
  key?: string;
}

/**
 * 🧪 TEMP-HOME-OVERRIDE — SOMENTE PARA TESTES
 * --------------------------------------------------------------
 * No domínio de produção existe um redirecionamento configurado na raiz
 * ("/"), então a home não pode ser visualizada lá durante os testes.
 * Enquanto isso, o logo do header/footer e os botões "voltar ao início"
 * apontam para HOME_PATH em vez de '/'.
 *
 * PARA REMOVER ESTE ARTIFÍCIO QUANDO FOR AO AR DEFINITIVAMENTE:
 *   1. Troque o valor abaixo de '/index' para '/'.
 *   2. Apague as pastas src/pages/index/ e src/pages/en/index/.
 * (busque por "TEMP-HOME-OVERRIDE" no projeto para achar todos os usos)
 */
export const HOME_PATH = '/home';

export interface LegalLink {
  label: string;
  href: string;
}

/**
 * Main (header) navigation for the default locale (pt-br):
 * Blog, Portfólio, Serviços, Sobre, Depoimentos, Contato.
 *
 * Hrefs are written in pt-br's slug vocabulary (`/sobre`, `/contato`,
 * `/portfolio`) — `localizedPath()` translates them for other locales
 * via `routeSlugs` (see `src/i18n/index.ts`).
 *
 * Serviços e Depoimentos agora têm páginas reais — URLs limpas sem hash.
 * Na home, o scroll-spy intercepta cliques nesses links e desliza até
 * a section correspondente via `scrollIntoView`, atualizando a URL com
 * `history.pushState` (ver script `data-scroll-spy` em index.astro).
 */
export const navItems: NavItem[] = [
  { label: 'Blog', href: '/blog', order: 1, key: 'blog' },
  { label: 'Portfólio', href: '/portfolio', order: 2 },
  { label: 'Serviços', href: '/servicos', order: 3 },
  { label: 'Sobre', href: '/sobre', order: 4 },
  { label: 'Depoimentos', href: '/depoimentos', order: 5 },
  { label: 'Contato', href: '/contato', order: 6 },
];

/**
 * Main (header) navigation for non-default locales (e.g. en). The
 * "Serviços"/"Depoimentos" anchor sections aren't translated yet, so this
 * mirrors the original 4-item menu with English labels. Hrefs stay in
 * pt-br's slug vocabulary — `localizedPath()` translates them.
 */
const navItemsEn: NavItem[] = [
  { label: 'Blog', href: '/blog', order: 1, key: 'blog' },
  { label: 'Projects', href: '/portfolio', order: 2 },
  { label: 'About', href: '/sobre', order: 3 },
  { label: 'Contact', href: '/contato', order: 4 },
];

export const footerNavItems: NavItem[] = [
  { label: 'Blog', href: '/blog', order: 1, key: 'blog' },
  { label: 'Portfólio', href: '/portfolio', order: 2 },
  { label: 'Serviços', href: '/servicos', order: 3 },
  { label: 'Sobre', href: '/sobre', order: 4 },
  { label: 'Depoimentos', href: '/depoimentos', order: 5 },
  { label: 'Contato', href: '/contato', order: 6 },
];

const footerNavItemsEn: NavItem[] = [
  { label: 'Blog', href: '/blog', order: 1, key: 'blog' },
  { label: 'Projects', href: '/portfolio', order: 2 },
  { label: 'About', href: '/sobre', order: 3 },
  { label: 'Contact', href: '/contato', order: 4 },
];

export const legalLinks: LegalLink[] = [
  { label: 'Política de Privacidade', href: '/politica-de-privacidade' },
];

/**
 * Filter out nav items that shouldn't appear for the given locale.
 *
 * - The "Blog" item (`key: 'blog'`) is hidden outside `defaultLocale` when
 *   `i18n.blog.translated` is `false` (the blog only exists in pt-br).
 * - Serviços/Depoimentos agora têm páginas reais e não precisam mais
 *   de filtragem especial por `key: 'anchor'`.
 */
function filterForLocale(items: NavItem[], locale?: string): NavItem[] {
  if (!locale || locale === defaultLocale || isBlogTranslated()) return items;
  return items.filter((item) => item.key !== 'blog');
}

/**
 * Get header navigation items sorted by order, optionally filtered for
 * `locale` (hides "Blog" when the blog isn't available in that locale).
 */
export function getNavItems(locale?: string): NavItem[] {
  const source = locale && locale !== defaultLocale ? navItemsEn : navItems;
  return filterForLocale(
    [...source]
      .filter((item) => blindadaVisible[item.href] !== false)
      .sort((a, b) => a.order - b.order),
    locale,
  );
}

/**
 * Get footer navigation items sorted by order, optionally filtered for
 * `locale` (hides "Blog" when the blog isn't available in that locale).
 *
 * Configured independently from the header — edit `footerNavItems`
 * above to add/remove links in the footer only.
 */
export function getFooterNavItems(locale?: string): NavItem[] {
  const source = locale && locale !== defaultLocale ? footerNavItemsEn : footerNavItems;
  return filterForLocale(
    [...source]
      .filter((item) => blindadaVisible[item.href] !== false)
      .sort((a, b) => a.order - b.order),
    locale,
  );
}

/**
 * Get configured legal links (Privacy, Terms, etc.).
 * Returned as-is — order matches declaration order.
 */
export function getLegalLinks(): LegalLink[] {
  return [...legalLinks];
}
