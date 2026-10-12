import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLot, lotIdFromSlug, lotPath } from "@/lib/catalog.ts";
import { loadTariffs, loadYard } from "@/lib/tariffs.ts";
import { currentUser, supabaseServer } from "@/lib/supabase/server.ts";
import { guessSizeClass, guessVehicleType } from "@/lib/calculator/vehicle.ts";
import { fmtDate, fmtKm, ltDamage, ltDrive, ltFuel, ltRunCondition, ltSeller, ltTransmission, timeLeft } from "@/lib/lt.ts";
import { usd } from "@/components/Breakdown.tsx";
import { AuctionBadge, lotLocation } from "@/components/LotCard.tsx";
import { IconCalc, IconPin } from "@/components/icons.tsx";
import Gallery from "./Gallery.tsx";
import LotCalculator from "./LotCalculator.tsx";
import CopyChip from "./CopyChip.tsx";
import BidBox from "./BidBox.tsx";
import FavoriteButton from "./FavoriteButton.tsx";

export const metadata: Metadata = { title: "Automobilis — Tavo auto USA" };

function Spec({ k, v, highlight }: { k: string; v: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <dt className="muted text-xs">{k}</dt>
      <dd className="mt-0.5 text-[15px]">
        {highlight && v ? <span className="ok inline-block px-2 py-0.5 text-sm font-semibold">{v}</span> : v ?? "—"}
      </dd>
    </div>
  );
}

function Line({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="muted">{k}</span>
      <span className="text-right font-semibold">{v ?? "—"}</span>
    </div>
  );
}

async function LotView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lot = await getLot(lotIdFromSlug(decodeURIComponent(id)));
  if (!lot) notFound();

  const [{ tariffs, ports }, yard, user] = await Promise.all([
    loadTariffs(),
    lot.yard_id ? loadYard(lot.yard_id) : Promise.resolve(null),
    currentUser(),
  ]);
  let myBid: { max_bid_usd: number; status: string } | null = null;
  let isFav = false;
  if (user) {
    const db = await supabaseServer();
    const [b, f] = await Promise.all([
      db.from("bids").select("max_bid_usd,status").eq("lot_id", lot.id).in("status", ["pending", "placed", "won", "lost"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("favorites").select("lot_id").eq("lot_id", lot.id).maybeSingle(),
    ]);
    myBid = b.data ? { max_bid_usd: Number(b.data.max_bid_usd), status: b.data.status } : null;
    isFav = !!f.data;
  }
  const size = guessSizeClass(lot.vehicle_type, lot.body_style);
  const vehicleType = guessVehicleType(size, lot.year);
  const startBid = (lot.current_bid_usd ?? 0) > 1 ? lot.current_bid_usd! + 100 : lot.buy_now_usd ?? 3000;
  const ended = lot.auction_state === "ended" || !!lot.outcome;
  const left = timeLeft(lot.auction_at);
  const docOk = /clean|certificate of title/i.test(lot.sale_document ?? "");

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="muted text-sm" aria-label="Kelias">
          <Link href="/" className="hover:text-accent">Pradžia</Link> / <Link href="/katalogas" className="hover:text-accent">Aukcionai</Link> / <span className="text-ink">{lot.title}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-4">
          {lot.vin && <CopyChip label="VIN" value={lot.vin} />}
          <CopyChip label="Lot" value={lot.lot_number} />
          <AuctionBadge platform={lot.platform} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Gallery images={lot.images ?? []} alt={lot.title ?? ""} />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-3">
            <Spec k="Degalų tipas" v={ltFuel(lot.fuel)} />
            <Spec k="Kėbulo tipas" v={lot.body_style ?? lot.vehicle_type} />
            <Spec k="Varantieji ratai" v={ltDrive(lot.drive)} />
            <Spec k="Pagrindinė žala" v={ltDamage(lot.primary_damage)} />
            <Spec k="Papildoma žala" v={ltDamage(lot.secondary_damage)} />
            <Spec k="Variklis" v={lot.engine} />
            <Spec k="Variklio būsena" v={ltRunCondition(lot.run_condition)} highlight={/run/i.test(lot.run_condition ?? "")} />
            <Spec k="Transmisija" v={ltTransmission(lot.transmission)} />
            <Spec k="Spalva" v={lot.color} />
            <Spec k="Odometras" v={fmtKm(lot.odometer_mi)} />
            <Spec k="Raktai" v={lot.has_key === null ? null : lot.has_key ? "Yra" : "Nėra"} highlight={lot.has_key === true} />
            <Spec k="Metai" v={lot.year} />
          </dl>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{lot.title}</h1>
              <FavoriteButton lotId={lot.id} initial={isFav} loggedIn={!!user} lotPath={lotPath(lot.id)} />
            </div>
            <p className="muted mt-1 flex items-center gap-1 text-sm"><IconPin size={15} /> Lokacija: {lotLocation(lot)}</p>
            <div className="mt-4 border-t border-line pt-3">
              <Line k="Pardavėjas" v={ltSeller(lot.seller_type) ?? "Nenurodytas"} />
              <Line k="Dokumentų statusas" v={lot.sale_document
                ? <span className={docOk ? "ok inline-block px-2 py-0.5" : "warn inline-block px-2 py-0.5"}>{lot.sale_document}</span>
                : null} />
              <Line k="Išplaukimo uostas" v={lot.send_from} />
            </div>

            <div className="mt-4 rounded-lg p-4" style={{ background: "var(--bg)" }}>
              <Line k="Dabartinė būsena" v={ended ? "Aukcionas baigėsi" : left ? `Liko ${left}` : "Vyksta aukcionas"} />
              <Line k="Aukciono data" v={fmtDate(lot.auction_at)} />
              <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
                <div>
                  <p className="muted text-xs">{ended && lot.sale_price_usd ? "Parduota už" : "Dabartinis statymas"}</p>
                  <p className="text-lg font-bold tabular-nums">
                    {ended && lot.sale_price_usd ? usd(lot.sale_price_usd) : (lot.current_bid_usd ?? 0) > 1 ? usd(lot.current_bid_usd!) : "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="muted text-xs">Mano statymas</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: myBid ? "var(--accent)" : undefined }}>
                    {myBid ? usd(myBid.max_bid_usd) : "$0"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="muted text-xs">Pirkti dabar</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: lot.buy_now_usd ? "var(--accent)" : undefined }}>
                    {lot.buy_now_usd ? usd(lot.buy_now_usd) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {!ended && (
              <div className="mt-4">
                <BidBox lotId={lot.id} start={Math.round(startBid)} loggedIn={!!user} lotPath={lotPath(lot.id)}
                  myBid={myBid && ["pending", "placed"].includes(myBid.status) ? myBid.max_bid_usd : null} />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold">
              <IconCalc size={20} /> Kainos skaičiuoklė
            </h2>
            {yard ? (
              <LotCalculator tariffs={tariffs} ports={ports} yard={yard} initialBid={Math.round(startBid)} initialSize={size} vehicleType={vehicleType} />
            ) : (
              <p className="text-sm">
                Šios aikštelės transporto tarifo neturime — kainą patikslinsime individualiai.{" "}
                <Link href="/skaiciuokle" className="link">Atidaryti skaičiuoklę</Link>
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default function Page({ params }: PageProps<"/lotas/[id]">) {
  return (
    <main className="flex-1" style={{ background: "var(--bg)" }}>
      <div className="container-x py-6">
        <Suspense fallback={<p className="muted">Kraunama…</p>}>
          <LotView params={params} />
        </Suspense>
      </div>
    </main>
  );
}
