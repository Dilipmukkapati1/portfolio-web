export type TreemapInput = {
  id: string;
  value: number;
};

export type TreemapRect = TreemapInput & {
  x: number;
  y: number;
  width: number;
  height: number;
};

function layoutSlice(
  nodes: TreemapInput[],
  x: number,
  y: number,
  width: number,
  height: number,
  horizontal: boolean,
  output: TreemapRect[]
): void {
  if (nodes.length === 0 || width <= 0 || height <= 0) return;

  if (nodes.length === 1) {
    output.push({ ...nodes[0], x, y, width, height });
    return;
  }

  const total = nodes.reduce((sum, node) => sum + node.value, 0);
  if (total <= 0) return;

  let acc = 0;
  let splitAt = 1;
  const half = total / 2;
  for (let i = 0; i < nodes.length; i++) {
    acc += nodes[i].value;
    if (acc >= half) {
      splitAt = i + 1;
      break;
    }
  }
  splitAt = Math.max(1, Math.min(nodes.length - 1, splitAt));

  const left = nodes.slice(0, splitAt);
  const right = nodes.slice(splitAt);
  const leftTotal = left.reduce((sum, node) => sum + node.value, 0);
  const ratio = leftTotal / total;

  if (horizontal) {
    const leftWidth = width * ratio;
    layoutSlice(left, x, y, leftWidth, height, !horizontal, output);
    layoutSlice(right, x + leftWidth, y, width - leftWidth, height, !horizontal, output);
  } else {
    const topHeight = height * ratio;
    layoutSlice(left, x, y, width, topHeight, !horizontal, output);
    layoutSlice(right, x, y + topHeight, width, height - topHeight, !horizontal, output);
  }
}

/** Slice-and-dice treemap layout. Values must be > 0. */
export function squarifyTreemap(
  nodes: TreemapInput[],
  width: number,
  height: number
): TreemapRect[] {
  const sorted = [...nodes]
    .filter((node) => node.value > 0)
    .sort((a, b) => b.value - a.value);

  const rects: TreemapRect[] = [];
  layoutSlice(sorted, 0, 0, width, height, width >= height, rects);
  return rects;
}
