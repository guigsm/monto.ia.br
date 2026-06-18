// Configuração principal de i18n da Matriz Modular
const i18nConfig = {
  enabled: true,               // Ativa o sistema globalmente
  defaultLocale: 'pt-br',      // Idioma padrão de carregamento (BCP-47: português do Brasil)
  routing: {
    prefixDefaultLocale: false, // <-- ISSO OMITE O /pt-br/ DA URL
    redirectToDefaultLocale: true
  },
  locales: ['pt-br', 'en'],     // Idiomas aceitos pelo roteador do Astro
  localeNames: {               // Nomes exibidos nos seletores
    'pt-br': 'Português',
    en: 'English'
  } as Record<string, string>,

  // 🌟 Configuração do Blog dentro do i18n — pensada para o "super template"
  blog: {
    /**
     * Quando `false` (padrão): o blog existe APENAS no `defaultLocale`
     * (pt-br). Nenhuma rota real é gerada em `/en/blog`, `/en/blog/<slug>`,
     * `/en/blog/page/<n>` ou `/en/blog/tag/<tag>` — em vez disso, essas
     * URLs mostram uma página informativa ("o blog só existe em
     * português"), e o item "Blog" some do menu nos demais idiomas.
     *
     * Quando `true`: o blog passa a funcionar normalmente em todos os
     * `locales` configurados acima — basta criar posts com o campo
     * `locale` correspondente (ex.: `locale: en`) em
     * `src/content/blog/*.mdx` e as rotas `/en/blog/...` são geradas
     * automaticamente, com o item "Blog" de volta ao menu em inglês.
     */
    translated: false,
  },
};

export type I18nConfig = typeof i18nConfig;
export default i18nConfig;