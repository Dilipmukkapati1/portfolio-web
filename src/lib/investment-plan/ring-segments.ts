export const DONUT_SLICE_GAP_RAD = 0.022;

export const MIN_SLICE_PERCENT = 0.05;

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function ringSegmentPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  start: number,
  end: number
): string {
  const span = end - start;
  if (span <= 0) return "";
  if (span >= 2 * Math.PI - 1e-6) {
    const mid = start + Math.PI;
    return `${ringSegmentPath(cx, cy, rInner, rOuter, start, mid)} ${ringSegmentPath(cx, cy, rInner, rOuter, mid, end)}`;
  }
  const p0o = polar(cx, cy, rOuter, start);
  const p1o = polar(cx, cy, rOuter, end);
  const p1i = polar(cx, cy, rInner, end);
  const p0i = polar(cx, cy, rInner, start);
  const large = span > Math.PI ? 1 : 0;
  return `M ${p0o.x} ${p0o.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rInner} ${rInner} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`;
}

export type RingSegment = {
  d: string;
  fill: string;
  label: string;
  midAngle: number;
};

/** Map allocation % (0–100 scale) to ring arcs; 0% classes render nothing. */
export function buildRingSegments(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  slices: { label: string; value: number; fill: string }[]
): RingSegment[] {
  const active = slices.filter((sl) => sl.value > MIN_SLICE_PERCENT);
  if (active.length === 0) return [];

  const gapTotal = active.length * DONUT_SLICE_GAP_RAD;
  const fullSweep = Math.max(0, 2 * Math.PI - gapTotal);
  const planTotal = active.reduce((sum, sl) => sum + sl.value, 0);
  const scale = planTotal > 100 ? 100 / planTotal : 1;

  let angle = -Math.PI / 2 + DONUT_SLICE_GAP_RAD / 2;
  return active
    .map((sl) => {
      const sweep = ((sl.value * scale) / 100) * fullSweep;
      const start = angle;
      const end = angle + sweep;
      const midAngle = (start + end) / 2;
      angle = end + DONUT_SLICE_GAP_RAD;
      return {
        d: ringSegmentPath(cx, cy, rInner, rOuter, start, end),
        fill: sl.fill,
        label: sl.label,
        midAngle,
      };
    })
    .filter((seg) => seg.d.length > 0);
}
