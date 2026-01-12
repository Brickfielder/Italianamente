import { client } from "../../tina/__generated__/client";
import PostsPage from "./posts-page";

type PostListItem = {
  title?: string | null;
  category?: string | null;
  tags?: string[] | null;
  body?: unknown;
  _sys?: { filename?: string | null } | null;
};

export default async function PostsRoute() {
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
            }
          }
        }
      }
    }`,
  });

  const posts =
    res.data.postConnection.edges
      ?.map((edge) => edge?.node)
      .filter(Boolean) ?? [];

  return <PostsPage posts={posts as PostListItem[]} />;
}
