import Link from "next/link";
import type { FeatureEntry } from "@/features/catalog";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export function FeatureGallery({
  features,
  emptyHint,
}: {
  features: FeatureEntry[];
  emptyHint?: string;
}) {
  if (features.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyHint ?? "暂无功能。"}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {features.map((feature) => (
        <FeatureCard
          key={`${feature.owner}-${feature.id}`}
          feature={feature}
        />
      ))}
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureEntry }) {
  const inner = (
    <Card className="h-full transition-colors hover:border-primary/40">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{feature.title}</CardTitle>
          <Badge variant={feature.status === "ready" ? "default" : "secondary"}>
            {feature.status === "ready" ? "可用" : "规划中"}
          </Badge>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {feature.owner}.{feature.id}
        </p>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (feature.status !== "ready") {
    return <div className="opacity-70">{inner}</div>;
  }

  return (
    <Link
      href={feature.href}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {inner}
    </Link>
  );
}
