/**
 * Configuração Global de Temas de Cores
 * Centraliza os dados de cores oklch e traduções do boilerplate matriz
 */

export interface ThemeConfig {
  id: string;
  nameEn: string;
  namePt: string;
  color: string;
}

export const themesConfig: ThemeConfig[] = [
  { id: 'orange',  namePt: 'Laranja',   nameEn: 'Orange',  color: 'oklch(62.5% 0.22  38)'  },
  { id: 'amber',   namePt: 'Âmbar',     nameEn: 'Amber',   color: 'oklch(68%   0.19  75)'  },
  { id: 'lime',    namePt: 'Limão',     nameEn: 'Lime',    color: 'oklch(64%   0.27 130)'  },
  { id: 'emerald', namePt: 'Esmeralda', nameEn: 'Emerald', color: 'oklch(62.5% 0.22 160)'  },
  { id: 'teal',    namePt: 'Turquesa',  nameEn: 'Teal',    color: 'oklch(62.5% 0.22 190)'  },
  { id: 'cyan',    namePt: 'Ciano',     nameEn: 'Cyan',    color: 'oklch(65%   0.22 200)'  },
  { id: 'sky',     namePt: 'Céu',       nameEn: 'Sky',     color: 'oklch(67%   0.21 222)'  },
  { id: 'blue',    namePt: 'Azul',      nameEn: 'Blue',    color: 'oklch(62.5% 0.22 255)'  },
  { id: 'indigo',  namePt: 'Índigo',    nameEn: 'Indigo',  color: 'oklch(60%   0.24 264)'  },
  { id: 'violet',  namePt: 'Violeta',   nameEn: 'Violet',  color: 'oklch(62.5% 0.26 277)'  },
  { id: 'purple',  namePt: 'Roxo',      nameEn: 'Purple',  color: 'oklch(62.5% 0.25 303)'  },
  { id: 'magenta', namePt: 'Magenta',   nameEn: 'Magenta', color: 'oklch(58%   0.28 330)'  },
];

/**
 * Retorna a lista de temas traduzida com base no idioma ativo
 */
export function getThemes(isPt: boolean) {
  return themesConfig.map((theme) => ({
    id: theme.id,
    name: isPt ? theme.namePt : theme.nameEn,
    color: theme.color,
  }));
}