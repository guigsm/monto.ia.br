import type { ConsentConfig } from '@/lib/consent.types';

const consentConfig: ConsentConfig = {
  /** Bump to force re-consent when categories change */
  version: 1,

  /** 'consent_mode_v2' = scripts load with denied defaults, cookieless pings
   *  'strict' = scripts fully blocked until consent granted */
  mode: 'consent_mode_v2',

  /** localStorage key for stored preferences */
  storageKey: 'cookie-consent',

  categories: {
    necessary: {
      label: 'Necessários',
      description: 'Cookies essenciais para o funcionamento do site. Não podem ser desativados.',
      required: true,
      defaultEnabled: true,
      gcmTypes: ['security_storage'],
    },
    analytics: {
      label: 'Análise',
      description: 'Nos ajudam a entender como os visitantes interagem com o site, coletando dados anônimos de uso.',
      required: false,
      defaultEnabled: false,
      gcmTypes: ['analytics_storage'],
    },
    marketing: {
      label: 'Marketing',
      description: 'Usados para exibir anúncios relevantes e medir o desempenho de campanhas publicitárias.',
      required: false,
      defaultEnabled: false,
      gcmTypes: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    },
    preferences: {
      label: 'Preferências',
      description: 'Permitem que o site lembre suas escolhas, como idioma ou região.',
      required: false,
      defaultEnabled: false,
      gcmTypes: ['functionality_storage', 'personalization_storage'],
    },
  },

  ui: {
    heading: 'Sua Privacidade',
    description:
      'Este site utiliza cookies para melhorar sua experiência de navegação, personalizar conteúdo e analisar nosso tráfego. Ao continuar navegando, você concorda com este uso, conforme descrito em nossa',
    acceptAll: 'Aceitar todos',
    declineAll: 'Recusar',
    customize: 'Personalizar',
    savePreferences: 'Salvar preferências',
    settingsHeading: 'Configurações de Privacidade',
    alwaysOnLabel: 'Sempre ativo',
    privacyPolicyLabel: 'Política de Privacidade',
  },

  /** Milliseconds before banner slides in */
  showDelay: 800,
};

export default consentConfig;
