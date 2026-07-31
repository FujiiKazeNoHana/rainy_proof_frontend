import { redirect } from "next/navigation";
import { SORT_METHODS } from "@/features/catalog";

export default function SortVizIndexPage() {
  redirect(SORT_METHODS[0]!.href);
}
