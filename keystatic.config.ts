import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: { name: 'Monto IA Matrix' },
    // 🌟 Organiza o menu lateral do painel com nomes em português
    navigation: {
      'Conteúdo Dinâmico': ['blog'],
      'Páginas Fixas (Blindadas)': ['contact'],
    },
  },
  collections: {
    // 🌟 MAPEAMENTO COMPLETO DA COLECÃO DO BLOG
    blog: collection({
      label: 'Artigos do Blog',
      slugField: 'title', // Transforma o título na URL automaticamente (slug)
      path: 'src/content/blog/*', // Caminho dos arquivos verificado no seu dir.txt
      format: { contentField: 'content' }, // Diz que o corpo do MDX será o campo 'content'
      entryLayout: 'content', // Abre o editor em tela cheia (estilo Medium/Notion)
      schema: {
        title: fields.text({ 
          label: 'Título do Artigo',
          validation: { length: { min: 1 } }
        }),
        description: fields.text({ 
          label: 'Resumo / Subtítulo (Aparece nos Cards e no SEO)',
        }),
        pubDate: fields.date({ 
          label: 'Data de Publicação',
        }),
        tags: fields.array(fields.text({ label: 'Nome da Tag' }), {
          label: 'Tags / Categorias',
          itemLabel: (props) => props.value,
        }),
        // O editor de texto rico que manipula o código MDX puro nos bastidores
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
    contact: singleton({
      label: 'Página de Contato',
      path: 'src/content/pages/contact',
      format: { data: 'json' },
      schema: {
        title: fields.text({ label: 'Título Principal (Seção 1)' }),
        description: fields.document({
          label: 'Descrição / Subtexto (Seção 1)',
          formatting: true,
          links: true,
        }),
        email: fields.text({ label: 'E-mail de Atendimento' }),
        linkedin: fields.url({ label: 'Link do LinkedIn' }),
        location: fields.text({ label: 'Texto de Localização' }),
      },
    }),
  },
});