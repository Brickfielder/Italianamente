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
      type: "rich-text",
      label: "Blog Post Body",
      name: "body",
      isBody: true,
    },
  ],
  ui: {
    router: ({ document }) => {
      return `/posts/${document._sys.filename}`;
    },
  },
};
