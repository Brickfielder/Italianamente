import ClientPage from "./client-page";
import { client } from "../../tina/__generated__/client";

type PageParams = {
  filename: string[];
};

export default async function Page({ params }: { params: PageParams }) {
  const filename = params.filename.join("/");
  const tinaProps = await client.queries.page({ relativePath: `${filename}.mdx` });

  return <ClientPage {...tinaProps} />;
}

export async function generateStaticParams() {
  const pages = await client.queries.pageConnection();
  const paths =
    pages.data?.pageConnection?.edges
      ?.filter((edge) => edge?.node?._sys?.filename !== "home")
      .map((edge) => ({
        filename: edge?.node?._sys?.breadcrumbs,
      })) || [];

  return paths;
}
