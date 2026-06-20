import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: { name: 'Monto IA' },
    navigation: {
      'Configurações': ['profile'],
      'Conteúdo Dinâmico': ['blog', 'customPages'],
      'Páginas Fixas (Blindadas)': ['contact', 'testimonials'],
    },
  },
  collections: {
    customPages: collection({
      label: 'Páginas Livres',
      slugField: 'title',
      path: 'src/content/custom-pages/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.text({
          label: 'Título da Página',
          validation: { length: { min: 1 } },
        }),
        description: fields.text({
          label: 'Descrição (SEO)',
          multiline: true,
        }),
        showInMenu: fields.checkbox({
          label: 'Exibir no menu de navegação',
          defaultValue: true,
        }),
        menuLabel: fields.text({
          label: 'Rótulo no menu',
          description: 'Deixe em branco para usar o título da página.',
        }),
        menuOrder: fields.integer({
          label: 'Ordem no menu (menor = primeiro)',
          defaultValue: 99,
        }),
        draft: fields.checkbox({
          label: 'Rascunho (não publicar)',
          defaultValue: false,
        }),
        content: fields.mdx({
          label: 'Conteúdo',
          options: {
            formatting: true,
            links: true,
            images: {
              directory: 'src/assets/pages',
              publicPath: '@/assets/pages',
            },
          },
        }),
      },
    }),
    blog: collection({
      label: 'Artigos do Blog',
      slugField: 'slug',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'form',
      schema: {
        // ── Identidade ──────────────────────────────────────────────────
        slug: fields.text({
          label: 'Slug (URL do post)',
          description: 'Identificador único na URL: /blog/<slug>. Use letras minúsculas, números e hífens. Alterar muda a URL — faça isso antes de publicar.',
          validation: { length: { min: 1 } },
        }),
        title: fields.text({
          label: 'H1 — Título visível na página',
          description: 'Texto do cabeçalho principal exibido no artigo.',
          validation: { length: { min: 1 } },
        }),
        metaTitle: fields.text({
          label: 'Meta Title — Título para o Google (opcional)',
          description: 'Se preenchido, substitui o H1 na aba do browser e no resultado do Google. Deixe vazio para usar o H1. Recomendado: ≤60 caracteres, com palavra-chave no início.',
        }),
        description: fields.text({
          label: 'Meta Description (SEO)',
          description: 'Aparece nos cards de listagem e no resultado do Google. Recomendado: 120–160 caracteres.',
          multiline: true,
        }),
        // ── Publicação ───────────────────────────────────────────────────
        publishedAt: fields.date({
          label: 'Data de Publicação',
          description: 'Data futura = post programado — fica invisível em produção até o próximo deploy após essa data.',
        }),
        author: fields.text({
          label: 'Autor',
          defaultValue: 'Monto IA',
        }),
        locale: fields.select({
          label: 'Idioma do artigo',
          defaultValue: 'pt-br',
          options: [
            { label: 'Português (pt-br)', value: 'pt-br' },
            { label: 'English (en)', value: 'en' },
          ],
        }),
        draft: fields.checkbox({
          label: 'Rascunho — oculto no site em produção',
          defaultValue: false,
        }),
        featured: fields.checkbox({
          label: 'Destaque (aparece em evidência na home)',
          defaultValue: false,
        }),
        // ── Categorias ───────────────────────────────────────────────────
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags / Categorias',
          itemLabel: (props) => props.value,
        }),
        // ── Imagem de capa ───────────────────────────────────────────────
        svgSlug: fields.text({
          label: 'SVG Slug da capa (nome do arquivo sem extensão)',
          description: 'Ex: "blog-com-producao-por-ia" → usa src/assets/blog/{slug}.svg',
        }),
        imageAlt: fields.text({
          label: 'Alt text da imagem de capa',
        }),
        image: fields.image({
          label: 'Imagem de capa alternativa (upload — substitui o SVG Slug)',
          directory: 'src/assets/blog',
          publicPath: '../../assets/blog/',
        }),
        // ── Opções avançadas ─────────────────────────────────────────────
        toc: fields.checkbox({
          label: 'Ocultar sumário (Table of Contents) neste post',
          defaultValue: false,
        }),
        comments: fields.checkbox({
          label: 'Ocultar comentários neste post',
          defaultValue: false,
        }),
        // ── Conteúdo ─────────────────────────────────────────────────────
        content: fields.mdx({
          label: 'Corpo do Artigo',
          options: {
            formatting: true,
            links: true,
            images: {
              directory: 'src/assets/blog',
              publicPath: '@/assets/blog',
            },
          },
        }),
      },
    }),
  },
  singletons: {
    profile: singleton({
      label: 'Perfil do Negócio',
      path: 'src/content/profile/profile',
      format: { data: 'json' },
      schema: {
        nomeNegocio: fields.text({
          label: 'Nome do negócio',
          defaultValue: 'Monto IA',
        }),
        descricao: fields.text({
          label: 'Descrição curta (usada no SEO e compartilhamentos)',
          multiline: true,
        }),
        email: fields.text({
          label: 'E-mail de contato',
          description: 'Aparece no rodapé, página de contato e Schema do Google.',
          defaultValue: 'contato@monto.ia.br',
        }),
        telefone: fields.text({
          label: 'Telefone',
          description: 'Formato: (11) 99999-9999 — deixe em branco se não usar.',
        }),
        whatsapp: fields.text({
          label: 'WhatsApp (com DDI)',
          description: 'Formato: +5511999999999 — usado para links wa.me/.',
        }),
        cidade: fields.text({
          label: 'Cidade',
          defaultValue: 'São Paulo',
        }),
        estado: fields.text({
          label: 'Estado (sigla)',
          defaultValue: 'SP',
        }),
        atendimento: fields.text({
          label: 'Nota de atendimento',
          description: 'Exibida na página de contato e rodapé.',
          defaultValue: 'Remoto para todo o Brasil',
        }),
        redesSociais: fields.array(
          fields.text({ label: 'URL da rede social' }),
          {
            label: 'Redes sociais',
            description: 'Cole a URL completa de cada perfil (Instagram, LinkedIn, etc.).',
            itemLabel: (props) => props.value || 'Nova rede social',
          },
        ),
      },
    }),
    testimonials: singleton({
      label: 'Página de Depoimentos',
      path: 'src/content/pages/testimonials',
      format: { data: 'json' },
      schema: {
        showInMenu: fields.checkbox({
          label: 'Exibir no menu de navegação',
          defaultValue: true,
        }),
        // ── PT-BR ──────────────────────────────────────────────────────
        ptBadge: fields.text({ label: '[PT] Badge do Hero', defaultValue: 'Resultados reais' }),
        ptHeroTitle: fields.text({ label: '[PT] Título do Hero (parte 1)', defaultValue: 'O que dizem os clientes dos' }),
        ptHeroTitleBrand: fields.text({ label: '[PT] Título do Hero (destaque)', defaultValue: 'nossos projetos' }),
        ptHeroDescription: fields.text({
          label: '[PT] Descrição do Hero', multiline: true,
          defaultValue: 'Avaliações reais do Google de clientes dos projetos desenvolvidos pela Monto IA. Resultados mensuráveis, não promessas.',
        }),
        ptRatingLabel: fields.text({ label: '[PT] Label da nota média', defaultValue: 'Nota média no Google' }),
        ptReviewsLabel: fields.text({ label: '[PT] Label de avaliações', defaultValue: 'Avaliações verificadas' }),
        ptStarsLabel: fields.text({ label: '[PT] Label de estrelas', defaultValue: '100% de 5 estrelas' }),
        ptSectionBadge: fields.text({ label: '[PT] Badge da seção de reviews', defaultValue: 'Avaliações no Google' }),
        ptSectionTitle: fields.text({ label: '[PT] Título da seção de reviews', defaultValue: 'Clientes dos projetos que desenvolvemos' }),
        ptSectionDescription: fields.text({
          label: '[PT] Descrição da seção de reviews', multiline: true,
          defaultValue: 'Avaliações reais e verificadas, importadas diretamente do Google.',
        }),
        ptViewAllButton: fields.text({ label: '[PT] Botão "Ver todos no Google"', defaultValue: 'Ver todos no Google' }),
        ptCtaTitle: fields.text({ label: '[PT] Título do CTA', defaultValue: 'Quer resultados assim para o seu negócio?' }),
        ptCtaDescription: fields.text({
          label: '[PT] Descrição do CTA', multiline: true,
          defaultValue: 'Vamos entender o seu projeto e ver o que faz sentido — site, SEO, automação ou tudo junto.',
        }),
        ptCtaButton1: fields.text({ label: '[PT] Botão CTA principal', defaultValue: 'Falar com a Monto IA' }),
        ptCtaButton2: fields.text({ label: '[PT] Botão CTA secundário', defaultValue: 'Ver projetos entregues' }),
        // ── EN ─────────────────────────────────────────────────────────
        enBadge: fields.text({ label: '[EN] Hero Badge', defaultValue: 'Real results' }),
        enHeroTitle: fields.text({ label: '[EN] Hero Title (part 1)', defaultValue: 'What clients say about' }),
        enHeroTitleBrand: fields.text({ label: '[EN] Hero Title (highlight)', defaultValue: 'our projects' }),
        enHeroDescription: fields.text({
          label: '[EN] Hero Description', multiline: true,
          defaultValue: 'Real Google reviews from clients of projects developed by Monto IA. Measurable results, not promises.',
        }),
        enRatingLabel: fields.text({ label: '[EN] Rating label', defaultValue: 'Google average rating' }),
        enReviewsLabel: fields.text({ label: '[EN] Reviews label', defaultValue: 'Verified reviews' }),
        enStarsLabel: fields.text({ label: '[EN] Stars label', defaultValue: '100% five stars' }),
        enSectionBadge: fields.text({ label: '[EN] Section badge', defaultValue: 'Google Reviews' }),
        enSectionTitle: fields.text({ label: '[EN] Section title', defaultValue: "Clients of the projects we've built" }),
        enSectionDescription: fields.text({
          label: '[EN] Section description', multiline: true,
          defaultValue: 'Real, verified reviews imported directly from Google.',
        }),
        enViewAllButton: fields.text({ label: '[EN] "See all on Google" button', defaultValue: 'See all on Google' }),
        enCtaTitle: fields.text({ label: '[EN] CTA title', defaultValue: 'Want results like these for your business?' }),
        enCtaDescription: fields.text({
          label: '[EN] CTA description', multiline: true,
          defaultValue: "Let's understand your project and figure out what makes sense — website, SEO, automation, or all of it.",
        }),
        enCtaButton1: fields.text({ label: '[EN] CTA primary button', defaultValue: 'Talk to Monto IA' }),
        enCtaButton2: fields.text({ label: '[EN] CTA secondary button', defaultValue: 'See delivered projects' }),
      },
    }),
    contact: singleton({
      label: 'Página de Contato',
      path: 'src/content/pages/contact',
      format: { data: 'json' },
      schema: {
        showInMenu: fields.checkbox({
          label: 'Exibir no menu de navegação',
          defaultValue: true,
        }),
        // ── PT-BR ──────────────────────────────────────────────────────
        ptBadge: fields.text({
          label: '[PT] Badge do Hero',
          defaultValue: 'Comece um projeto',
        }),
        ptHeroTitle: fields.text({
          label: '[PT] Título do Hero (parte 1)',
          defaultValue: 'Conte sobre o seu',
        }),
        ptHeroTitleBrand: fields.text({
          label: '[PT] Título do Hero (palavra destaque — brand color)',
          defaultValue: 'projeto',
        }),
        ptHeroDescription: fields.text({
          label: '[PT] Descrição do Hero',
          multiline: true,
          defaultValue: 'Compartilhe alguns detalhes abaixo e retornamos em até 1 dia útil. Prefere outro canal? Escolha o que for melhor para você.',
        }),
        ptFormTitle: fields.text({
          label: '[PT] Título do card do formulário',
          defaultValue: 'Envie uma mensagem',
        }),
        ptChannelsTitle: fields.text({
          label: '[PT] Título "Outros canais"',
          defaultValue: 'Outros canais',
        }),
        ptChannelsDescription: fields.text({
          label: '[PT] Descrição "Outros canais"',
          defaultValue: 'Prefere um canal direto? Escolha o que for melhor para você.',
        }),
        ptLocationNote: fields.text({
          label: '[PT] Nota de localização / atendimento',
          defaultValue: 'Atendimento remoto para todo o Brasil',
        }),
        // ── EN ─────────────────────────────────────────────────────────
        enBadge: fields.text({
          label: '[EN] Hero Badge',
          defaultValue: 'Start a project',
        }),
        enHeroTitle: fields.text({
          label: '[EN] Hero Title (part 1)',
          defaultValue: 'Tell me about your',
        }),
        enHeroTitleBrand: fields.text({
          label: '[EN] Hero Title (brand highlight word)',
          defaultValue: 'project',
        }),
        enHeroDescription: fields.text({
          label: '[EN] Hero Description',
          multiline: true,
          defaultValue: "Share a few details below and I'll get back to you within 1 business day. Prefer a different channel? Pick whichever works best.",
        }),
        enFormTitle: fields.text({
          label: '[EN] Form card title',
          defaultValue: 'Send a message',
        }),
        enChannelsTitle: fields.text({
          label: '[EN] "Other channels" title',
          defaultValue: 'Other channels',
        }),
        enChannelsDescription: fields.text({
          label: '[EN] "Other channels" description',
          defaultValue: 'Prefer a direct channel? Pick whichever works best.',
        }),
        enLocationNote: fields.text({
          label: '[EN] Location / service note',
          defaultValue: 'Remote service worldwide',
        }),
      },
    }),
  },
});