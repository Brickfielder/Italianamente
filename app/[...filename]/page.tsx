import { notFound } from "next/navigation";

import { getPage } from "../../lib/content";
import ClientPage from "./client-page";

type PageParams = {
  filename: string[];
};

export default async function Page({ params }: { params: PageParams }) {
  const page = await getPage(params.filename.join("/"));
  if (!page) {
    notFound();
  }

  return <ClientPage page={page} />;
}

export async function generateStaticParams() {
  return [{ filename: ["about"] }];
}
