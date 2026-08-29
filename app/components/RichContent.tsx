import React, {
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type JSX,
} from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import ContentImage from "./ContentImage";

const allowedStyleProperties = new Set([
  "color",
  "font-family",
  "font-size",
  "text-align",
  "width",
]);

const parseMdxStyle = (style?: CSSProperties | string) => {
  if (typeof style !== "string") {
    return style;
  }

  return Object.fromEntries(
    style
      .split(";")
      .map((declaration) => declaration.split(":", 2).map((part) => part.trim()))
      .filter(
        ([property, value]) =>
          value && allowedStyleProperties.has(property.toLowerCase())
      )
      .map(([property, value]) => [
        property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        value,
      ])
  ) as CSSProperties;
};

type StyledProps<Tag extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithoutRef<Tag>,
  "style"
> & { style?: CSSProperties | string };

const StyledSpan = ({ style, ...props }: StyledProps<"span">) => (
  <span {...props} style={parseMdxStyle(style)} />
);
const StyledParagraph = ({ style, ...props }: StyledProps<"p">) => (
  <p {...props} style={parseMdxStyle(style)} />
);
const StyledListItem = ({ style, ...props }: StyledProps<"li">) => (
  <li {...props} style={parseMdxStyle(style)} />
);
const StyledBlockquote = ({ style, ...props }: StyledProps<"blockquote">) => (
  <blockquote {...props} style={parseMdxStyle(style)} />
);
const StyledTableHeader = ({ style, ...props }: StyledProps<"th">) => (
  <th {...props} style={parseMdxStyle(style)} />
);
const StyledTableCell = ({ style, ...props }: StyledProps<"td">) => (
  <td {...props} style={parseMdxStyle(style)} />
);
const StyledDiv = ({ style, ...props }: StyledProps<"div">) => (
  <div {...props} style={parseMdxStyle(style)} />
);

const styledTags = {
  span: "MdxSpan",
  p: "MdxParagraph",
  li: "MdxListItem",
  blockquote: "MdxBlockquote",
  th: "MdxTableHeader",
  td: "MdxTableCell",
  div: "MdxDiv",
};

export const prepareMdxSource = (source: string) =>
  Object.entries(styledTags)
    .reduce(
      (prepared, [tag, component]) =>
        prepared
          .replace(new RegExp(`<${tag}(?=[\\s>])`, "g"), `<${component}`)
          .replace(new RegExp(`</${tag}>`, "g"), `</${component}>`),
      source
    )
    .replace(/<\/MdxParagraph>\s*<table/g, "</MdxParagraph>\n\n<table")
    .replace(/<\/table>\s*<MdxParagraph/g, "</table>\n\n<MdxParagraph");

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

export const richContentComponents = {
  a: ExternalLink,
  img: ContentImage,
  iframe: ResponsiveIframe,
  video: ResponsiveVideo,
  audio: ResponsiveAudio,
  MdxSpan: StyledSpan,
  MdxParagraph: StyledParagraph,
  MdxListItem: StyledListItem,
  MdxBlockquote: StyledBlockquote,
  MdxTableHeader: StyledTableHeader,
  MdxTableCell: StyledTableCell,
  MdxDiv: StyledDiv,
};

export default function RichContent({ source }: { source?: string }) {
  if (!source) {
    return null;
  }

  return (
    <MDXRemote
      source={prepareMdxSource(source)}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      components={richContentComponents}
    />
  );
}
