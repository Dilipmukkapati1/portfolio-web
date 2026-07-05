"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildHoldingsQueryString,
  parseHoldingsQueryState,
  type HoldingsChartStyle,
  type HoldingsGroupMode,
  type HoldingsQueryState,
  type HoldingsViewMode,
} from "@/lib/url-state";

export function useHoldingsQueryParams(): {
  view: HoldingsViewMode;
  group: HoldingsGroupMode;
  chart: HoldingsChartStyle;
  setView: (view: HoldingsViewMode) => void;
  setGroup: (group: HoldingsGroupMode) => void;
  setChart: (chart: HoldingsChartStyle) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<HoldingsQueryState>(() =>
    parseHoldingsQueryState(searchParams)
  );

  useEffect(() => {
    setState(parseHoldingsQueryState(searchParams));
  }, [searchParams]);

  const patchState = useCallback(
    (patch: Partial<HoldingsQueryState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        const query = buildHoldingsQueryString(next, searchParams);
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        return next;
      });
    },
    [router, pathname, searchParams]
  );

  const setView = useCallback(
    (view: HoldingsViewMode) => {
      patchState({ view });
    },
    [patchState]
  );

  const setGroup = useCallback(
    (group: HoldingsGroupMode) => {
      patchState({ group });
    },
    [patchState]
  );

  const setChart = useCallback(
    (chart: HoldingsChartStyle) => {
      patchState({ chart });
    },
    [patchState]
  );

  return useMemo(
    () => ({
      view: state.view,
      group: state.group,
      chart: state.chart,
      setView,
      setGroup,
      setChart,
    }),
    [state.view, state.group, state.chart, setView, setGroup, setChart]
  );
}
