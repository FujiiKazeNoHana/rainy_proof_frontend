import { cn } from "@/shared/lib/utils";

export interface ErgoMarkProps {
  className?: string;
  /** Decorative title for accessibility when used alone. */
  title?: string;
}

/**
 * ERGO identity mark — geometric E over a soft rain-arc.
 * Used as the portal hero brand signal.
 */
export function ErgoMark({ className, title = "ERGO" }: ErgoMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={cn("overflow-visible", className)}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="ergo-wash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-accent, var(--primary))" />
          <stop offset="100%" stopColor="var(--brand-warm, var(--accent))" />
        </linearGradient>
        <linearGradient id="ergo-face" x1="0.2" y1="0" x2="0.9" y2="1">
          <stop
            offset="0%"
            stopColor="var(--brand-accent, var(--primary))"
            stopOpacity="0.95"
          />
          <stop
            offset="100%"
            stopColor="var(--brand-accent, var(--primary))"
            stopOpacity="0.7"
          />
        </linearGradient>
      </defs>

      {/* Soft disc */}
      <circle cx="60" cy="60" r="52" fill="url(#ergo-wash)" opacity="0.14" />
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="url(#ergo-wash)"
        strokeWidth="1.25"
        opacity="0.55"
      />

      {/* Rain arc */}
      <path
        d="M28 48c10 22 28 34 32 34s22-12 32-34"
        fill="none"
        stroke="url(#ergo-wash)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Geometric E */}
      <g fill="url(#ergo-face)">
        <rect x="40" y="36" width="8" height="48" rx="2" />
        <rect x="40" y="36" width="34" height="8" rx="2" />
        <rect x="40" y="56" width="26" height="7" rx="2" />
        <rect x="40" y="76" width="34" height="8" rx="2" />
      </g>
    </svg>
  );
}
