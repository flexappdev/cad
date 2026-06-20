import { redirect } from "next/navigation";

// v4.1 — /library and / are the same catalogue surface. Single source of truth.
export default function LibraryRedirect() {
  redirect("/");
}
