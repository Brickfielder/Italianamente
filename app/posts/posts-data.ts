import { client } from "../../tina/__generated__/client";

export type PostListItem = {
  title?: string | null;
  category?: string | null;
  tags?: string[] | null;
  body?: unknown;
  _sys?: {
    filename?: string | null;
    breadcrumbs?: string[] | null;
    relativePath?: string | null;
  } | null;
};

export const fetchPosts = async () => {
  const res = await client.queries.postConnection({
    query: `query PostsPage {
      postConnection {
        edges {
          node {
            title
            category
            tags
            body
            _sys {
              filename
              breadcrumbs
              relativePath
            }
          }
        }
      }
    }`,
  });

  return (
    res.data.postConnection.edges?.map((edge) => edge?.node).filter(Boolean) ??
    []
  ) as PostListItem[];
};
