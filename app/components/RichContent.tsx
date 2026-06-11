import type { ComponentPropsWithoutRef } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import ContentImage from "./ContentImage";

const ExternalLink = ({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) => {
  const external = typeof href === "string" && /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children ?? href}
    </a>
  );
};

const ResponsiveIframe = (props: ComponentPropsWithoutRef<"iframe">) => (
  <div className="media-embed">
    <iframe {...props} />
  </div>
);

const ResponsiveAudio = (props: ComponentPropsWithoutRef<"audio">) => (
  <audio className="content-audio" controls preload="metadata" {...props} />
);

const ResponsiveVideo = (props: ComponentPropsWithoutRef<"video">) => (
  <video className="content-video" controls preload="metadata" {...props} />
);

export default function RichContent({ source }: { source?: string }) {
  if (!source) {
    return null;
  }

  return (
    <MDXRemote
      source={source}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      components={{
        a: ExternalLink,
        img: ContentImage,
        iframe: ResponsiveIframe,
        video: ResponsiveVideo,
        audio: ResponsiveAudio,
      }}
    />
  );
}
