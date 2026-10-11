"use client";

import { useState } from "react";
import { calculateBest, cargoTypeFor } from "@/lib/calculator/calculate.ts";
import type { SizeClass, Tariffs, VehicleType } from "@/lib/calculator/types.ts";
import type { Port, Yard } from "@/lib/tariffs.ts";
import Breakdown from "@/components/Breakdown.tsx";

const SIZES: [SizeClass, string][] = [
  ["regular", "Lengvasis"], ["large", "Didelis (SUV, pikapas)"], ["oversize", "Labai didelis"],
  ["moto", "Motociklas"], ["moto_large", "Didelis motociklas"],
];

export default function LotCalculator({
  tariffs, ports, yard, initialBid, initialSize, vehicleType,
}: {
  tariffs: Tariffs; ports: Port[]; yard: Yard; initialBid: number; initialSize: SizeClass; vehicleType: VehicleType;
}) {
  const [bid, setBid] = useState(String(initialBid));
  const [size, setSize] = useState<SizeClass>(initialSize);
  const bidUsd = Number(bid.replace(/\s/g, "").replace(",", "."));
  const vt: VehicleType = cargoTypeFor(size) === "moto" ? "moto" : vehicleType === "moto" ? "car" : vehicleType;
  const best = Number.isFinite(bidUsd) && bidUsd >= 0
    ? calculateBest({ auction: yard.feeKey, bidUsd, sizeClass: size, vehicleType: vt }, yard.routes, tariffs)
    : null;

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">Kiek kainuos Klaipėdoje?</h2>
      <p className="muted mt-1 text-sm">Aikštelė: {yard.label} ({yard.auction})</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="lot-bid" className="label">Jūsų maksimali kaina, $</label>
          <input id="lot-bid" inputMode="decimal" value={bid} onChange={(e) => setBid(e.target.value)} className="field mt-2 tabular-nums" />
        </div>
        <div>
          <label htmlFor="lot-size" className="label">Transporto klasė</label>
          <select id="lot-size" value={size} onChange={(e) => setSize(e.target.value as SizeClass)} className="field mt-2">
            {SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-6">
        {best ? (
          <Breakdown
            result={best.result}
            portName={ports.find((p) => p.code === best.route.portCode)?.name ?? best.route.portCode}
            alternatives={best.alternatives}
            usdToEur={tariffs.usdToEur}
            fxBufferPct={tariffs.fxBufferPct}
          />
        ) : (
          <p className="muted text-sm">
            {Number.isFinite(bidUsd) ? "Šiai klasei iš šios aikštelės transporto tarifo nėra." : "Įveskite kainą skaičiais."}
          </p>
        )}
      </div>
    </section>
  );
}
