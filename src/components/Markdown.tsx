"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  img: () => null,
  a: ({ href, children }) => (
    <a href={href} rel="noreferrer" target="_blank" className="underline">
      {children}
    </a>
  ),
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="markdown mt-3 text-[14px] leading-relaxed text-fg-muted">
      <ReactMarkdown components={components}>{source}</ReactMarkdown>
    </div>
  );
}
