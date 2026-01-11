import ClientPage from "./client-page";
import { client } from "../../tina/__generated__/client"; // <-- Percorso corretto!

export default async function Page({ params }) {
  // Questo codice serve per far funzionare TinaCMS
  const tinaProps = await client.queries.page({ relativePath: "home.mdx" });
  return <ClientPage {...tinaProps} />;
}

// Genera le pagine statiche
export async function generateStaticParams() {
  const pages = await client.queries.pageConnection();
  const paths = pages.data?.pageConnection?.edges?.map((edge) => ({
    filename: edge?.node?._sys.breadcrumbs,
  }));
  return paths || [];
}