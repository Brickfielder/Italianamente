"use client";

import { tinaField, useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import ContentImage from "../components/ContentImage";

export default function ClientAboutPage(props) {
  const { data } = useTina(props);
  const page = data?.page;

  return (
    <main className="container about-page">
      <article className="tile about-card">
        <div>
          <h3 data-tina-field={tinaField(page, "title")}>{page?.title}</h3>
          <div className="tile-content" data-tina-field={tinaField(page, "body")}>
            <TinaMarkdown content={page?.body} components={{ img: ContentImage }} />
          </div>
        </div>
      </article>
    </main>
  );
}
