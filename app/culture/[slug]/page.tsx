import { notFound } from "next/navigation";

import PostTemplate from "../../components/post-template";
import { client } from "../../../tina/__generated__/client";

type CulturePageProps = {
  params: { slug: string };
};

export default async function CulturePage({ params }: CulturePageProps) {
  try {
    const res = await client.queries.culture({
      relativePath: `${params.slug}.mdx`,
    });
    const post = res.data.culture;

    return <PostTemplate post={post} />;
  } catch (error) {
    notFound();
  }
}
