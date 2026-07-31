/**
 * Developer (owner) registry — aligns with backend packages.
 * Add a friend here when they join; their features live under features/<id>/.
 */
export type DeveloperId = "ergo" | "yemin";

export interface DeveloperEntry {
  id: DeveloperId;
  /** Display name / brand. */
  name: string;
  /** Optional; used on workspace pages, not the portal hero. */
  tagline?: string;
  href: string;
  /** Ready developers appear as portal entries; invited = reserved slot. */
  status: "ready" | "invited";
}

/** Portal currently lists ready developers only; yemin reserved for later. */
export const DEVELOPER_CATALOG: DeveloperEntry[] = [
  {
    id: "ergo",
    name: "ERGO",
    href: "/ergo",
    status: "ready",
  },
];

export function getDeveloper(id: DeveloperId): DeveloperEntry | undefined {
  return DEVELOPER_CATALOG.find((d) => d.id === id);
}
