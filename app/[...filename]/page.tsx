import ClientPage from "./client-page";
import { client } from "../../tina/__generated__/client";

export default async function Page({ params }) {
  // 1. Calculate the file to load. 
  // If we are on the homepage, params.filename might be undefined, so we default to "home".
  // If we are at /culture, it becomes "culture".
  const filename = params.filename ? params.filename.join("/") : "home";

  // 2. Run a custom query to get the data + the critical breadcrumbs
  const tinaProps = await client.request({
    query: `query PageQuery($relativePath: String!) {
      page(relativePath: $relativePath) {
        ... on Document {
          _sys {
            filename
            breadcrumbs
            basename
            relativePath
            extension
          }
          id
        }
        ... on Page {
          # Fetch the content for the page
          tiles {
            __typename
            category
            title
            content
            points
            linkText
            type
            # THIS IS THE KEY PART: Fetch the breadcrumbs for the link!
            postReference {
              ... on Post {
                _sys {
                  breadcrumbs
                  filename
                }
              }
            }
          }
        }
      }
    }`,
    variables: { relativePath: `${filename}.mdx` },
  });

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