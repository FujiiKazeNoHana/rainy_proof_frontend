import { ErgoMark } from "./ErgoMark";
import { cn } from "@/shared/lib/utils";
import type { DeveloperId } from "@/features/developers";

export interface DeveloperMarkProps {
  id: DeveloperId;
  className?: string;
}

/** Per-developer brand mark; extend when friends join. */
export function DeveloperMark({ id, className }: DeveloperMarkProps) {
  if (id === "ergo") {
    return <ErgoMark className={className} />;
  }

  // Generic monogram for invited / future developers
  const letter = id.slice(0, 1).toUpperCase();
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={id}
      className={cn("overflow-visible", className)}
    >
      <circle cx="60" cy="60" r="52" fill="currentColor" opacity="0.1" />
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.35"
      />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontSize="42"
        fontWeight="600"
        fill="currentColor"
        fontFamily="var(--font-heading), sans-serif"
      >
        {letter}
      </text>
    </svg>
  );
}
