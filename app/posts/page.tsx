import PostsPage from "./posts-page";
import { fetchPosts } from "./posts-data";

export default async function PostsRoute() {
  const posts = await fetchPosts();

  return (
    <PostsPage
      posts={posts}
      title="Tutti i post"
      intro="Trova articoli di grammatica, cultura e multimedia."
    />
  );
}
