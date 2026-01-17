import { renderPostByPath } from "../../post/post-render";

type PostPageProps = {
  params: { slug: string[] };
};

export default async function MultimediaPostPage({ params }: PostPageProps) {
  const relativePath = `multimedia/${params.slug.join("/")}.mdx`;
  return renderPostByPath(relativePath);
}
