import { notFound } from "next/navigation";

import PostTemplate from "../../components/post-template";
import { client } from "../../../tina/__generated__/client";

type MultimediaPageProps = {
  params: { slug: string };
};

export default async function MultimediaPage({ params }: MultimediaPageProps) {
  try {
    const res = await client.queries.multimedia({
      relativePath: `${params.slug}.mdx`,
    });
    const post = res.data.multimedia;

    return <PostTemplate post={post} />;
  } catch (error) {
    notFound();
  }
}
