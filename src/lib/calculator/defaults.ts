import type { Tariffs } from "./types.ts";

// Jūros tarifai iki Klaipėdos, USD — tik testams. Svetainė juos skaito iš Supabase (sea_rates).
export const SEA_TARIFFS: Tariffs["sea"] = {
  "NORFOLK":           { regular: 675,  large: 775,  oversize: 1000, moto: 300, moto_large: 375 },
  "SAVANNAH":          { regular: 675,  large: 775,  oversize: 1000, moto: 300, moto_large: 375 },
  "NEWARK":            { regular: 700,  large: 800,  oversize: 1050, moto: 300, moto_large: 375 },
  "HOUSTON":           { regular: 750,  large: 850,  oversize: 1100, moto: 325, moto_large: 400 },
  "MIAMI":             { regular: 750,  large: 850,  oversize: 1100, moto: 300, moto_large: 400 },
  "CHICAGO":           { regular: 850,  large: 950,  oversize: 1250, moto: 350, moto_large: 450 },
  "TORONTO":           { regular: 850,  large: 950,  oversize: 1250, moto: 325, moto_large: 400 },
  "LOS ANGELES":       { regular: 1200, large: 1450, oversize: 1700, moto: 500, moto_large: 600 },
  "SEATTLE":           { regular: 1625, large: 1800, oversize: 2200, moto: 725, moto_large: 825 },
  "PORT OF HONOLULU":  { regular: 2250, large: 2450, oversize: 3000 }, // motociklų nėra
};

// LAIKINI parametrai — pakeisti jūsų skaičiais (pažymėta TODO).
export const DEFAULT_TARIFFS: Tariffs = {
  usdToEur: 0.86,     // TODO: automatiškai iš ECB kartą per dieną
  fxBufferPct: 0.02,
  auctionFees: {},
  sea: SEA_TARIFFS,
  dutyPct: { car: 0.1, moto: null, truck: null, classic: null }, // TODO: patvirtinti su muitinės tarpininku
  vatPct: 0.21,
  declarationEur: 0,  // TODO
  portFeesEur: 0,     // TODO
  unloadingEur: 0,    // TODO
  brokerFeeEur: 0,    // TODO
};
