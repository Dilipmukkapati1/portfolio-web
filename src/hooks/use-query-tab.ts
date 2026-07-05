"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildTabQueryString } from "@/lib/url-state";

type UseQueryTabOptions<T extends string> = {
  pathname: string;
  parse: (value: string | null) => T;
  defaultTab: T;
  omitDefaultFromUrl?: boolean;
};

export function useQueryTab<T extends string>({
  pathname,
  parse,
  defaultTab,
  omitDefaultFromUrl = false,
}: UseQueryTabOptions<T>): [T, (tab: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<T>(() =>
    parse(searchParams.get("tab"))
  );

  useEffect(() => {
    setActiveTab(parse(searchParams.get("tab")));
  }, [searchParams, parse]);

  const setTab = useCallback(
    (tab: T) => {
      setActiveTab(tab);
      const query = buildTabQueryString(tab, searchParams, {
        defaultTab,
        omitDefaultFromUrl,
      });
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, searchParams, pathname, defaultTab, omitDefaultFromUrl]
  );

  return [activeTab, setTab];
}
