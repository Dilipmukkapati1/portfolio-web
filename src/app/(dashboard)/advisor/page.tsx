import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdvisorRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = new URLSearchParams();
  next.set("tab", "advisor");

  for (const key of ["from", "prompt"] as const) {
    const value = params[key];
    if (typeof value === "string" && value) {
      next.set(key, value);
    }
  }

  redirect(`/tax?${next.toString()}`);
}
