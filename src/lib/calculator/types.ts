// Skaičiuoklės tipai. Visi tarifai ateina iš DB (admin skydas), čia — tik struktūra.

export type Auction = "copart" | "iaai";

export type SizeClass =
  | "regular"      // Regular Car
  | "large"        // Large Car
  | "oversize"     // Oversize Car
  | "moto"         // Motociklas
  | "moto_large";  // Didelis motociklas

export type VehicleType = "car" | "moto" | "truck" | "classic";

/** Aukciono mokesčio intervalas: kaina nuo–iki (USD) → fiksuotas mokestis + % nuo kainos. */
export interface FeeBracket {
  fromUsd: number;
  toUsd: number | null; // null = be viršutinės ribos
  feeUsd: number;
  pct?: number;         // pvz. 0.06 = 6 % nuo kainos (didelėms sumoms)
}

export interface Tariffs {
  /** Kiek EUR už 1 USD (ECB kursas). */
  usdToEur: number;
  /** Saugos buferis valiutos kursui, pvz. 0.02 = +2 %. */
  fxBufferPct: number;

  /** Aukciono mokesčių intervalai: raktas "copart" / "iaai". Kitiems aukcionams — tuščia. */
  auctionFees: Partial<Record<Auction, FeeBracket[]>>;

  /** Jūros tarifai, USD: uostas → dydžio klasė → kaina. */
  sea: Record<string, Partial<Record<SizeClass, number>>>;

  /** Muito tarifai pagal tipą (0.10 = 10 %). null = dar nepatvirtinta. */
  dutyPct: Record<VehicleType, number | null>;
  vatPct: number;

  /** Fiksuoti ES mokesčiai, EUR (įeina į PVM bazę). */
  declarationEur: number;
  portFeesEur: number;
  unloadingEur: number;

  /** Brokerio mokestis, EUR (jūsų paslauga, ne importo PVM bazė). */
  brokerFeeEur: number;
}

export interface CalcInput {
  /** null — aukcionas, kurio mokesčių lentelės nėra (Manheim, Adesa…). */
  auction: Auction | null;
  bidUsd: number;
  /** Transportas JAV iki uosto, USD (iš tarifų failo pagal aikštelę). */
  usTransportUsd: number;
  port: string;
  sizeClass: SizeClass;
  vehicleType: VehicleType;
}

export interface CalcLine {
  key: string;
  label: string;
  usd?: number;
  eur: number;
}

export interface CalcResult {
  lines: CalcLine[];
  customsValueEur: number;
  totalEur: number;
  /** Įspėjimai, pvz. „aukciono mokesčių lentelė tuščia“. */
  warnings: string[];
}
