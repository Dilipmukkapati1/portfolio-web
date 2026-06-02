import type { AssetClass } from "@portfolio/contracts";

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  "index-funds": "hsl(217 91% 60%)",
  "mutual-funds": "hsl(280 65% 60%)",
  bonds: "hsl(142 71% 45%)",
  stocks: "hsl(38 92% 50%)",
  cash: "hsl(220 9% 46%)",
};

export const ASSET_CLASS_BORDER: Record<AssetClass, string> = {
  "index-funds": "border-blue-500",
  "mutual-funds": "border-purple-500",
  bonds: "border-green-500",
  stocks: "border-orange-500",
  cash: "border-gray-500",
};
