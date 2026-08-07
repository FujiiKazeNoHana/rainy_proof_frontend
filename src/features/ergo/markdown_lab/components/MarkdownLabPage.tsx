"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  DEFAULT_MARKDOWN,
  DRAFT_STORAGE_KEY,
} from "../constants";
import { MarkdownPreview } from "./MarkdownPreview";

type MobileTab = "edit" | "preview";

function loadDraft(): string {
  if (typeof window === "undefined") return DEFAULT_MARKDOWN;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw != null && raw.length > 0) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_MARKDOWN;
}

function saveDraft(value: string) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function MarkdownLabPage() {
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState(DEFAULT_MARKDOWN);
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const deferred = useDeferredValue(source);

  useEffect(() => {
    setSource(loadDraft());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => saveDraft(source), 300);
    return () => window.clearTimeout(id);
  }, [source, ready]);

  const reset = () => {
    setSource(DEFAULT_MARKDOWN);
    saveDraft(DEFAULT_MARKDOWN);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                门户
              </Link>
              <span aria-hidden>/</span>
              <Link href="/ergo" className="hover:text-foreground">
                ERGO
              </Link>
              <span aria-hidden>/</span>
              <span className="text-foreground">Markdown</span>
            </div>
            <h1 className="truncate font-heading text-lg font-semibold tracking-tight md:text-xl">
              Markdown 实验室
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5 md:hidden">
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  mobileTab === "edit"
                    ? "bg-muted font-medium"
                    : "text-muted-foreground",
                )}
                onClick={() => setMobileTab("edit")}
              >
                编辑
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  mobileTab === "preview"
                    ? "bg-muted font-medium"
                    : "text-muted-foreground",
                )}
                onClick={() => setMobileTab("preview")}
              >
                预览
              </button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              恢复示例
            </Button>
            <Link
              href="/ergo"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              返回 ERGO
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-0 md:grid-cols-2 md:gap-0">
        <section
          className={cn(
            "flex min-h-[50dvh] flex-col border-border md:min-h-[calc(100dvh-4.5rem)] md:border-r",
            mobileTab === "preview" && "hidden md:flex",
          )}
        >
          <div className="border-b border-border px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            编辑
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            placeholder="在此输入 Markdown…"
            aria-label="Markdown 编辑器"
          />
        </section>

        <section
          className={cn(
            "flex min-h-[50dvh] flex-col md:min-h-[calc(100dvh-4.5rem)]",
            mobileTab === "edit" && "hidden md:flex",
          )}
        >
          <div className="border-b border-border px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            预览
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {deferred.trim() ? (
              <MarkdownPreview source={deferred} />
            ) : (
              <p className="text-sm text-muted-foreground">开始输入以预览…</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
