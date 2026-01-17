import PostsPage from "../posts/posts-page";
import { fetchPosts } from "../posts/posts-data";

const filterByFolder = (folder: string, relativePath?: string | null) =>
  relativePath?.startsWith(`${folder}/`);

export default async function GrammarPage() {
  const posts = await fetchPosts();
  const grammarPosts = posts.filter((post) =>
    filterByFolder("grammar", post._sys?.relativePath)
  );

  return (
    <PostsPage
      posts={grammarPosts}
      title="Grammatica"
      intro="Tutti gli articoli e le schede di grammatica."
    />
  );
}
