import "server-only";

export interface Lot {
  id: string;
  platform: "copart" | "iaai";
  lot_number: string;
  vin: string | null;
  title: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  odometer_mi: number | null;
  primary_damage: string | null;
  secondary_damage: string | null;
  run_condition: string | null;
  has_key: boolean | null;
  sale_document: string | null;
  auction_at: string | null;
  auction_state: string | null;
  is_buy_now: boolean | null;
  current_bid_usd: number | null;
  buy_now_usd: number | null;
  sale_price_usd: number | null;
  outcome: string | null;
  facility_city: string | null;
  facility_state: string | null;
  office_name: string | null;
  send_from: string | null;
  thumb: string | null;
  images?: string[];
  yard_id: number | null;
  vehicle_type: string | null;
  body_style: string | null;
  fuel: string | null;
  engine: string | null;
  transmission: string | null;
  drive: string | null;
  color: string | null;
}

export interface SearchResult {
  lots: Lot[];
  next_cursor: string | null;
  has_more: boolean;
  stale?: boolean;
  error?: string;
}

/** Visos API užklausos eina per Supabase Edge funkciją „catalog“ (talpykla + raktas serveryje). */
async function call<T>(body: object): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/catalog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ error: `Klaida ${res.status}` }));
  if (!res.ok) throw new Error(data.error ?? `Klaida ${res.status}`);
  return data as T;
}

export async function searchLots(params: Record<string, string>, cursor = ""): Promise<SearchResult> {
  try {
    return await call<SearchResult>({ action: "search", params, cursor });
  } catch (e) {
    return { lots: [], next_cursor: null, has_more: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getLot(id: string): Promise<Lot | null> {
  try {
    const r = await call<{ lot: Lot | null }>({ action: "lot", id });
    return r.lot;
  } catch {
    return null;
  }
}

export const lotPath = (id: string) => `/lotas/${id.replace(":", "-")}`;
export const lotIdFromSlug = (slug: string) => slug.replace(/^(copart|iaai)-/, "$1:");
