/**
 * Build-time / dev-runtime card SVG generator.
 *
 * Produces themed 800×450 SVG cards using the same CSS class system as the
 * manually curated blog illustrations (.bg, .ico, .txt, .ln, .pil, .ptx,
 * .cor, .num). Theme colours are applied at runtime via CSS custom properties
 * — the generated file is theme-neutral raw markup.
 *
 * Cache strategy: on first render the SVG is written to
 * `src/assets/card-svg/<key>.svg` and reused on subsequent builds/requests.
 * That directory is gitignored; Cloudflare Pages regenerates it each deploy.
 */
import siteConfig from '@/config/site.config';

// ── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  let consumed = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    if (!line) {
      line = word;
      consumed = i + 1;
      continue;
    }
    if (line.length + 1 + word.length > maxCharsPerLine) {
      lines.push(line);
      if (lines.length === maxLines) break;
      line = word;
      consumed = i + 1;
    } else {
      line += ' ' + word;
      consumed = i + 1;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && consumed < words.length) {
    lines[maxLines - 1] = lines[maxLines - 1]!.replace(/.{0,3}$/, '…');
  }
  return lines;
}

function safeHost(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

// ── Icon paths (Heroicons 2 outline, 24×24 viewBox) ────────────────────────

const ICON_PATHS: Record<string, string> = {
  blog: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3z"/>',
  portfolio: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"/>',
  projetos: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"/>',
  service: '<path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>',
  servico: '<path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>',
  seo: '<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803 7.5 7.5 0 0 0 15.803 15.803z"/>',
  geo: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25zm.75-12h9v9h-9v-9z"/>',
  automacoes: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>',
  whatsapp: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V20l4.155-4.15"/>',
  default: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456zM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z"/>',
};

function getIconPath(section: string): string {
  const key = section.toLowerCase().replace(/[àáâãäå]/g, 'a').replace(/[éêë]/g, 'e').replace(/[íî]/g, 'i').replace(/[óôõö]/g, 'o').replace(/[úûü]/g, 'u').replace(/[ç]/g, 'c').replace(/[^a-z]/g, '');
  return ICON_PATHS[key] ?? ICON_PATHS['default']!;
}

// ── SVG generation ─────────────────────────────────────────────────────────

export interface CardSVGOptions {
  title: string;
  tags?: string[];
  section?: string;
  domain?: string;
}

export function generateCardSVGContent({
  title,
  tags = [],
  section = 'default',
  domain,
}: CardSVGOptions): string {
  const tag = tags[0] ?? '';
  const siteDomain = domain ?? safeHost(siteConfig.url);
  const iconPath = getIconPath(section);

  // Title — wrap at 22 chars, max 3 lines, 48px font / 60px line-height
  const lines = wrapText(title, 22, 3);
  const lineHeight = 60;
  // Position: visual center is ~y=210; baseline of first line
  const blockCenter = 210;
  const blockHalf = (lines.length * lineHeight) / 2;
  const firstBaselineY = Math.round(blockCenter - blockHalf + lineHeight * 0.78);

  // Tag pill dimensions
  const charPx = 8.4;
  const pillPadX = 28;
  const pillWidth = Math.round(tag.length * charPx + pillPadX);

  return `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect class="bg" x="0" y="0" width="800" height="450"/>

  <!-- Decorative blob (top-right) -->
  <circle class="num" cx="820" cy="-30" r="210"/>

  <!-- Diagonal texture lines -->
  <g class="ln" fill="none" stroke-width="1">
    <line x1="540" y1="-10" x2="810" y2="260"/>
    <line x1="580" y1="-10" x2="810" y2="220"/>
    <line x1="620" y1="-10" x2="810" y2="180"/>
    <line x1="660" y1="-10" x2="810" y2="140"/>
    <line x1="700" y1="-10" x2="810" y2="100"/>
  </g>

  <!-- Corner marks -->
  <g class="cor" fill="none" stroke-width="2.5" stroke-linecap="round">
    <polyline points="48,22 22,22 22,48"/>
    <polyline points="752,22 778,22 778,48"/>
    <polyline points="22,402 22,428 48,428"/>
    <polyline points="778,402 778,428 752,428"/>
  </g>

  <!-- Section icon (top-right, 60×60) — paths are 24×24, scaled 2.5× -->
  <g class="ico" fill="none" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"
     transform="translate(648, 52) scale(2.5)">
    ${iconPath}
  </g>

  <!-- Title -->
  <text class="txt" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="48" font-weight="700" letter-spacing="-0.5">
    ${lines.map((line, i) => `<tspan x="48" ${i === 0 ? `y="${firstBaselineY}"` : `dy="${lineHeight}"`}>${escapeXml(line)}</tspan>`).join('\n    ')}
  </text>

${tag ? `  <!-- Tag pill -->
  <rect class="pil" x="48" y="366" width="${pillWidth}" height="30" rx="15"/>
  <text class="ptx" font-family="system-ui, -apple-system, sans-serif" font-size="13"
        font-weight="600" x="62" y="386">${escapeXml(tag)}</text>
` : ''
}  <!-- Domain -->
  <text class="txt" font-family="system-ui, -apple-system, sans-serif" font-size="13"
        font-weight="400" opacity="0.45" x="48" y="428">${escapeXml(siteDomain)}</text>
</svg>`;
}

// ── Cache key ──────────────────────────────────────────────────────────────

/** Deterministic filename-safe key for the cache file. */
export function cardSVGCacheKey(section: string, title: string, firstTag: string): string {
  const raw = `${section}-${title}-${firstTag}`;
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
