import { defineConfig } from "tinacms";

// Standard Configuration
const branch = process.env.NEXT_PUBLIC_TINA_BRANCH || "main";

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: ".",
    },
  },
  schema: {
    collections: [
      {
        name: "page",
        label: "Sito Web",
        path: "content/page",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titolo Pagina",
            isTitle: true,
            required: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Contenuto",
            isBody: true,
          },
          // TILES CONFIGURATION
          {
            type: "object",
            list: true,
            name: "tiles",
            label: "Griglia di Card (Tiles)",
            ui: {
              itemProps: (item) => {
                return { label: item.title || 'Nuova Card' }
              },
            },
            fields: [
              {
                type: "string",
                name: "style",
                label: "Stile Grafico",
                options: [
                  { label: "Standard (Bianco)", value: "standard" },
                  { label: "Modo di Dire (Rosso)", value: "idiom" },
                  { label: "Barzelletta (Grigio)", value: "joke" },
                ],
              },
              {
                type: "string",
                name: "category",
                label: "Categoria (es. Grammatica)",
              },
              {
                type: "string",
                name: "title",
                label: "Titolo Principale",
              },
              {
                type: "reference",
                name: "postReference",
                label: "Post di riferimento (opzionale)",
                collections: ["post"],
              },
              {
                type: "string",
                name: "description",
                label: "Testo Descrittivo (Opzionale)",
                ui: { component: "textarea" },
              },
              {
                type: "string",
                name: "bulletPoints",
                label: "Punti Elenco (Lista)",
                list: true,
              },
              {
                type: "string",
                name: "buttonText",
                label: "Testo del Link (es. Leggi di più)",
              },
            ],
          },
        ],
        ui: {
          router: ({ document }) => {
            if (document._sys.filename === "home") {
              return `/`;
            }
            if (document._sys.filename === "about") {
              return `/about`;
            }
            return undefined;
          },
        },
      },
      {
        name: "post",
        label: "Post",
        path: "content", // Root content folder
        match: {
            include: "{grammar,culture,multimedia}/*.mdx",
        },
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titolo",
            required: true,
            isTitle: true,
          },
          {
            type: "string",
            name: "category",
            label: "Categoria",
            options: [
              "Grammatica",
              "Prossima vacanza",
              "Modo di dire",
              "Barzelletta",
              "Ricetta",
              "Film",
            ],
            required: true,
          },
          {
            type: "string",
            name: "tags",
            label: "Tag",
            list: true,
          },
          {
            type: "image",
            name: "image",
            label: "Immagine",
          },
          {
            type: "number",
            name: "imageWidth",
            label: "Larghezza immagine (px)",
            description: "Facoltativo: larghezza di visualizzazione dell'immagine.",
          },
          {
            type: "number",
            name: "imageHeight",
            label: "Altezza immagine (px)",
            description: "Facoltativo: altezza di visualizzazione dell'immagine.",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Contenuto",
            isBody: true,
            templates: [
              {
                name: "spacer",
                label: "Spazio",
                fields: [
                  {
                    type: "string",
                    name: "size",
                    label: "Dimensione",
                    options: [
                      { label: "Piccolo", value: "sm" },
                      { label: "Medio", value: "md" },
                      { label: "Grande", value: "lg" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        ui: {
          router: ({ document }) => {
            // CRITICAL CHANGE: Use breadcrumbs to include the subfolder (e.g. 'culture/barzelletta')
            // This ensures the URL matches your [...slug] structure.
            return `/post/${document._sys.breadcrumbs.join("/")}`;
          },
        },
      },
    ],
  },
});
