import keystatic from '@keystatic/astro';
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import i18nConfig from './src/config/i18n.config.ts';
import { loadEnv } from 'vite';

// 🌟 Força o carregamento do arquivo .env antes do Astro inicializar
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const calculatedSiteUrl = env.SITE_URL || 'https://www.monto.ia.br';

const i18nEnabled = i18nConfig.enabled === true && i18nConfig.locales.length > 1;
const astroI18nOptions = i18nEnabled
  ? {
      defaultLocale: i18nConfig.defaultLocale,
      locales: i18nConfig.locales,
      routing: {
        prefixDefaultLocale: false,
        redirectToDefaultLocale: false,
      },
    }
  : undefined;

// 🌟 DETECÇÃO NATIVA DE COMANDO (Substitui o command === 'build' da função antiga)
const isBuild = process.argv.includes('build') || process.env.NODE_ENV === 'production';

export default defineConfig({
  output: 'static',
  adapter: isBuild ? cloudflare() : undefined,

  // 🌟 O TRUQUE DE MARKETING: Redireciona o cliente de forma transparente
  redirects: {
    '/admin': '/keystatic'
  },
  
  site: calculatedSiteUrl,
  ...(astroI18nOptions ? { i18n: astroI18nOptions } : {}),

  env: {
    schema: {
      SITE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      PUBLIC_GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      NEWSLETTER_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
      BING_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
      PUBLIC_GOOGLE_MAPS_API_KEY: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      PUBLIC_CONSENT_ENABLED: envField.boolean({ context: 'client', access: 'public', optional: true, default: false }),
      PUBLIC_PRIVACY_POLICY_URL: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
    },
  },

  image: {
    layout: 'constrained',
  },

  // 🌟 AGORA O ASTRO VAI LER ESSA LISTA VERDADEIRAMENTE!
  integrations: [
    react(),
    mdx(),
    sitemap(),
    keystatic() // 🌟 O Keystatic agora está oficialmente ativo!
  ],
  
  // 🌟 i18n removido daqui: já é calculado dinamicamente em `astroI18nOptions`
  // (linhas 16-25) a partir de `src/config/i18n.config.ts`, a fonte única
  // de verdade. O bloco fixo que existia aqui (`pt-br`/`en`) duplicava e
  // mascarava esse cálculo — ver memória "i18n-config-conflict".

  vite: {
    plugins: [tailwindcss()],
    // 🌟 ENGENHARIA DE INTEROPERABILIDADE (VITE 7 + LEGACY COMMONJS)
    optimizeDeps: {
      include: ['lodash/debounce', 'lodash']
    }
  },

  security: {
    checkOrigin: true,
    // 🌟 CSP nativo do Astro: gera hashes automaticamente para os scripts
    // is:inline estáticos (ex: Analytics.astro) e libera os domínios do
    // GTM/GA4 necessários para o Tag Manager funcionar.
    // ⚠️ Restrito ao build (produção): em `astro dev` o painel do Keystatic
    // (/keystatic) renderizava 100% em branco porque o editor MDX do
    // Keystatic precisa de `'unsafe-eval'` em script-src, que o CSP nativo
    // do Astro não inclui — sem `'unsafe-eval'`, o React do painel falha
    // antes de montar qualquer coisa. Em produção, `/keystatic` é uma rota
    // SSR (prerender: false) e vai sofrer o mesmo problema: mover essa
    // política para `public/_headers` com exceção de `/keystatic/*` (ver
    // memória "csp-security-headers-gap") antes de publicar.
    csp: isBuild
      ? {
          directives: [
            "connect-src 'self' https://*.google-analytics.com https://analytics.google.com https://*.googletagmanager.com",
            "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
          ],
          scriptDirective: {
            resources: [
              'https://*.googletagmanager.com',
              'https://*.google-analytics.com',
              'https://analytics.google.com',
            ],
          },
        }
      : false,
  },

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});