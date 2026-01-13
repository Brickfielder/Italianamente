import { notFound } from "next/navigation";

import PostTemplate from "../../components/post-template";
import { client } from "../../../tina/__generated__/client";

type GrammarPageProps = {
  params: { slug: string };
};

export default async function GrammarPage({ params }: GrammarPageProps) {
  try {
    const res = await client.queries.grammar({
      relativePath: `${params.slug}.mdx`,
    });
    const post = res.data.grammar;

    return <PostTemplate post={post} />;
  } catch (error) {
    notFound();
  }
}
