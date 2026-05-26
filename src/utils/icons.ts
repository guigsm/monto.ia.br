/**
 * Motor Central de Ícones e Links de Redes Sociais
 * Otimizado para Vite 7 + Astro 6 (Compatível com Cloudflare Prerender Edge)
 */

// 🌟 ARQUITETURA COMPILADA VIA VITE (Elimina completamente o uso de 'fs' e 'path')
// Usamos o import.meta.glob com eager: true para injetar os arquivos JSON em tempo de compilação.
// Isso evita que o Worker isolado da Cloudflare tente ler o HD físico durante o build.
const iconModules = import.meta.glob('../../../node_modules/@iconify-json/*/icons.json', { eager: true });

export function getIconSvg(name: string) {
  let prefix = 'lucide';
  let iconName = name;

  if (name.includes(':')) {
    [prefix, iconName] = name.split(':');
  }

  if (prefix === 'lucide' && iconName === 'x-twitter') {
    iconName = 'twitter'; 
  }

  // Constrói a chave de busca exatamente no formato mapeado pelo empacotador do Vite
  const collectionKey = `../../../node_modules/@iconify-json/${prefix}/icons.json`;
  const collection = (iconModules[collectionKey] as any)?.default;

  if (!collection) {
    console.error(`[IconBridge] Coleção de ícones não encontrada no bundle: ${prefix}`);
    return null;
  }

  const iconData = collection?.icons?.[iconName];
  if (!iconData) return null;

  return {
    body: iconData.body,
    width: iconData.width || collection.width || 24,
    height: iconData.height || collection.height || 24,
    viewBox: `0 0 ${iconData.width || collection.width || 24} ${iconData.height || collection.height || 24}`
  };
}

/**
 * 🌟 RESOLVEDOR CENTRAL DE LINKS DE REDES SOCIAIS (URL)
 * Usado pelo cabeçalho (Header) para varrer links dinâmicos do siteConfig
 */
export function getSocialIconData(url: string): { icon: string; label: string } {
  if (url.includes('github.com'))    return { icon: 'github',    label: 'GitHub' };
  if (url.includes('instagram.com')) return { icon: 'instagram', label: 'Instagram' };
  if (url.includes('x.com') || url.includes('twitter.com')) return { icon: 'x-twitter', label: 'X' };
  if (url.includes('linkedin.com'))  return { icon: 'linkedin',  label: 'LinkedIn' };
  if (url.includes('bsky.app'))      return { icon: 'bluesky',   label: 'Bluesky' };
  if (url.includes('youtube.com'))   return { icon: 'youtube',   label: 'YouTube' };
  return { icon: 'link', label: 'Social' };
}

/**
 * 🌟 RESOLVEDOR CENTRAL DE PLATAFORMAS (NOME)
 * Usado pelo rodapé (Footer) e componentes internos estruturados
 */
export function getSocialIcon(platform: string): string {
  const p = platform.toLowerCase().trim();
  const mapping: Record<string, string> = {
    github: 'github',
    linkedin: 'linkedin',
    twitter: 'x-twitter',
    x: 'x-twitter',
    instagram: 'instagram',
    facebook: 'facebook',
    youtube: 'youtube',
    mail: 'mail',
    email: 'mail'
  };
  return mapping[p] || 'link';
}