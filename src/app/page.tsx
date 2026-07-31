import Link from "next/link";
import { DEVELOPER_CATALOG } from "@/features/developers";
import { DeveloperMark } from "@/shared/brand/DeveloperMark";
import { cn } from "@/shared/lib/utils";

export default function Home() {
  const primary = DEVELOPER_CATALOG.find((d) => d.id === "ergo")!;

  return (
    <main className="portal-shell relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="portal-glow" aria-hidden />

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Link
          href={primary.href}
          className={cn(
            "portal-enter group flex flex-col items-center gap-6 rounded-3xl outline-none",
            "focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <div className="portal-mark-wrap">
            <DeveloperMark
              id="ergo"
              className="portal-mark size-40 transition-transform duration-500 group-hover:scale-[1.04] md:size-48"
            />
          </div>

          <h1 className="font-heading text-5xl font-semibold tracking-[0.18em] text-foreground md:text-6xl">
            {primary.name}
          </h1>

          <span className="portal-cta inline-flex items-center gap-2 text-sm font-medium text-primary">
            进入工作区
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </Link>
      </section>
    </main>
  );
}
