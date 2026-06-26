/**
 * Motor Central de Ícones e Links de Redes Sociais
 * Otimizado para Vite 7 + Astro 6 (Compatível com Cloudflare Prerender Edge)
 */

// 🌟 ARQUITETURA CORRIGIDA VIA VITE
// Caminho corrigido para dois níveis (../../) de modo a mapear perfeitamente a raiz local e de produção
const iconModules = import.meta.glob('../../node_modules/@iconify-json/*/icons.json', { eager: true });

export function getIconSvg(name: string) {
  let prefix = 'lucide';
  let iconName = name;

  if (name.includes(':')) {
    [prefix, iconName] = name.split(':');
  }

  if (prefix === 'lucide' && iconName === 'x-twitter') {
    iconName = 'twitter'; 
  }

  // Chave de busca perfeitamente alinhada com o escopo do import.meta.glob
  const collectionKey = `../../node_modules/@iconify-json/${prefix}/icons.json`;
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
 * RESOLVEDOR CENTRAL DE LINKS DE REDES SOCIAIS (URL)
 */
export function getSocialIconData(url: string): { icon: string; label: string } {
  if (url.includes('github.com'))    return { icon: 'github',    label: 'GitHub' };
  if (url.includes('instagram.com')) return { icon: 'instagram', label: 'Instagram' };
  if (url.includes('x.com') || url.includes('twitter.com')) return { icon: 'x-twitter', label: 'X' };
  if (url.includes('linkedin.com'))  return { icon: 'linkedin',  label: 'LinkedIn' };
  if (url.includes('bsky.app'))      return { icon: 'bluesky',   label: 'Bluesky' };
  if (url.includes('youtube.com'))   return { icon: 'youtube',   label: 'YouTube' };
  if (url.includes('share.google') || url.includes('maps.google') || url.includes('google.com/maps'))
    return { icon: 'simple-icons:google', label: 'Google' };
  return { icon: 'link', label: 'Social' };
}

/**
 * RESOLVEDOR CENTRAL DE PLATAFORMAS (NOME)
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