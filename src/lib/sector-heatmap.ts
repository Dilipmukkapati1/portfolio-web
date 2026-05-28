export const PERF_COLOR_MIN = -3;
export const PERF_COLOR_MAX = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mix(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** Maps performance % to a red → green heat color. */
export function performanceToHeatColor(
  performance: number,
  min = PERF_COLOR_MIN,
  max = PERF_COLOR_MAX
): string {
  const clamped = clamp(performance, min, max);
  if (clamped >= 0) {
    const t = max > 0 ? clamped / max : 0;
    return `rgb(${mix(22, 34, t)}, ${mix(101, 197, t)}, ${mix(52, 94, t)})`;
  }
  const t = min < 0 ? clamped / min : 0;
  return `rgb(${mix(127, 220, t)}, ${mix(29, 38, t)}, ${mix(29, 38, t)})`;
}

export function formatSignedPercent(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}
