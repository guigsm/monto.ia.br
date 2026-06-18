import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Varredura de acessibilidade (WCAG 2.1 AA) com axe-core nas rotas
 * principais, nos dois idiomas. Roda contra o build de produção
 * (`pnpm build && pnpm test:e2e`) via playwright.config.ts.
 *
 * 🌟 Falha o teste se houver QUALQUER violação "serious" ou "critical".
 * Violações "minor"/"moderate" são reportadas mas não quebram o build —
 * ajuste `failOnSeverity` conforme a maturidade do projeto.
 */

const routes = ['/', '/about', '/blog', '/projects', '/contact', '/en', '/en/about'];

const failOnSeverity = new Set(['serious', 'critical']);

for (const route of routes) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter((v) => failOnSeverity.has(v.impact ?? ''));

    if (results.violations.length > 0) {
      console.log(
        `\n[a11y] ${route}: ${results.violations.length} violação(ões) — ` +
          results.violations.map((v) => `${v.id} (${v.impact})`).join(', ')
      );
    }

    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}
