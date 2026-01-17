import PostsPage from "../posts/posts-page";
import { fetchPosts } from "../posts/posts-data";

const filterByFolder = (folder: string, relativePath?: string | null) =>
  relativePath?.startsWith(`${folder}/`);

export default async function MultimediaPage() {
  const posts = await fetchPosts();
  const multimediaPosts = posts.filter((post) =>
    filterByFolder("multimedia", post._sys?.relativePath)
  );

  return (
    <PostsPage
      posts={multimediaPosts}
      title="Multimedia"
      intro="Video, film e materiali multimediali per imparare l'italiano."
    />
  );
}
