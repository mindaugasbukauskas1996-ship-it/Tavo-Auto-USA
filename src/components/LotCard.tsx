/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Lot } from "@/lib/catalog.ts";
import { lotPath } from "@/lib/catalog.ts";
import { usd } from "@/components/Breakdown.tsx";

export const km = (mi: number | null) =>
  mi === null ? "—" : `${new Intl.NumberFormat("lt-LT").format(Math.round(mi * 1.609344))} km`;

export const auctionDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("lt-LT", { timeZone: "Europe/Vilnius", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Data nežinoma";

export default function LotCard({ lot }: { lot: Lot }) {
  const price =
    lot.current_bid_usd ? { label: "Dabartinis statymas", v: lot.current_bid_usd }
    : lot.buy_now_usd ? { label: "Pirkti dabar", v: lot.buy_now_usd }
    : null;
  return (
    <Link href={lotPath(lot.id)} className="card group block overflow-hidden p-0 sm:p-0">
      <div className="relative aspect-[4/3] bg-[var(--line)]">
        {lot.thumb && (
          <img src={lot.thumb} alt={lot.title ?? ""} loading="lazy" className="h-full w-full object-cover" />
        )}
        <span className="badge absolute left-2 top-2">{lot.platform === "copart" ? "Copart" : "IAAI"}</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold leading-snug group-hover:underline">{lot.title}</h3>
        <p className="muted mt-1 text-xs">Lotas {lot.lot_number}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="muted">Rida</dt><dd className="tabular-nums">{km(lot.odometer_mi)}</dd>
          <dt className="muted">Pažeidimas</dt><dd className="truncate">{lot.primary_damage ?? "—"}</dd>
          <dt className="muted">Vieta</dt><dd className="truncate">{lot.office_name ?? "—"}</dd>
          <dt className="muted">Aukcionas</dt><dd>{auctionDate(lot.auction_at)}</dd>
        </dl>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="muted text-xs">{price?.label ?? "Statymų dar nėra"}</span>
          {price && <span className="text-lg font-semibold tabular-nums">{usd(price.v)}</span>}
        </div>
      </div>
    </Link>
  );
}
