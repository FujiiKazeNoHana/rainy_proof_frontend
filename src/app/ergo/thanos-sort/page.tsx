import { redirect } from "next/navigation";

/** Legacy path → sort-viz hub. */
export default function ThanosSortRedirectPage() {
  redirect("/ergo/sort-viz/thanos-sort");
}
