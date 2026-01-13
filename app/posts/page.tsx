import { client } from "../../tina/__generated__/client";
import PostsPage from "./posts-page";

type PostListItem = {
  title?: string | null;
  category?: string | null;
  tags?: string[] | null;
  body?: unknown;
  _sys?: { filename?: string | null } | null;
  collection?: string | null;
};

export default async function PostsRoute() {
  const [grammarRes, cultureRes, multimediaRes] = await Promise.all([
    client.queries.grammarConnection({
      query: `query GrammarPostsPage {
        grammarConnection {
          edges {
            node {
              title
              category
              tags
              body
              _sys {
                filename
              }
            }
          }
        }
      }`,
    }),
    client.queries.cultureConnection({
      query: `query CulturePostsPage {
        cultureConnection {
          edges {
            node {
              title
              category
              tags
              body
              _sys {
                filename
              }
            }
          }
        }
      }`,
    }),
    client.queries.multimediaConnection({
      query: `query MultimediaPostsPage {
        multimediaConnection {
          edges {
            node {
              title
              category
              tags
              body
              _sys {
                filename
              }
            }
          }
        }
      }`,
    }),
  ]);

  const posts = [
    ...(grammarRes.data.grammarConnection.edges?.map((edge) =>
      edge?.node ? { ...edge.node, collection: "grammar" } : null
    ) ?? []),
    ...(cultureRes.data.cultureConnection.edges?.map((edge) =>
      edge?.node ? { ...edge.node, collection: "culture" } : null
    ) ?? []),
    ...(multimediaRes.data.multimediaConnection.edges?.map((edge) =>
      edge?.node ? { ...edge.node, collection: "multimedia" } : null
    ) ?? []),
  ].filter(Boolean);

  return <PostsPage posts={posts as PostListItem[]} />;
}
