import { redirect } from "next/navigation";

/** Legacy path → sort-viz hub. */
export default function MonkeySortRedirectPage() {
  redirect("/ergo/sort-viz/monkey-sort");
}
