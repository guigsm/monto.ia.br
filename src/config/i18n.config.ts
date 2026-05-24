// Configuração principal de i18n
export const i18nConfig = {
  enabled: true, // Ativa o seletor no Header
  defaultLocale: "pt-br", // Idioma raiz do site
  
  // 🌟 CORREÇÃO: Voltando a ser uma lista de strings puras para não quebrar o .toUpperCase()
  locales: ["pt-br", "en"], 

  // Dicionário de traduções internas para componentes globais
  translations: {
    "pt-br": {
      "nav.selectLanguage": "Selecionar idioma",
      "nav.currentLanguage": "Idioma atual: Português",
      "nav.theme": "Tema",
      "nav.blog": "Blog",
      "nav.projects": "Projetos"
    },
    "en": {
      "nav.selectLanguage": "Select language",
      "nav.currentLanguage": "Current language: English",
      "nav.theme": "Theme",
      "nav.blog": "Blog",
      "nav.projects": "Projects"
    }
  } as Record<string, Record<string, string>>
};

// Aliases estratégicos para o astro.config.mjs ler sem retornar undefined
export const i18n = i18nConfig;
export default i18nConfig;