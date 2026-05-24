import { defineConfig } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  basePath: "/",

  media: {
    tina: {
      mediaRoot: "assets/uploads",
      publicFolder: "public",
    },
  },
  
  schema: {
    collections: [
      {
        name: "pages",
        label: "Páginas Institucionais",
        path: "src/content/pages",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Título da Página",
            isTitle: true,
            required: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Conteúdo Dinâmico",
            isBody: true,
          },
        ],
      },
      {
        name: "blog",
        label: "Blog",
        path: "src/content/blog",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Título do Post",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Descrição (SEO-First)",
            required: true,
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Data de Publicação",
            required: true,
          },
          {
            type: "image",
            name: "heroImage",
            label: "Imagem de Capa (Optimized)",
          },
          {
            type: "boolean",
            name: "draft",
            label: "Rascunho? (Draft)",
          },
          {
            type: "string",
            name: "tags",
            label: "Tags / Categorias",
            list: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Conteúdo do Artigo",
            isBody: true,
          },
        ],
      },
      {
        name: "projects",
        label: "Projetos (Portfolio)",
        path: "src/content/projects",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Nome do Projeto",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Resumo do Projeto",
            required: true,
          },
          {
            type: "image",
            name: "heroImage",
            label: "Mockup / Thumbnail",
          },
          {
            type: "string",
            name: "url",
            label: "Link do Projeto Ativo",
          },
          {
            type: "string",
            name: "github",
            label: "Link do Repositório",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Estudo de Caso / Detalhes",
            isBody: true,
          },
        ],
      },
      {
        name: "stack",
        label: "Stack (Tecnologias)",
        path: "src/content/stack",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "name",
            label: "Nome da Tecnologia",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "version",
            label: "Versão / Release",
          },
          {
            type: "string",
            name: "url",
            label: "URL Oficial da Tecnologia",
          },
          {
            type: "string",
            name: "icon",
            label: "Ícone (Identificador Tabler/Iconify)",
          },
          {
            type: "string",
            name: "colorOklch",
            label: "Token de Cor (Formato OKLCH)",
          },
          {
            type: "number",
            name: "order",
            label: "Ordem de Indexação Visual",
          },
          {
            type: "string",
            name: "description",
            label: "Resumo / Pitch Técnico",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "rich-text",
            name: "body",
            label: "Documentação Detalhada",
            isBody: true,
          },
        ],
      },
      {
        name: "faqs",
        label: "Perguntas Frequentes (FAQs)",
        path: "src/content/faqs",
        format: "json",
        ui: {
          parse: (val) => ({ items: val }),
          stringify: (val) => val.items,
        },
        fields: [
          {
            type: "object",
            name: "items",
            label: "Questões do FAQ",
            list: true,
            ui: {
              itemProps: (item) => {
                return { label: item?.question || "Nova Pergunta" };
              },
            },
            fields: [
              {
                type: "string",
                name: "question",
                label: "Pergunta",
                required: true,
              },
              {
                type: "string",
                name: "answer",
                label: "Resposta",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "category",
                label: "Categoria do Grupo",
              },
              {
                type: "number",
                name: "order",
                label: "Ordem de Exibição",
              },
            ],
          },
        ],
      },
      {
        name: "authors",
        label: "Autores & Equipe",
        path: "src/content/authors",
        format: "json",
        ui: {
          parse: (val) => ({ items: val }),
          stringify: (val) => val.items,
        },
        fields: [
          {
            type: "object",
            name: "items",
            label: "Membros da Equipe",
            list: true,
            ui: {
              itemProps: (item) => {
                return { label: item?.name || "Novo Integrante" };
              },
            },
            fields: [
              {
                type: "string",
                name: "name",
                label: "Nome do Integrante / Autor",
                required: true,
              },
              {
                type: "string",
                name: "bio",
                label: "Biografia Curta",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "object",
                name: "social",
                label: "Redes Sociais (Links)",
                fields: [
                  {
                    type: "string",
                    name: "github",
                    label: "Link GitHub",
                  },
                  {
                    type: "string",
                    name: "linkedin",
                    label: "Link LinkedIn",
                  },
                  {
                    type: "string",
                    name: "twitter",
                    label: "Link Twitter / X",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});