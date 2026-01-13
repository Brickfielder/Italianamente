import { defineConfig } from "tinacms";

// Configurazione standard
const branch = process.env.NEXT_PUBLIC_TINA_BRANCH || "main";

const postFields = [
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
    type: "rich-text",
    name: "body",
    label: "Contenuto",
    isBody: true,
  },
];

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
          {
            type: "rich-text",
            name: "body",
            label: "Contenuto",
            isBody: true,
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
                type: "reference",
                name: "postReference",
                label: "Post di riferimento (opzionale)",
                collections: ["grammar", "culture", "multimedia"],
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
        name: "grammar",
        label: "Grammatica",
        path: "content/grammar",
        format: "mdx",
        fields: postFields,
        ui: {
          router: ({ document }) => {
            return `/grammar/${document._sys.filename}`;
          },
        },
      },
      {
        name: "culture",
        label: "Cultura",
        path: "content/culture",
        format: "mdx",
        fields: postFields,
        ui: {
          router: ({ document }) => {
            return `/culture/${document._sys.filename}`;
          },
        },
      },
      {
        name: "multimedia",
        label: "Multimedia",
        path: "content/multimedia",
        format: "mdx",
        fields: postFields,
        ui: {
          router: ({ document }) => {
            return `/multimedia/${document._sys.filename}`;
          },
        },
      },
    ],
  },
});
