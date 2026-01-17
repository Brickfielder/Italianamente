import PostsPage from "../posts/posts-page";
import { fetchPosts } from "../posts/posts-data";

const filterByFolder = (folder: string, relativePath?: string | null) =>
  relativePath?.startsWith(`${folder}/`);

export default async function CulturePage() {
  const posts = await fetchPosts();
  const culturePosts = posts.filter((post) =>
    filterByFolder("culture", post._sys?.relativePath)
  );

  return (
    <PostsPage
      posts={culturePosts}
      title="Cultura"
      intro="Approfondimenti e curiosità sulla cultura italiana."
    />
  );
}
