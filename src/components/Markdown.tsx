"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  img: () => null,
  a: ({ href, children }) => (
    <a href={href} rel="noreferrer" target="_blank" className="underline">
      {children}
    </a>
  ),
};

export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className ?? "markdown mt-3 text-[14px] leading-relaxed text-fg-muted"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
