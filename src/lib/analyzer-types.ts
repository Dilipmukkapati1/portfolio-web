export type AnalyzerPeriod = "quarterly" | "yearly";

export type InstrumentSignal = "bullish" | "bearish" | "neutral";

export type InstrumentIndicator = {
  id: string;
  label: string;
  value: number;
  unit?: string;
  signal: InstrumentSignal;
  changePercent?: number;
  note?: string;
};

export type InstrumentMovingAverage = {
  label: string;
  value: number;
  priceVsPercent: number;
};

export type InstrumentPriceStructure = {
  currentPrice: number;
  support: number;
  resistance: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
};

export type InstrumentVolumeProfile = {
  avgVolumeLabel: string;
  relativeVolume: number;
  signal: InstrumentSignal;
};

export type InstrumentTechnicalSignal = {
  label: string;
  detail: string;
  signal: InstrumentSignal;
  status: "active" | "watch" | "inactive";
};

export type InstrumentAnalysis = {
  symbol: string;
  companyName: string;
  period: AnalyzerPeriod;
  asOf: string;
  currentPrice: number;
  priceChangePercent: number;
  momentumScore: number;
  trend: InstrumentSignal;
  summary: string;
  indicators: InstrumentIndicator[];
  movingAverages: InstrumentMovingAverage[];
  priceStructure: InstrumentPriceStructure;
  volumeProfile: InstrumentVolumeProfile;
  technicalSignals: InstrumentTechnicalSignal[];
};
