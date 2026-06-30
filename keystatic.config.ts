import { config, fields, collection, singleton } from '@keystatic/core';

const isDev = process.env.NODE_ENV === 'development';

export default config({
  storage: isDev
    ? { kind: 'local' }
    : { kind: 'cloud' },
  cloud: {
    project: 'monto-ia/institucional',
  },
  ui: {
    brand: { name: 'Monto IA' },
    navigation: {
      'Configurações': ['profile'],
      'Conteúdo Dinâmico': ['blog', 'customPages', 'services'],
      'Páginas Fixas (Blindadas)': ['blogPage', 'sobre', 'servicosPage', 'contact', 'testimonials', 'privacyPolicy', 'localizacao'],
    },
  },
  collections: {
    // ── SERVIÇOS ────────────────────────────────────────────────────────────
    services: collection({
      label: 'Serviços',
      slugField: 'slug',
      path: 'src/content/services/*',
      format: { contentField: 'content' },
      entryLayout: 'form',
      schema: {
        // ── Identidade ──────────────────────────────────────────────────────
        slug: fields.text({
          label: 'Slug (URL do serviço)',
          description: 'Identificador único. Use letras minúsculas e hífens. Não altere após publicar.',
          validation: { length: { min: 1 } },
        }),
        title: fields.text({
          label: 'Título do Serviço',
          validation: { length: { min: 1 } },
        }),
        description: fields.text({
          label: 'Descrição (SEO)',
          description: 'Aparece nos cards e nos metadados. Recomendado: 120–160 caracteres.',
          multiline: true,
        }),
        icon: fields.text({
          label: 'Ícone (nome do heroicon)',
          description: 'Ex: layout, search, pen-tool, workflow, message-circle, cpu-chip',
          defaultValue: 'sparkles',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags / Categorias',
          itemLabel: (props) => props.value,
        }),
        image: fields.image({
          label: 'Imagem de capa — 1200×675 px (16:9)',
          directory: 'src/assets/services',
          publicPath: '@/assets/services/',
        }),
        imageAlt: fields.text({
          label: 'Alt text da imagem',
        }),
        featured: fields.checkbox({
          label: 'Destaque (aparece em evidência)',
          defaultValue: false,
        }),
        order: fields.integer({
          label: 'Ordem de exibição (menor = primeiro)',
          defaultValue: 99,
        }),
        locale: fields.select({
          label: 'Idioma',
          defaultValue: 'pt-br',
          options: [
            { label: 'Português (pt-br)', value: 'pt-br' },
            { label: 'English (en)', value: 'en' },
          ],
        }),
        ctaText: fields.text({
          label: 'Texto do botão CTA',
          description: 'Ex: "Quero um site profissional"',
        }),
        ctaHref: fields.text({
          label: 'Link do CTA',
          defaultValue: '/contato',
        }),
        // ── CORE: visibilidade e indexação ──────────────────────────────────
        showInNav: fields.checkbox({
          label: 'Exibir no submenu "Serviços"',
          description: 'Aparece como item no dropdown de Serviços no menu principal.',
          defaultValue: true,
        }),
        draft: fields.checkbox({
          label: 'Rascunho — oculto em produção',
          defaultValue: false,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          defaultValue: false,
        }),
        // ── Conteúdo ────────────────────────────────────────────────────────
        content: fields.mdx({
          label: 'Conteúdo do Serviço',
          options: {
            formatting: true,
            links: true,
            images: {
              directory: 'src/assets/services',
              publicPath: '@/assets/services',
            },
          },
        }),
      },
    }),

    // ── PÁGINAS LIVRES ──────────────────────────────────────────────────────
    customPages: collection({
      label: 'Páginas Livres',
      slugField: 'slug',
      path: 'src/content/custom-pages/*',
      format: { contentField: 'content' },
      entryLayout: 'form',
      schema: {
        // ── Identidade ──────────────────────────────────────────────────────
        slug: fields.text({
          label: 'Slug (URL da página)',
          description: 'Identificador único na URL. Ex: parceiros. Não altere após publicar.',
          validation: { length: { min: 1 } },
        }),
        title: fields.text({
          label: 'Título da Página (PT)',
          validation: { length: { min: 1 } },
        }),
        description: fields.text({
          label: 'Descrição (SEO — PT)',
          multiline: true,
        }),
        // ── CORE: menu PT ───────────────────────────────────────────────────
        showInMenu: fields.checkbox({
          label: 'Exibir no menu',
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
        // ── CORE: controles gerais ──────────────────────────────────────────
        draft: fields.checkbox({
          label: 'Rascunho — oculto em produção',
          defaultValue: false,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          description: 'Marque para que o Google não indexe esta página.',
          defaultValue: false,
        }),
        // ── Versão em inglês (opcional) ─────────────────────────────────────
        showInMenuEn: fields.checkbox({
          label: 'Exibir no menu EN',
          description: 'Só aparece no menu inglês se "Conteúdo EN" também estiver preenchido.',
          defaultValue: false,
        }),
        enTitle: fields.text({ label: '[EN] Título da página' }),
        enMenuLabel: fields.text({
          label: '[EN] Rótulo no menu',
          description: 'Deixe em branco para usar o [EN] Título.',
        }),
        enDescription: fields.text({
          label: '[EN] Descrição (SEO)',
          multiline: true,
        }),
        enContent: fields.text({
          label: '[EN] Conteúdo (Markdown — suporta tabelas, negrito, links)',
          multiline: true,
        }),
        // ── Conteúdo PT ─────────────────────────────────────────────────────
        content: fields.mdx({
          label: '[PT] Conteúdo',
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

    // ── BLOG ────────────────────────────────────────────────────────────────
    blog: collection({
      label: 'Artigos do Blog',
      slugField: 'slug',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'form',
      schema: {
        // ── Identidade ──────────────────────────────────────────────────────
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
          label: 'Descrição (SEO)',
          description: 'Aparece nos cards de listagem e no resultado do Google. Recomendado: 120–160 caracteres.',
          multiline: true,
        }),
        // ── Publicação ───────────────────────────────────────────────────────
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
        // ── CORE: visibilidade ───────────────────────────────────────────────
        draft: fields.checkbox({
          label: 'Rascunho — oculto em produção',
          defaultValue: false,
        }),
        featured: fields.checkbox({
          label: 'Destaque (aparece em evidência na home)',
          defaultValue: false,
        }),
        // ── Categorias ───────────────────────────────────────────────────────
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags / Categorias',
          itemLabel: (props) => props.value,
        }),
        // ── Imagem de capa ───────────────────────────────────────────────────
        svgSlug: fields.text({
          label: 'SVG Slug da capa (nome do arquivo sem extensão)',
          description: 'Ex: "blog-com-producao-por-ia" → usa src/assets/blog/{slug}.svg',
        }),
        imageAlt: fields.text({ label: 'Alt text da imagem de capa' }),
        image: fields.image({
          label: 'Imagem de capa alternativa (upload — substitui o SVG Slug)',
          directory: 'src/assets/blog',
          publicPath: '../../assets/blog/',
        }),
        // ── Opções avançadas ─────────────────────────────────────────────────
        toc: fields.checkbox({
          label: 'Ocultar sumário (Table of Contents) neste post',
          defaultValue: false,
        }),
        comments: fields.checkbox({
          label: 'Ocultar comentários neste post',
          defaultValue: false,
        }),
        // ── Conteúdo ─────────────────────────────────────────────────────────
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
    // ── PÁGINA DO BLOG (Blindada) ───────────────────────────────────────────
    blogPage: singleton({
      label: 'Página do Blog',
      path: 'src/content/pages/blog-page',
      format: { data: 'json' },
      schema: {
        // ── CORE ────────────────────────────────────────────────────────────
        showInMenu: fields.checkbox({
          label: 'Exibir no menu',
          defaultValue: true,
        }),
        menuLabel: fields.text({
          label: 'Rótulo no menu',
          description: 'Deixe em branco para usar "Blog".',
        }),
        menuOrder: fields.integer({
          label: 'Ordem no menu (menor = primeiro)',
          defaultValue: 1,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          defaultValue: false,
        }),
        // ── Conteúdo PT-BR ──────────────────────────────────────────────────
        ptTitle: fields.text({
          label: '[PT] Título da página (H1 + aba do browser)',
          defaultValue: 'Blog',
        }),
        ptDescription: fields.text({
          label: '[PT] Descrição (SEO + introdução do hero)',
          description: 'Usada no Google e como texto de abertura da página.',
          multiline: true,
          defaultValue: 'Artigos sobre sites, SEO, performance e automação para o seu negócio.',
        }),
      },
    }),

    // ── SOBRE (Blindada) ────────────────────────────────────────────────────
    sobre: singleton({
      label: 'Página Sobre',
      path: 'src/content/pages/sobre',
      format: { data: 'json' },
      schema: {
        // ── CORE ────────────────────────────────────────────────────────────
        showInMenu: fields.checkbox({
          label: 'Exibir no menu',
          defaultValue: true,
        }),
        menuLabel: fields.text({
          label: 'Rótulo no menu',
          description: 'Deixe em branco para usar "Sobre".',
        }),
        menuOrder: fields.integer({
          label: 'Ordem no menu (menor = primeiro)',
          defaultValue: 4,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          defaultValue: false,
        }),
        // ── SEO PT-BR ───────────────────────────────────────────────────────
        ptMetaTitle: fields.text({
          label: '[PT] Título da aba / Google (meta title)',
          description: 'Aparece na aba do browser e nos resultados do Google. Recomendado: ≤60 caracteres.',
          defaultValue: 'Sobre a Monto IA — Sites, SEO, Ads e Automações com IA na medida',
        }),
        ptDescription: fields.text({
          label: '[PT] Descrição (SEO)',
          description: 'Aparece nos resultados do Google. Recomendado: 120–160 caracteres.',
          multiline: true,
          defaultValue: 'Conheça a Monto IA: desenvolvimento de sites como produto principal, com SEO, Ads, blog com produção por IA e automações com IA conversacional como diferenciais — na medida do seu negócio.',
        }),
        ptHeroDescription: fields.text({
          label: '[PT] Descrição do Hero (visível na página)',
          multiline: true,
          defaultValue: 'Desenvolvemos sites profissionais e cuidamos do que vem depois: SEO, Ads, blog com produção por IA, boas práticas (Lighthouse) e automações — cada peça entra no projeto pelo motivo certo.',
        }),
      },
    }),

    // ── SERVIÇOS (Blindada — página de listagem /servicos) ──────────────────
    servicosPage: singleton({
      label: 'Página de Serviços',
      path: 'src/content/pages/servicos-page',
      format: { data: 'json' },
      schema: {
        // ── CORE ────────────────────────────────────────────────────────────
        showInMenu: fields.checkbox({
          label: 'Exibir no menu',
          defaultValue: true,
        }),
        menuLabel: fields.text({
          label: 'Rótulo no menu',
          description: 'Deixe em branco para usar "Serviços".',
        }),
        menuOrder: fields.integer({
          label: 'Ordem no menu (menor = primeiro)',
          defaultValue: 3,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          defaultValue: false,
        }),
        // ── SEO PT-BR ───────────────────────────────────────────────────────
        ptMetaTitle: fields.text({
          label: '[PT] Título da aba / Google (meta title)',
          description: 'Recomendado: ≤60 caracteres.',
          defaultValue: 'Serviços — Sites, SEO, Ads, Blog com IA e Automações | Monto IA',
        }),
        ptDescription: fields.text({
          label: '[PT] Descrição (SEO)',
          description: 'Recomendado: 120–160 caracteres.',
          multiline: true,
          defaultValue: 'Desenvolvemos sites profissionais com SEO técnico, campanhas de Ads, blog com produção por IA e automações com N8N e IA conversacional. Tudo integrado, na medida do seu negócio.',
        }),
        // ── Hero PT-BR ──────────────────────────────────────────────────────
        ptHeroTitle: fields.text({
          label: '[PT] H1 do Hero (texto principal)',
          defaultValue: 'Tudo o que um negócio digital precisa,',
        }),
        ptHeroHighlight: fields.text({
          label: '[PT] H1 do Hero (palavra em destaque — cor brand)',
          defaultValue: 'integrado.',
        }),
        ptHeroDescription: fields.text({
          label: '[PT] Descrição do Hero',
          multiline: true,
          defaultValue: 'O site é o ponto de partida — o resto é o que faz ele gerar resultado de verdade. SEO, Ads, conteúdo e automação trabalhando juntos, não em silos.',
        }),
      },
    }),

    // ── LOCALIZAÇÃO (Blindada) ──────────────────────────────────────────────
    localizacao: singleton({
      label: 'Página de Localização',
      path: 'src/content/pages/localizacao',
      format: { data: 'json' },
      schema: {
        // ── CORE ────────────────────────────────────────────────────────────
        showInMenu: fields.checkbox({
          label: 'Exibir no menu',
          defaultValue: false,
        }),
        menuLabel: fields.text({
          label: 'Rótulo no menu',
          description: 'Deixe em branco para usar "Localização".',
        }),
        menuOrder: fields.integer({
          label: 'Ordem no menu (menor = primeiro)',
          defaultValue: 99,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          description: 'Recomendado manter ativado enquanto o endereço não estiver completo.',
          defaultValue: true,
        }),
        // ── PT-BR ────────────────────────────────────────────────────────────
        ptTitle: fields.text({
          label: '[PT] Título da página',
          defaultValue: 'Localização',
        }),
        ptDescription: fields.text({
          label: '[PT] Descrição (SEO)',
          multiline: true,
          defaultValue: 'Estamos em São Paulo, SP, e atendemos clientes remotamente em todo o Brasil.',
        }),
        ptHeroTitle: fields.text({
          label: '[PT] Título do Hero (H1)',
          defaultValue: 'São Paulo, SP.',
        }),
        ptHeroDescription: fields.text({
          label: '[PT] Descrição do Hero',
          multiline: true,
          defaultValue: 'Atendimento remoto para todo o Brasil.',
        }),
        ptAddress: fields.text({
          label: '[PT] Endereço',
          description: 'Endereço físico ou cidade/estado de referência.',
        }),
        ptMapEmbedUrl: fields.text({
          label: '[PT] URL de incorporação do mapa (Google Maps embed)',
          description: 'Cole o src do iframe gerado pelo Google Maps. Deixe em branco para ocultar o mapa.',
        }),
        ptServiceArea: fields.text({
          label: '[PT] Área de atendimento',
          multiline: true,
          defaultValue: 'Atendemos clientes de forma remota em todo o território nacional.',
        }),
        ptHours: fields.text({
          label: '[PT] Horário de atendimento',
          description: 'Ex: Seg a Sex, 9h às 18h. Deixe em branco para não exibir.',
        }),
        // ── EN ───────────────────────────────────────────────────────────────
        enTitle: fields.text({
          label: '[EN] Page title',
          defaultValue: 'Location',
        }),
        enDescription: fields.text({
          label: '[EN] Description (SEO)',
          multiline: true,
          defaultValue: "We're based in São Paulo, Brazil, and serve clients remotely throughout the country.",
        }),
        enHeroTitle: fields.text({
          label: '[EN] Hero title (H1)',
          defaultValue: 'São Paulo, Brazil.',
        }),
        enHeroDescription: fields.text({
          label: '[EN] Hero description',
          multiline: true,
          defaultValue: 'Remote service worldwide.',
        }),
        enAddress: fields.text({ label: '[EN] Full address' }),
        enMapEmbedUrl: fields.text({ label: '[EN] Map embed URL' }),
        enServiceArea: fields.text({
          label: '[EN] Service area',
          multiline: true,
          defaultValue: 'We serve clients remotely anywhere in Brazil and internationally.',
        }),
        enHours: fields.text({
          label: '[EN] Business hours',
          description: 'Leave empty to hide.',
        }),
      },
    }),

    // ── PERFIL DO NEGÓCIO ───────────────────────────────────────────────────
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
        calendly: fields.text({
          label: 'Link Calendly',
          description: 'URL completa do agendamento. Ex: https://calendly.com/seu-usuario/30min',
        }),
      },
    }),

    // ── DEPOIMENTOS (Blindada) ──────────────────────────────────────────────
    testimonials: singleton({
      label: 'Página de Depoimentos',
      path: 'src/content/pages/testimonials',
      format: { data: 'json' },
      schema: {
        // ── CORE: menu e indexação ───────────────────────────────────────────
        showInMenu: fields.checkbox({
          label: 'Exibir no menu',
          defaultValue: true,
        }),
        menuLabel: fields.text({
          label: 'Rótulo no menu',
          description: 'Deixe em branco para usar "Depoimentos".',
        }),
        menuOrder: fields.integer({
          label: 'Ordem no menu (menor = primeiro)',
          defaultValue: 5,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          defaultValue: false,
        }),
        // ── PT-BR ────────────────────────────────────────────────────────────
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
        // ── EN ───────────────────────────────────────────────────────────────
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

    // ── CONTATO (Blindada) ──────────────────────────────────────────────────
    contact: singleton({
      label: 'Página de Contato',
      path: 'src/content/pages/contact',
      format: { data: 'json' },
      schema: {
        // ── CORE: menu e indexação ───────────────────────────────────────────
        showInMenu: fields.checkbox({
          label: 'Exibir no menu',
          defaultValue: true,
        }),
        menuLabel: fields.text({
          label: 'Rótulo no menu',
          description: 'Deixe em branco para usar "Contato".',
        }),
        menuOrder: fields.integer({
          label: 'Ordem no menu (menor = primeiro)',
          defaultValue: 6,
        }),
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          defaultValue: false,
        }),
        // ── PT-BR ────────────────────────────────────────────────────────────
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
        // ── EN ───────────────────────────────────────────────────────────────
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

    // ── POLÍTICA DE PRIVACIDADE (Blindada) ─────────────────────────────────
    privacyPolicy: singleton({
      label: 'Política de Privacidade',
      path: 'src/content/pages/privacy-policy',
      format: { data: 'json' },
      schema: {
        // ── CORE: indexação ─────────────────────────────────────────────────
        noIndex: fields.checkbox({
          label: 'Não indexar no Google (noindex)',
          description: 'Recomendado manter ativado — política de privacidade não deve aparecer no Google.',
          defaultValue: true,
        }),
        // ── PT-BR ────────────────────────────────────────────────────────────
        ptTitle: fields.text({
          label: '[PT] Título da página',
          defaultValue: 'Política de Privacidade',
        }),
        ptDescription: fields.text({
          label: '[PT] Descrição (SEO)',
          multiline: true,
        }),
        ptContent: fields.text({
          label: '[PT] Conteúdo (Markdown — suporta tabelas, negrito, links, listas)',
          multiline: true,
        }),
        // ── EN ───────────────────────────────────────────────────────────────
        enTitle: fields.text({
          label: '[EN] Page title',
          defaultValue: 'Privacy Policy',
        }),
        enDescription: fields.text({
          label: '[EN] Description (SEO)',
          multiline: true,
        }),
        enContent: fields.text({
          label: '[EN] Content (Markdown — supports tables, bold, links, lists)',
          multiline: true,
        }),
      },
    }),
  },
});
