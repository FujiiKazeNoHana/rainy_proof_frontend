import type { Metadata } from "next";
import { MarkdownLabPage } from "@/features/ergo/markdown_lab/components/MarkdownLabPage";

export const metadata: Metadata = {
  title: "Markdown 实验室 · Ergo",
  description: "实时编辑与预览 Markdown，支持 Mermaid 文本绘图",
};

export default function MarkdownLabRoutePage() {
  return <MarkdownLabPage />;
}
