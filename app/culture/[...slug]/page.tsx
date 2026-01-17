import { renderPostByPath } from "../../post/post-render";

type PostPageProps = {
  params: { slug: string[] };
};

export default async function CulturePostPage({ params }: PostPageProps) {
  const relativePath = `culture/${params.slug.join("/")}.mdx`;
  return renderPostByPath(relativePath);
}
