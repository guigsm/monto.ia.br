// Configuração principal de i18n da Matriz Modular
const i18nConfig = {
  enabled: true,               // Ativa o sistema globalmente
  defaultLocale: 'pt',         // Idioma padrão de carregamento
  locales: ['pt', 'en'],       // Idiomas aceitos pelo roteador do Astro
  localeNames: {               // Nomes exibidos nos seletores
    pt: 'Português',
    en: 'English'
  } as Record<string, string>
};

export type I18nConfig = typeof i18nConfig;
export default i18nConfig;