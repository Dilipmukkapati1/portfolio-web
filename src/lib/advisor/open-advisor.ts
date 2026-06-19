"use client";

import { useRouter } from "next/navigation";
import {
  persistAdvisorPageContext,
  resolveAdvisorPageContext,
} from "@/lib/advisor/page-context";

export function useOpenAdvisor() {
  const router = useRouter();

  return function openAdvisor(options: {
    route: string;
    snapshot?: Record<string, unknown>;
    prompt?: string;
    sourceLabelSuffix?: string;
    starterPrompts?: string[];
  }) {
    const pageContext = resolveAdvisorPageContext(
      options.route,
      options.snapshot ?? {},
      {
        sourceLabelSuffix: options.sourceLabelSuffix,
        starterPrompts: options.starterPrompts,
      }
    );
    persistAdvisorPageContext(pageContext);

    const params = new URLSearchParams();
    params.set("tab", "advisor");
    params.set("from", options.route);
    if (options.prompt) params.set("prompt", options.prompt);
    router.push(`/tax?${params.toString()}`);
  };
}
