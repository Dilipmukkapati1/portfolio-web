"use client";

import type { ArchitectSectorSlice } from "@/lib/architect-types";
import { SectorHeatmap } from "./sector-heatmap";

/** @deprecated Use SectorHeatmap for performance-colored treemap tiles. */
export function SectorTreemap({ sectors }: { sectors: ArchitectSectorSlice[] }) {
  return <SectorHeatmap sectors={sectors} />;
}
