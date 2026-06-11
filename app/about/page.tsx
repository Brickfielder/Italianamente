import { notFound } from "next/navigation";

import { getPage } from "../../lib/content";
import ClientAboutPage from "./client-about";

export default async function AboutPage() {
  const page = await getPage("about");
  if (!page) {
    notFound();
  }

  return <ClientAboutPage page={page} />;
}
