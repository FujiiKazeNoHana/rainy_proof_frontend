import Link from "next/link";
import { featuresFor } from "@/features/catalog";
import { getDeveloper } from "@/features/developers";
import { DeveloperMark } from "@/shared/brand/DeveloperMark";
import { FeatureGallery } from "@/shared/components/FeatureGallery";

export default function ErgoWorkspacePage() {
  const developer = getDeveloper("ergo")!;
  const features = featuresFor("ergo");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex items-start gap-5">
        <DeveloperMark id="ergo" className="size-20 shrink-0 md:size-24" />
        <div className="space-y-2 pt-1">
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            Rainy Proof
          </Link>
          <h1 className="font-heading text-3xl font-semibold tracking-[0.14em] md:text-4xl">
            {developer.name}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            功能彼此独立，与后端包{" "}
            <code className="font-mono text-xs">ergo.*</code> 对齐。
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium tracking-tight">功能</h2>
          <span className="font-mono text-xs text-muted-foreground">
            /api/ergo/&lt;feature&gt;
          </span>
        </div>
        <FeatureGallery features={features} />
      </section>
    </main>
  );
}
