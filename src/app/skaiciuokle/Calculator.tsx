"use client";

import { useMemo, useState } from "react";
import { calculateBest, cargoTypeFor } from "@/lib/calculator/calculate.ts";
import type { SizeClass, VehicleType } from "@/lib/calculator/types.ts";
import type { CalculatorData } from "@/lib/tariffs.ts";
import Breakdown from "@/components/Breakdown.tsx";

const SIZES: { value: SizeClass; label: string; hint: string }[] = [
  { value: "regular", label: "Lengvasis", hint: "sedanas, hečbekas, universalas" },
  { value: "large", label: "Didelis", hint: "SUV, pikapas, vienatūris" },
  { value: "oversize", label: "Labai didelis", hint: "didelis furgonas, ilgas pikapas" },
  { value: "moto", label: "Motociklas", hint: "" },
  { value: "moto_large", label: "Didelis motociklas", hint: "turistinis, trikratis" },
];

const DUTY_TYPES: { value: VehicleType; label: string }[] = [
  { value: "car", label: "Lengvasis automobilis" },
  { value: "moto", label: "Motociklas" },
  { value: "truck", label: "Krovininis" },
  { value: "classic", label: "Senovinis (30+ m.)" },
];

const AUCTIONS = ["Copart", "IAAI", "Kiti"] as const;


export default function Calculator({ data }: { data: CalculatorData }) {
  const [auction, setAuction] = useState<(typeof AUCTIONS)[number]>("Copart");
  const [yardText, setYardText] = useState("");
  const [size, setSize] = useState<SizeClass>("regular");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [bid, setBid] = useState("5000");

  const yards = useMemo(
    () =>
      data.yards.filter((y) =>
        auction === "Kiti" ? y.auction !== "Copart" && y.auction !== "IAAI" : y.auction === auction,
      ),
    [data.yards, auction],
  );
  const optionText = (y: CalculatorData["yards"][number]) =>
    auction === "Kiti" ? `${y.label} — ${y.auction}` : y.label;
  const yard = yards.find((y) => optionText(y) === yardText);

  const portName = (code: string) => data.ports.find((p) => p.code === code)?.name ?? code;
  const bidUsd = Number(bid.replace(/\s/g, "").replace(",", "."));

  let outcome:
    | { kind: "empty"; text: string }
    | { kind: "ok"; best: NonNullable<ReturnType<typeof calculateBest>> } = {
    kind: "empty",
    text: "Pasirinkite aikštelę, kad pamatytumėte kainą.",
  };
  if (yard && Number.isFinite(bidUsd) && bidUsd >= 0) {
    const best = calculateBest(
      { auction: yard.feeKey, bidUsd, sizeClass: size, vehicleType },
      yard.routes,
      data.tariffs,
    );
    outcome = best
      ? { kind: "ok", best }
      : {
          kind: "empty",
          text:
            cargoTypeFor(size) === "moto"
              ? "Iš šios aikštelės motociklų transporto tarifo nėra."
              : "Šiai aikštelei transporto tarifo nėra.",
        };
  } else if (yard) {
    outcome = { kind: "empty", text: "Įveskite aukciono kainą skaičiais." };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Įvestis */}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend className="label">Aukcionas</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {AUCTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAuction(a);
                  setYardText("");
                }}
                className={`seg ${auction === a ? "seg-on" : ""}`}
                aria-pressed={auction === a}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="yard" className="label">
            Aikštelė <span className="muted">({yards.length})</span>
          </label>
          <input
            id="yard"
            list="yard-list"
            value={yardText}
            onChange={(e) => setYardText(e.target.value)}
            placeholder="Pradėkite rašyti miestą arba valstiją…"
            className="field mt-2"
            autoComplete="off"
          />
          <datalist id="yard-list">
            {yards.map((y) => (
              <option key={y.id} value={optionText(y)} />
            ))}
          </datalist>
        </div>

        <fieldset>
          <legend className="label">Transporto klasė</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {SIZES.map((s) => (
              <label key={s.value} className={`opt ${size === s.value ? "opt-on" : ""}`}>
                <input
                  type="radio"
                  name="size"
                  value={s.value}
                  checked={size === s.value}
                  onChange={() => {
                    setSize(s.value);
                    const moto = cargoTypeFor(s.value) === "moto";
                    if (moto && vehicleType !== "moto") setVehicleType("moto");
                    if (!moto && vehicleType === "moto") setVehicleType("car");
                  }}
                  className="sr-only"
                />
                <span className="font-medium">{s.label}</span>
                {s.hint && <span className="muted block text-xs">{s.hint}</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bid" className="label">Aukciono kaina, $</label>
            <input
              id="bid"
              inputMode="decimal"
              value={bid}
              onChange={(e) => setBid(e.target.value)}
              className="field mt-2 tabular-nums"
            />
          </div>
          <div>
            <label htmlFor="duty" className="label">Muito tipas</label>
            <select
              id="duty"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="field mt-2"
            >
              {DUTY_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Rezultatas */}
      <section aria-live="polite" className="card lg:sticky lg:top-6 self-start">
        {outcome.kind === "empty" ? (
          <p className="muted py-12 text-center">{outcome.text}</p>
        ) : (
          <Breakdown
            result={outcome.best.result}
            portName={portName(outcome.best.route.portCode)}
            alternatives={outcome.best.alternatives}
            usdToEur={data.tariffs.usdToEur}
            fxBufferPct={data.tariffs.fxBufferPct}
          />
        )}
      </section>
    </div>
  );
}
