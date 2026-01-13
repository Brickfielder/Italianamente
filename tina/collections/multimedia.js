/**
 * @type {import('tinacms').Collection}
 */
export default {
  label: "Multimedia",
  name: "multimedia",
  path: "content/multimedia",
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
      type: "rich-text",
      label: "Body",
      name: "body",
      isBody: true,
    },
  ],
  ui: {
    router: ({ document }) => {
      return `/multimedia/${document._sys.filename}`;
    },
  },
};
