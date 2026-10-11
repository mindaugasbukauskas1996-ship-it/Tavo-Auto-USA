import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLot, lotIdFromSlug } from "@/lib/catalog.ts";
import { loadTariffs, loadYard } from "@/lib/tariffs.ts";
import { guessSizeClass, guessVehicleType } from "@/lib/calculator/vehicle.ts";
import { usd } from "@/components/Breakdown.tsx";
import { auctionDate, km } from "@/components/LotCard.tsx";
import Gallery from "./Gallery.tsx";
import LotCalculator from "./LotCalculator.tsx";

export const metadata: Metadata = { title: "Automobilis — Tavo auto USA" };

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-line py-2 text-sm">
      <dt className="muted">{k}</dt>
      <dd className="text-right">{v ?? "—"}</dd>
    </div>
  );
}

async function LotView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lot = await getLot(lotIdFromSlug(decodeURIComponent(id)));
  if (!lot) notFound();

  const [{ tariffs, ports }, yard] = await Promise.all([
    loadTariffs(),
    lot.yard_id ? loadYard(lot.yard_id) : Promise.resolve(null),
  ]);
  const size = guessSizeClass(lot.vehicle_type, lot.body_style);
  const vehicleType = guessVehicleType(size, lot.year);
  const startBid = lot.current_bid_usd ?? lot.buy_now_usd ?? 3000;
  const ended = lot.auction_state === "ended" || !!lot.outcome;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Gallery images={lot.images ?? []} alt={lot.title ?? ""} />
        <section className="card">
          <h2 className="text-lg font-semibold">Duomenys</h2>
          <dl className="mt-3">
            <Row k="VIN" v={<span className="font-mono">{lot.vin}</span>} />
            <Row k="Rida" v={km(lot.odometer_mi)} />
            <Row k="Pagrindinis pažeidimas" v={lot.primary_damage} />
            <Row k="Papildomas pažeidimas" v={lot.secondary_damage} />
            <Row k="Būklė" v={lot.run_condition} />
            <Row k="Raktai" v={lot.has_key === null ? null : lot.has_key ? "Yra" : "Nėra"} />
            <Row k="Dokumentas" v={lot.sale_document} />
            <Row k="Variklis" v={lot.engine} />
            <Row k="Kuras" v={lot.fuel} />
            <Row k="Pavarų dėžė" v={lot.transmission} />
            <Row k="Varantieji ratai" v={lot.drive} />
            <Row k="Kėbulas" v={lot.body_style ?? lot.vehicle_type} />
            <Row k="Spalva" v={lot.color} />
          </dl>
        </section>
      </div>

      <div className="space-y-6">
        <section className="card">
          <p className="label">{lot.platform === "copart" ? "Copart" : "IAAI"} · lotas {lot.lot_number}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{lot.title}</h1>
          <dl className="mt-4">
            <Row k="Aukcionas" v={ended ? "Baigėsi" : auctionDate(lot.auction_at)} />
            <Row k="Vieta" v={lot.office_name} />
            <Row k="Išplaukimo uostas" v={lot.send_from} />
            {lot.current_bid_usd ? <Row k="Dabartinis statymas" v={usd(lot.current_bid_usd)} /> : null}
            {lot.buy_now_usd ? <Row k="Pirkti dabar" v={usd(lot.buy_now_usd)} /> : null}
            {lot.sale_price_usd ? <Row k="Parduota už" v={usd(lot.sale_price_usd)} /> : null}
          </dl>
          {!ended && (
            <div className="mt-5">
              <button type="button" disabled className="btn w-full opacity-60">Statyti</button>
              <p className="muted mt-2 text-center text-xs">Statymai bus įjungti netrukus.</p>
            </div>
          )}
        </section>

        {yard ? (
          <LotCalculator tariffs={tariffs} ports={ports} yard={yard} initialBid={startBid} initialSize={size} vehicleType={vehicleType} />
        ) : (
          <section className="card">
            <p className="text-sm">Šios aikštelės transporto tarifo neturime — kainą patikslinsime individualiai.</p>
            <Link href="/skaiciuokle" className="mt-3 inline-block text-sm underline">Atidaryti skaičiuoklę</Link>
          </section>
        )}
      </div>
    </div>
  );
}

export default function Page({ params }: PageProps<"/lotas/[id]">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/katalogas" className="muted text-sm underline">← Katalogas</Link>
      <div className="mt-4">
        <Suspense fallback={<p className="muted">Kraunama…</p>}>
          <LotView params={params} />
        </Suspense>
      </div>
    </main>
  );
}
