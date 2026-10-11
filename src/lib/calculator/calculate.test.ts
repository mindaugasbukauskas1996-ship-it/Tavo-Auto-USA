import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, calculateBest, auctionFeeUsd } from "./calculate.ts";
import { DEFAULT_TARIFFS } from "./defaults.ts";
import type { Tariffs } from "./types.ts";

// Paprasti skaičiai, kad būtų lengva patikrinti ranka.
const T: Tariffs = {
  ...DEFAULT_TARIFFS,
  usdToEur: 1,
  fxBufferPct: 0,
  auctionFees: {
    copart: [
      { fromUsd: 0, toUsd: 4999.99, feeUsd: 500 },
      { fromUsd: 5000, toUsd: null, feeUsd: 100, pct: 0.1 },
    ],
    iaai: [],
  },
  declarationEur: 100,
  portFeesEur: 50,
  unloadingEur: 50,
  brokerFeeEur: 300,
};

test("pilnas skaičiavimas: sedanas, Copart, Norfolk", () => {
  const r = calculate(
    { auction: "copart", bidUsd: 4000, usTransportUsd: 325, port: "NORFOLK", sizeClass: "regular", vehicleType: "car" },
    T,
  );
  // muitinės vertė = 4000 + 500 + 325 + 675 = 5500
  assert.equal(r.customsValueEur, 5500);
  const duty = r.lines.find((l) => l.key === "duty")!.eur;
  assert.equal(duty, 550);
  // PVM = 21 % × (5500 + 550 + 200) = 1312.5
  assert.equal(r.lines.find((l) => l.key === "vat")!.eur, 1312.5);
  // viso = 5500 + 550 + 200 + 1312.5 + 300
  assert.equal(r.totalEur, 7862.5);
  assert.deepEqual(r.warnings, []);
});

test("aukciono mokestis su % virš ribos", () => {
  assert.equal(auctionFeeUsd(10000, T.auctionFees.copart!), 1100);
});

test("valiutos kursas su buferiu", () => {
  const r = calculate(
    { auction: "copart", bidUsd: 1000, usTransportUsd: 0, port: "NORFOLK", sizeClass: "regular", vehicleType: "car" },
    { ...T, usdToEur: 0.9, fxBufferPct: 0.02 },
  );
  assert.equal(r.lines[0].eur, 918); // 1000 × 0.9 × 1.02
});

test("tuščia mokesčių lentelė → įspėjimas", () => {
  const r = calculate(
    { auction: "iaai", bidUsd: 3000, usTransportUsd: 300, port: "HOUSTON", sizeClass: "large", vehicleType: "car" },
    T,
  );
  assert.equal(r.warnings.length, 1);
});

test("Honolulu motociklo tarifo nėra → klaida", () => {
  assert.throws(() =>
    calculate(
      { auction: "copart", bidUsd: 1000, usTransportUsd: 0, port: "PORT OF HONOLULU", sizeClass: "moto", vehicleType: "moto" },
      T,
    ),
  );
});

test("pigiausias maršrutas: Havajai per LA arba Honolulu", () => {
  const routes = [
    { portCode: "LOS ANGELES", cargoType: "car" as const, priceUsd: 2750 },
    { portCode: "PORT OF HONOLULU", cargoType: "car" as const, priceUsd: 2200 },
  ];
  const base = { auction: "copart" as const, bidUsd: 1000, sizeClass: "regular" as const, vehicleType: "car" as const };
  const r = calculateBest(base, routes, T)!;
  // LA: 2750 + 1200 = 3950 < Honolulu: 2200 + 2250 = 4450
  assert.equal(r.route.portCode, "LOS ANGELES");
  assert.equal(r.alternatives, 1);
});

test("motociklo maršruto nėra → null", () => {
  const routes = [{ portCode: "NORFOLK", cargoType: "car" as const, priceUsd: 300 }];
  const base = { auction: "copart" as const, bidUsd: 1000, sizeClass: "moto" as const, vehicleType: "moto" as const };
  assert.equal(calculateBest(base, routes, T), null);
});

test("aukcionas be lentelės (Manheim) → įspėjimas, mokestis 0", () => {
  const r = calculate(
    { auction: null, bidUsd: 1000, usTransportUsd: 0, port: "NORFOLK", sizeClass: "regular", vehicleType: "car" },
    T,
  );
  assert.equal(r.lines.find((l) => l.key === "auction_fee")!.eur, 0);
  assert.equal(r.warnings.length, 1);
});
