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
        path: "content/page", // Questo corrisponde alla cartella 'content/page' che vedo nel tuo screenshot
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titolo Pagina",
            isTitle: true,
            required: true,
          },
          // QUI DEFINIAMO LE TILES
          {
            label: "Tiles (Piastrelle)",
            name: "tiles",
            type: "object",
            list: true,
            ui: {
              itemProps: (item) => {
                return { label: item.title || 'Nuova Card' }
              },
            },
            fields: [
              {
                type: "string",
                label: "Stile Card",
                name: "type",
                options: [
                  { label: "Standard (Bianco)", value: "standard" },
                  { label: "Modo di Dire (Rosso)", value: "idiom" },
                  { label: "Barzelletta (Grigio)", value: "joke" },
                ],
              },
              { type: "string", label: "Categoria", name: "category" },
              { type: "string", label: "Titolo Principale", name: "title" },
              { type: "string", label: "Contenuto Testuale", name: "content", ui: { component: "textarea" } },
              { type: "string", label: "Punti Elenco", name: "points", list: true },
              { type: "string", label: "Testo del Link", name: "linkText" },
            ],
          }
        ],
      },
    ],
  },
});
