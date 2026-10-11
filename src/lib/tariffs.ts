import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Auction, FeeBracket, SizeClass, Tariffs, VehicleType } from "./calculator/types.ts";
import type { Route } from "./calculator/calculate.ts";

export interface Yard {
  id: number;
  label: string;   // „ABILENE, Texas“
  auction: string; // Copart, IAAI, Manheim…
  feeKey: Auction | null;
  routes: Route[];
}

export interface Port {
  code: string;
  name: string;
}

export interface CalculatorData {
  tariffs: Tariffs;
  yards: Yard[];
  ports: Port[];
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Nenustatyti Supabase aplinkos kintamieji (žr. .env.example)");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Supabase grąžina daugiausia 1000 eilučių per užklausą — skaitome dalimis. */
async function all<T>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db().from(table).select(columns).range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as T[]));
    if (!data || data.length < page) return out;
  }
}

const titleCase = (s: string) =>
  s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s\-/(])\p{L}/gu, (m) => m.toUpperCase()) : s;

export async function loadCalculatorData(): Promise<CalculatorData> {
  const [ports, yards, routes, sea, fees, duty, settings] = await Promise.all([
    all<{ code: string; name: string; sort: number }>("ports", "code,name,sort"),
    all<{ id: number; city: string; state: string; auction: string }>("yards", "id,city,state,auction"),
    all<{ yard_id: number; port_code: string; cargo_type: "car" | "moto"; price_usd: number }>(
      "towing_routes", "yard_id,port_code,cargo_type,price_usd"),
    all<{ port_code: string; size_class: SizeClass; price_usd: number }>("sea_rates", "port_code,size_class,price_usd"),
    all<{ auction: Auction; from_usd: number; to_usd: number | null; fee_usd: number; pct: number }>(
      "auction_fee_brackets", "auction,from_usd,to_usd,fee_usd,pct"),
    all<{ vehicle_type: VehicleType; pct: number | null }>("duty_rates", "vehicle_type,pct"),
    all<{ key: string; value: number }>("settings", "key,value"),
  ]);

  const s = Object.fromEntries(settings.map((r) => [r.key, Number(r.value)]));
  const num = (k: string) => s[k] ?? 0;

  const seaMap: Tariffs["sea"] = {};
  for (const r of sea) (seaMap[r.port_code] ??= {})[r.size_class] = Number(r.price_usd);

  const auctionFees: Tariffs["auctionFees"] = {};
  for (const f of fees) {
    (auctionFees[f.auction] ??= [] as FeeBracket[]).push({
      fromUsd: Number(f.from_usd),
      toUsd: f.to_usd === null ? null : Number(f.to_usd),
      feeUsd: Number(f.fee_usd),
      pct: Number(f.pct),
    });
  }

  const tariffs: Tariffs = {
    usdToEur: num("usd_to_eur"),
    fxBufferPct: num("fx_buffer_pct"),
    vatPct: num("vat_pct"),
    declarationEur: num("declaration_eur"),
    portFeesEur: num("port_fees_eur"),
    unloadingEur: num("unloading_eur"),
    brokerFeeEur: num("broker_fee_eur"),
    sea: seaMap,
    auctionFees,
    dutyPct: Object.fromEntries(duty.map((d) => [d.vehicle_type, d.pct === null ? null : Number(d.pct)])) as Tariffs["dutyPct"],
  };

  const byYard = new Map<number, Route[]>();
  for (const r of routes) {
    const list = byYard.get(r.yard_id) ?? [];
    list.push({ portCode: r.port_code, cargoType: r.cargo_type, priceUsd: Number(r.price_usd) });
    byYard.set(r.yard_id, list);
  }

  const feeKeyOf = (a: string): Auction | null =>
    a === "Copart" ? "copart" : a === "IAAI" ? "iaai" : null;

  return {
    tariffs,
    ports: ports.sort((a, b) => a.sort - b.sort).map(({ code, name }) => ({ code, name })),
    yards: yards
      .map((y) => ({
        id: y.id,
        label: [titleCase(y.city) || "(be pavadinimo)", y.state].join(", "),
        auction: y.auction,
        feeKey: feeKeyOf(y.auction),
        routes: byYard.get(y.id) ?? [],
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "lt")),
  };
}
