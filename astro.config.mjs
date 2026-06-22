import keystatic from '@keystatic/astro';
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import i18nConfig from './src/config/i18n.config.ts';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { join } from 'path';
import sharp from 'sharp';

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

// Gera icon-192.png e icon-512.png no diretório de saída após o build.
// Usados pelo manifest.webmanifest para o critério "installable manifest" do Lighthouse.
// A cor #3b82f6 deve bater com siteConfig.branding.colors.themeColor e theme_color no manifest.
const PWA_ICON_COLOR = '#3b82f6';
const PWA_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="${PWA_ICON_COLOR}"/>
  <text x="256" y="256" text-anchor="middle" dominant-baseline="central"
    font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="250" fill="white">iA</text>
</svg>`;

function pwaIconsIntegration() {
  return {
    name: 'pwa-icons',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const buf = Buffer.from(PWA_ICON_SVG);
        await Promise.all([
          sharp(buf).resize(192, 192).png().toFile(join(outDir, 'icon-192.png')),
          sharp(buf).resize(512, 512).png().toFile(join(outDir, 'icon-512.png')),
        ]);
        logger.info('PWA icons gerados: icon-192.png, icon-512.png');
      },
    },
  };
}

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
    keystatic(), // 🌟 O Keystatic agora está oficialmente ativo!
    pwaIconsIntegration(),
  ],
  
  // 🌟 i18n removido daqui: já é calculado dinamicamente em `astroI18nOptions`
  // (linhas 16-25) a partir de `src/config/i18n.config.ts`, a fonte única
  // de verdade. O bloco fixo que existia aqui (`pt-br`/`en`) duplicava e
  // mascarava esse cálculo — ver memória "i18n-config-conflict".

  vite: {
    plugins: [tailwindcss()],
    // 🌟 DEDUPE: garante uma única instância de React — sem isso, @keystatic/core/ui
    // pode carregar por um caminho de módulo diferente do renderer (react-dom),
    // resultando em duas cópias do React e o erro "Invalid hook call" no painel.
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    // 🌟 ENGENHARIA DE INTEROPERABILIDADE (VITE 7 + LEGACY COMMONJS)
    optimizeDeps: {
      // 🌟 react-dom/client explícito: sem isso, quando a dep optimization
      // falha (por causa do @keystatic/astro abaixo), o react-dom/client.js
      // é servido como CJS cru pelo Vite e perde o createRoot como named
      // export — quebrando a hidratação de qualquer ilha React (incluindo
      // o painel do Keystatic). Com include explícito, o esbuild garante
      // que esses módulos sejam pré-bundlados ANTES de qualquer falha
      // downstream.
      include: [
        'lodash/debounce',
        'lodash',
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
      ],
      // 🌟 @keystatic/astro contém internal/keystatic-api.js que importa
      // `virtual:keystatic-config` — um módulo virtual que só existe como
      // plugin Vite em runtime. O esbuild do dep optimizer não tem esse
      // plugin e derruba toda a otimização. Excluindo o pacote do optimizer,
      // o esbuild nunca escaneia esse arquivo; o Vite resolve tudo via
      // plugin em runtime normalmente.
      exclude: ['@keystatic/astro'],
    }
  },

  security: {
    checkOrigin: true,
    // CSP gerenciado em public/_headers (Cloudflare Pages) para ter controle
    // total sobre style-src-attr e outras sub-diretivas que o Astro não suporta.
    csp: false,
  },

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});