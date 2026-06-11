import type { PageDocument } from "../../lib/content/types";
import RichContent from "../components/RichContent";

export default function ClientAboutPage({ page }: { page: PageDocument }) {
  return (
    <main className="container about-page">
      <article className="tile about-card">
        <div>
          <h3>{page.title}</h3>
          <div className="tile-content post-content">
            <RichContent source={page.body} />
          </div>
        </div>
      </article>
    </main>
  );
}
