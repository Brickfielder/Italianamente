import { defineConfig } from "tinacms";

// Configurazione standard
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
      publicFolder: "public",
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
          // QUI INIZIA LA MAGIA DELLE TILES
          {
            type: "object",
            list: true,
            name: "tiles",
            label: "Griglia di Card (Tiles)",
            ui: {
              // Questo fa vedere il titolo della card nella lista invece di "Item 1"
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
      },
    ],
  },
});