import { renderPostByPath } from "../post-render";

type PostPageProps = {
  // FIX 1: Define slug as an Array of strings, not a single string
  params: { slug: string[] };
};

export default async function PostPage({ params }: PostPageProps) {
  const relativePath = `${params.slug.join("/")}.mdx`;
  return renderPostByPath(relativePath);
}
