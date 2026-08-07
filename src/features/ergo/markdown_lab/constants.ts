export const OWNER = "ergo" as const;
export const FEATURE = "markdown_lab" as const;

export const FEATURE_ROUTE = "/ergo/markdown-lab" as const;

export const DRAFT_STORAGE_KEY = "rainy-proof-markdown-lab-draft" as const;

export const DEFAULT_MARKDOWN = `# Markdown 实验室

在左侧编辑，右侧实时预览。支持 **GFM**（表格、任务列表等）与 \`\`\`mermaid 文本绘图。

## 列表示例

- 条目一
- 条目二

| 列 A | 列 B |
| --- | --- |
| 甲 | 乙 |

## Mermaid

\`\`\`mermaid
flowchart LR
  Edit[编辑 Markdown] --> Preview[实时预览]
  Preview --> Mermaid[Mermaid 绘图]
\`\`\`
`;
