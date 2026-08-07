"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/utils";
import { MermaidBlock } from "./MermaidBlock";

type Props = {
  source: string;
  className?: string;
};

function isMermaidFence(className?: string) {
  return /language-mermaid/.test(className ?? "");
}

const components: Components = {
  pre: ({ children, className, ...props }) => {
    const child = Array.isArray(children) ? children[0] : children;
    if (
      child &&
      typeof child === "object" &&
      "props" in child &&
      isMermaidFence(
        (child as { props?: { className?: string } }).props?.className,
      )
    ) {
      return <>{children}</>;
    }
    return (
      <pre
        className={cn(
          "my-3 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs",
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    );
  },
  code: ({ className, children, ...props }) => {
    const text = String(children ?? "").replace(/\n$/, "");
    if (isMermaidFence(className)) {
      return <MermaidBlock chart={text} />;
    }
    const isBlock = Boolean(className) || text.includes("\n");
    if (isBlock) {
      return (
        <code className={cn("font-mono text-xs", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    );
  },
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-border bg-muted/50 px-2 py-1.5 text-left font-medium"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-border px-2 py-1.5" {...props}>
      {children}
    </td>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-2 list-disc space-y-1 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-3 border-l-2 border-primary/40 pl-3 text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="mt-4 mb-2 text-2xl font-semibold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-4 mb-2 text-xl font-semibold tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-3 mb-1.5 text-lg font-medium" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-2 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  hr: (props) => <hr className="my-4 border-border" {...props} />,
};

export function MarkdownPreview({ source, className }: Props) {
  return (
    <div
      className={cn(
        "text-sm text-foreground [&_img]:max-w-full",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
