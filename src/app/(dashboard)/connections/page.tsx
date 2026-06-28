import { redirect } from "next/navigation";

export default function ConnectionsPage() {
  redirect("/accounts?tab=connections");
}
