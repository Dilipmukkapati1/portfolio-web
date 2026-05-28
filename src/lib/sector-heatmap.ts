export const PERF_COLOR_MIN = -3;
export const PERF_COLOR_MAX = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mix(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** Maps performance % to a red → green heat color (matches market heatmap legend). */
export function performanceToHeatColor(
  performance: number,
  min = PERF_COLOR_MIN,
  max = PERF_COLOR_MAX
): string {
  const clamped = clamp(performance, min, max);
  if (clamped >= 0) {
    const t = max > 0 ? clamped / max : 0;
    const r = mix(22, 34, t);
    const g = mix(101, 197, t);
    const b = mix(52, 94, t);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = min < 0 ? clamped / min : 0;
  const r = mix(127, 220, t);
  const g = mix(29, 38, t);
  const b = mix(29, 38, t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatSignedPercent(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}
