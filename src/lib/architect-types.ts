export type ArchitectAssetClass = "equity" | "bond" | "cash" | "other";

export type ArchitectStrategy = {
  equitiesPercent: number;
  bondsPercent: number;
  cashPercent: number;
};

export type ArchitectExecutionAsset = {
  symbol: string;
  name: string;
  assetClass: ArchitectAssetClass;
  plannedPercent: number;
  actualPercent: number;
  fillStatusPercent: number;
  barColor: "purple" | "blue" | "green" | "orange";
};

export type ArchitectSectorSlice = {
  id: string;
  label: string;
  weightPercent: number;
  livePerfPercent?: number;
  tone: "positive" | "negative" | "neutral";
};

export type ArchitectDashboard = {
  title: string;
  totalCapital?: number;
  strategy: ArchitectStrategy;
  strategyCenterLabel: string;
  executionAssets: ArchitectExecutionAsset[];
  sectors: ArchitectSectorSlice[];
  sharpeRatio: number;
  efficiencyDescription: string;
  catalog: Array<{
    symbol: string;
    name: string;
    assetClass: ArchitectAssetClass;
  }>;
};
