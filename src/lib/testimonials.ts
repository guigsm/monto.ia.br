import siteConfig from '@/config/site.config';
import fallbackData from '@/data/testimonials.json';

export interface NormalizedReview {
  id: string;
  platform: string;
  author: { name: string; avatarUrl: string | null };
  /** Texto original (PT-BR) — usar em páginas PT-BR */
  text: string;
  /** Texto traduzido pela Featurable — usar em páginas EN */
  textEn: string;
  rating: number;
  publishedAt: string;
}

export interface TestimonialsData {
  reviews: NormalizedReview[];
  meta: {
    count: number;
    rating: number;
    writeAReviewUri: string;
  };
}

function fromApi(raw: Record<string, unknown>): NormalizedReview {
  const author = raw.author as Record<string, unknown>;
  const ratingRaw = raw.rating;
  return {
    id: String(raw.id ?? ''),
    platform: String(raw.platform ?? 'gbp'),
    author: {
      name: String(author.name ?? ''),
      avatarUrl: author.avatarUrl ? String(author.avatarUrl) : null,
    },
    text: String(raw.originalText || raw.text || '').trim(),
    textEn: String(raw.text || raw.originalText || '').trim(),
    rating:
      typeof ratingRaw === 'object' && ratingRaw !== null
        ? Number((ratingRaw as Record<string, unknown>).value ?? 5)
        : Number(ratingRaw ?? 5),
    publishedAt: String(raw.publishedAt ?? ''),
  };
}

function fromFallback(raw: Record<string, unknown>): NormalizedReview {
  const author = raw.author as Record<string, unknown>;
  const ratingRaw = raw.rating;
  return {
    id: String(raw.id ?? ''),
    platform: String(raw.platform ?? 'gbp'),
    author: {
      name: String(author.name ?? ''),
      avatarUrl: author.avatarUrl ? String(author.avatarUrl) : null,
    },
    // Se o JSON foi gerado pelo atualizar_depoimentos.py tem ambos os campos;
    // JSONs antigos (formato legado) só têm "text" — funciona como fallback de ambos.
    text: String(raw.originalText || raw.text || '').trim(),
    textEn: String(raw.text || raw.originalText || '').trim(),
    rating:
      typeof ratingRaw === 'object' && ratingRaw !== null
        ? Number((ratingRaw as Record<string, unknown>).value ?? 5)
        : Number(ratingRaw ?? 5),
    publishedAt: String(raw.publishedAt ?? ''),
  };
}

/**
 * Busca depoimentos da Featurable no build time.
 * Em caso de falha, usa o fallback em src/data/testimonials.json.
 */
export async function getTestimonials(): Promise<TestimonialsData> {
  const widgetUrl = siteConfig.testimonials?.widgetUrl;

  if (widgetUrl) {
    try {
      const res = await fetch(widgetUrl, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Record<string, unknown>;
      const widget = data.widget as Record<string, unknown> | undefined;
      const summary = (widget?.gbpLocationSummary ?? {}) as Record<string, unknown>;
      const reviews: NormalizedReview[] = (
        (widget?.reviews as Array<Record<string, unknown>>) ?? []
      ).map(fromApi);
      return {
        reviews,
        meta: {
          count: Number(summary.reviewsCount ?? reviews.length),
          rating: Number(summary.rating ?? 5),
          writeAReviewUri: String(
            summary.writeAReviewUri ?? fallbackData._meta.summary.writeAReviewUri
          ),
        },
      };
    } catch (e) {
      console.warn('[testimonials] Build-time fetch failed, using local fallback:', e);
    }
  }

  return {
    reviews: (fallbackData.reviews as Array<Record<string, unknown>>).map(fromFallback),
    meta: {
      count: fallbackData._meta.summary.count,
      rating: fallbackData._meta.summary.rating,
      writeAReviewUri: fallbackData._meta.summary.writeAReviewUri,
    },
  };
}

/** Fisher-Yates — retorna novo array embaralhado sem modificar o original */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
