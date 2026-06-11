import { notFound } from "next/navigation";

import { getPage } from "../lib/content";
import ClientHomePage from "./client-home";

export default async function HomePage() {
  const page = await getPage("home");
  if (!page) {
    notFound();
  }

  return <ClientHomePage page={page} />;
}
