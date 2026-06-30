import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Blog collection with Content Layer API
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string().optional(),
      title: z.string().max(100),
      metaTitle: z.string().max(70).optional(),
      description: z.string().max(200),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      author: z.string().default('Team'),
      image: image().optional(),
      imageAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      svgSlug: z.string().optional(),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      // 🌟 'pt-br' é o locale padrão do projeto (ver src/config/i18n.config.ts).
      // Mantemos 'en'/'es'/'fr' no enum para posts traduzidos no futuro.
      locale: z.enum(['pt-br', 'en', 'es', 'fr']).default('pt-br'),
      /** Per-post override: hide table of contents on this post */
      toc: z.boolean().optional(),
      /** Per-post override: hide comments on this post */
      comments: z.boolean().optional(),
    }),
});

// Pages collection for static pages (template leftover — kept for compatibility)
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedAt: z.coerce.date().optional(),
    locale: z.enum(['en', 'es', 'fr']).default('en'),
  }),
});

// Custom pages — free-form pages created via Keystatic (not blindadas)
const customPages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/custom-pages' }),
  schema: z.object({
    slug: z.string().optional(),
    title: z.string(),
    description: z.string(),
    showInMenu: z.boolean().default(true),
    menuLabel: z.string().optional(),
    menuOrder: z.number().default(99),
    draft: z.boolean().default(false),
    noIndex: z.boolean().default(false),
    showInMenuEn: z.boolean().default(false),
    enTitle: z.string().optional(),
    enMenuLabel: z.string().optional(),
    enDescription: z.string().optional(),
    enContent: z.string().optional(),
  }),
});

// Authors collection
const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      bio: z.string(),
      avatar: image().optional(),
      social: z
        .object({
          twitter: z.string().optional(),
          github: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .optional(),
    }),
});

// FAQs collection (for JSON-LD FAQ schema)
const faqs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
    order: z.number().default(0),
    locale: z.enum(['en', 'es', 'fr']).default('en'),
  }),
});

// Projects collection — one MDX file per project
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.string().url().optional(),
      repo: z.string().url().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      /** Optional gallery — when provided, renders a swipeable carousel in the hero in place of the single `image`. */
      gallery: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
          })
        )
        .default([]),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      year: z.number().optional(),
      client: z.string().optional(),
      role: z.string().optional(),
      services: z.array(z.string()).default([]),
      /** Optional editorial tagline — short facts rendered as a single line under the hero description with brand-coloured dot separators. */
      meta: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      placeholder: z.boolean().default(false),
      /** Per-project override: hide table of contents on this project */
      toc: z.boolean().optional(),
    }),
});

// Services collection — one MDX file per service offering
const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      slug: z.string().optional(),
      title: z.string(),
      description: z.string().max(200),
      icon: z.string().default('sparkles'),
      tags: z.array(z.string()).default([]),
      image: image().optional(),
      imageAlt: z.string().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      draft: z.boolean().default(false),
      noIndex: z.boolean().default(false),
      showInNav: z.boolean().default(true),
      locale: z.enum(['pt-br', 'en']).default('pt-br'),
      ctaText: z.string().optional(),
      ctaHref: z.string().default('/contato'),
    }),
});

// Stack collection — one MDX file per tool, editable like blog posts
const stack = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/stack' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    version: z.string(),
    url: z.string().url(),
    icon: z.string(), // icon name, e.g. 'brand-astro'
    colorOklch: z.string(), // OKLCH params, e.g. '62.5% 0.22 38'
    order: z.number().default(0),
  }),
});

export const collections = {
  blog,
  pages,
  customPages,
  authors,
  faqs,
  stack,
  projects,
  services,
};
