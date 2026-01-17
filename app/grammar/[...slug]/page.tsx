import { renderPostByPath } from "../../post/post-render";

type PostPageProps = {
  params: { slug: string[] };
};

export default async function GrammarPostPage({ params }: PostPageProps) {
  const relativePath = `grammar/${params.slug.join("/")}.mdx`;
  return renderPostByPath(relativePath);
}
