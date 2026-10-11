import type { CalcInput, CalcLine, CalcResult, FeeBracket, SizeClass, Tariffs } from "./types.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function auctionFeeUsd(bidUsd: number, brackets: FeeBracket[]): number | null {
  const b = brackets.find(
    (x) => bidUsd >= x.fromUsd && (x.toUsd === null || bidUsd <= x.toUsd),
  );
  if (!b) return null;
  return round2(b.feeUsd + (b.pct ?? 0) * bidUsd);
}

/**
 * Importo kainos skaičiavimas.
 * Muitinės vertė = (kaina + aukciono mokestis + transportas JAV + jūra) → EUR
 * Muitas = muito % × muitinės vertė
 * PVM = PVM % × (muitinės vertė + muitas + ES išlaidos)
 * Galutinė = muitinės vertė + muitas + ES išlaidos + PVM + brokerio mokestis
 */
export function calculate(input: CalcInput, t: Tariffs): CalcResult {
  const warnings: string[] = [];
  const rate = t.usdToEur * (1 + t.fxBufferPct);
  const toEur = (usd: number) => round2(usd * rate);

  if (!(input.bidUsd >= 0) || !(input.usTransportUsd >= 0)) {
    throw new Error("Sumos negali būti neigiamos");
  }

  // Aukciono mokestis
  let feeUsd: number | null = null;
  if (input.auction) {
    feeUsd = auctionFeeUsd(input.bidUsd, t.auctionFees[input.auction] ?? []);
    if (feeUsd === null) {
      warnings.push("Aukciono mokesčių lentelė dar neužpildyta — mokestis neįskaičiuotas.");
    }
  } else {
    warnings.push("Šiam aukcionui mokesčių lentelės nėra — aukciono mokestis neįskaičiuotas.");
  }
  feeUsd ??= 0;

  // Jūra
  const seaUsd = t.sea[input.port]?.[input.sizeClass];
  if (seaUsd === undefined) {
    throw new Error(`Nėra jūros tarifo: ${input.port} / ${input.sizeClass}`);
  }

  // Muitas
  let dutyPct = t.dutyPct[input.vehicleType];
  if (dutyPct === null || dutyPct === undefined) {
    warnings.push("Šio tipo muito tarifas dar nepatvirtintas — skaičiuojama 10 %.");
    dutyPct = 0.1;
  }

  const lines: CalcLine[] = [
    { key: "bid", label: "Aukciono kaina", usd: input.bidUsd, eur: toEur(input.bidUsd) },
    { key: "auction_fee", label: "Aukciono mokestis", usd: feeUsd, eur: toEur(feeUsd) },
    { key: "us_transport", label: "Transportas JAV iki uosto", usd: input.usTransportUsd, eur: toEur(input.usTransportUsd) },
    { key: "sea", label: "Jūra iki Klaipėdos", usd: seaUsd, eur: toEur(seaUsd) },
  ];

  const customsValueEur = round2(lines.reduce((s, l) => s + l.eur, 0));
  const dutyEur = round2(customsValueEur * dutyPct);
  const euCostsEur = round2(t.declarationEur + t.portFeesEur + t.unloadingEur);
  const vatEur = round2((customsValueEur + dutyEur + euCostsEur) * t.vatPct);

  lines.push(
    { key: "duty", label: `Muitas ${round2(dutyPct * 100)} %`, eur: dutyEur },
    { key: "declaration", label: "Deklaravimas", eur: t.declarationEur },
    { key: "port_fees", label: "Uosto mokesčiai", eur: t.portFeesEur },
    { key: "unloading", label: "Iškrovimas", eur: t.unloadingEur },
    { key: "vat", label: `PVM ${round2(t.vatPct * 100)} %`, eur: vatEur },
    { key: "broker", label: "Brokerio mokestis", eur: t.brokerFeeEur },
  );

  const totalEur = round2(customsValueEur + dutyEur + euCostsEur + vatEur + t.brokerFeeEur);
  return { lines, customsValueEur, totalEur, warnings };
}

export interface Route {
  portCode: string;
  cargoType: "car" | "moto";
  priceUsd: number;
}

export const cargoTypeFor = (s: SizeClass): "car" | "moto" =>
  s === "moto" || s === "moto_large" ? "moto" : "car";

/**
 * Skaičiuoja visiems aikštelės maršrutams (dažniausiai vienas) ir grąžina pigiausią.
 * null — jei šiai aikštelei nėra tinkamo maršruto (pvz. motociklų iš kai kurių aikštelių neveža).
 */
export function calculateBest(
  base: Omit<CalcInput, "port" | "usTransportUsd">,
  routes: Route[],
  t: Tariffs,
): { result: CalcResult; route: Route; alternatives: number } | null {
  const cargo = cargoTypeFor(base.sizeClass);
  let best: { result: CalcResult; route: Route } | null = null;
  let count = 0;
  for (const r of routes) {
    if (r.cargoType !== cargo || t.sea[r.portCode]?.[base.sizeClass] === undefined) continue;
    count++;
    const result = calculate({ ...base, port: r.portCode, usTransportUsd: r.priceUsd }, t);
    if (!best || result.totalEur < best.result.totalEur) best = { result, route: r };
  }
  return best ? { ...best, alternatives: count - 1 } : null;
}
