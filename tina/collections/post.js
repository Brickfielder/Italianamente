/**
 * @type {import('tinacms').Collection}
 */
export default {
  label: "Blog Posts",
  name: "post",
  path: "content",
  match: {
    include: "{grammar,culture,multimedia}/*.mdx",
  },
  fields: [
    {
      type: "string",
      label: "Title",
      name: "title",
    },
    {
      type: "string",
      label: "Category",
      name: "category",
    },
    {
      type: "string",
      label: "Tags",
      name: "tags",
      list: true,
    },
    {
      type: "image",
      label: "Image",
      name: "image",
    },
    {
      type: "number",
      label: "Image Width (px)",
      name: "imageWidth",
      description: "Optional display width for the post image.",
    },
    {
      type: "number",
      label: "Image Height (px)",
      name: "imageHeight",
      description: "Optional display height for the post image.",
    },
    {
      type: "rich-text",
      label: "Blog Post Body",
      name: "body",
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
      return `/posts/${document._sys.filename}`;
    },
  },
};
