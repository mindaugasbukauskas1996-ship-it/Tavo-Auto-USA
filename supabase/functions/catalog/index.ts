// Apibara tarpinė funkcija: paieška su talpykla, loto informacija, pakeitimų srautas.
// API raktas laikomas Supabase Vault ir niekada nepasiekia naršyklės.
import { createClient } from "jsr:@supabase/supabase-js@2";

const API = "https://apibara.tech/api/v1/vehicle-auction";
const SEARCH_TTL_MIN = 15;
const LOT_TTL_MIN = 15;
const DEFAULT_HOURLY_BUDGET = 20;

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

let apiKey: string | null = null;
async function key() {
  if (apiKey) return apiKey;
  const { data, error } = await db.rpc("get_apibara_key");
  if (error || !data) throw new Error("API raktas nerastas");
  return (apiKey = data as string);
}

async function getState(k: string) {
  const { data } = await db.from("api_state").select("value").eq("key", k).maybeSingle();
  return data?.value ?? null;
}
async function setState(k: string, value: string) {
  await db.from("api_state").upsert({ key: k, value, updated_at: new Date().toISOString() });
}

/** Valandinis limitas, kad atsitiktinis ar piktavalis srautas neišnaudotų kvotos. */
async function takeBudget(): Promise<boolean> {
  const hour = new Date().toISOString().slice(0, 13);
  const limit = Number((await getState("hourly_budget")) ?? DEFAULT_HOURLY_BUDGET);
  const cur = (await getState("budget_hour")) ?? "";
  const [h, n] = cur.split("|");
  const used = h === hour ? Number(n) : 0;
  if (used >= limit) return false;
  await setState("budget_hour", `${hour}|${used + 1}`);
  return true;
}

class QuotaError extends Error {}

// API laukia masyvų šiems filtrams (fuel_type[]=…)
const ARRAY_PARAMS = new Set(["fuel_type", "damage", "transmission", "drive_type"]);

async function apibara(path: string, params: Record<string, string> = {}) {
  if (!(await takeBudget())) throw new QuotaError("Viršytas valandinis API užklausų limitas");
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) {
    if (v === "") continue;
    if (ARRAY_PARAMS.has(k)) url.searchParams.append(`${k}[]`, v);
    else url.searchParams.set(k, v);
  }
  const res = await fetch(url, { headers: { "X-API-Key": await key(), Accept: "application/json" } });
  const remaining = res.headers.get("x-subscription-remaining");
  if (remaining !== null) await setState("quota_remaining", remaining);
  await setState("last_call", `${new Date().toISOString()} ${res.status} ${path}`);
  if (res.status === 429 || res.status === 402) throw new QuotaError(`API kvota baigėsi (${res.status})`);
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.json();
}

// deno-lint-ignore no-explicit-any
type V = any;
const num = (x: unknown) => (x === null || x === undefined || x === "" ? null : Number(x));

function mapVehicle(v: V) {
  const media = v.media?.items ?? [];
  const images = media.filter((m: V) => m.type === "image").map((m: V) => m.large ?? m.full).filter(Boolean);
  const f = v.facility ?? {};
  return {
    id: `${v.platform}:${v.lot_number}`,
    platform: v.platform,
    lot_number: String(v.lot_number),
    vin: v.vin ?? null,
    slug_vin: v.slug_vin ?? null,
    title: v.title ?? null,
    year: num(v.year),
    make: v.make ?? null,
    model: v.model ?? null,
    series: v.series?.name ?? null,
    vehicle_type: v.type ?? null,
    body_style: v.vehicle_specs?.body_style ?? null,
    engine: v.vehicle_specs?.engine?.raw?.replace(/\s+/g, " ").trim() ?? null,
    fuel: v.vehicle_specs?.fuel_type ?? null,
    transmission: v.vehicle_specs?.transmission ?? null,
    drive: v.vehicle_specs?.drive_type ?? null,
    color: v.vehicle_specs?.exterior_color ?? null,
    odometer_mi: num(v.odometer?.mi),
    primary_damage: v.condition?.primary_damage ?? null,
    secondary_damage: v.condition?.secondary_damage ?? null,
    run_condition: v.condition?.run_condition?.label ?? null,
    has_key: v.condition?.has_key ?? null,
    sale_document: v.sale_document?.name ?? null,
    sale_document_group: v.sale_document?.sale_document_group ?? null,
    seller_type: v.seller?.type ?? null,
    auction_at: v.auction?.auction_at ?? v.ad ?? null,
    auction_state: v.auction?.state ?? null,
    is_buy_now: v.auction?.is_buy_now ?? null,
    current_bid_usd: num(v.pricing?.current_bid_usd),
    buy_now_usd: num(v.pricing?.buy_now_usd),
    sale_price_usd: num(v.pricing?.sale_price_usd ?? v.pricing?.last_sold_price_usd),
    facility_id: num(f.id),
    facility_city: f.city ?? null,
    facility_state: f.state ?? null,
    facility_zip: f.zip ?? null,
    office_name: f.office_name ?? v.details?.yard?.name ?? null,
    send_from: v.location?.send_from ?? null,
    thumb: v.media?.thumbs?.[0] ?? images[0] ?? null,
    images,
    raw: v,
    api_updated_at: v.updated_at ?? null,
    fetched_at: new Date().toISOString(),
  };
}

async function saveVehicles(list: V[]) {
  const rows = list.filter((v) => v?.platform && v?.lot_number).map(mapVehicle);
  if (rows.length) {
    const { error } = await db.from("lots").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
  return rows.map((r) => r.id);
}

const LOT_COLUMNS =
  "id,platform,lot_number,vin,title,year,make,model,odometer_mi,primary_damage,secondary_damage,run_condition,has_key,sale_document,auction_at,auction_state,is_buy_now,current_bid_usd,buy_now_usd,sale_price_usd,outcome,facility_city,facility_state,office_name,send_from,thumb,yard_id,vehicle_type,body_style,fuel,engine,transmission,drive,color,fetched_at";

async function lotsByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data } = await db.from("lots").select(LOT_COLUMNS).in("id", ids);
  const byId = new Map((data ?? []).map((r) => [r.id, r]));
  return ids.map((i) => byId.get(i)).filter(Boolean);
}

const SEARCH_PARAMS = [
  "platform", "make", "model", "year_from", "year_to", "price_min", "price_max", "s",
  "lot_status", "lot_sub_status", "odometer_from", "odometer_to", "fuel_type", "damage", "run_cond",
  "transmission", "drive_type", "loc_state", "auction_date_from", "auction_date_to",
];

async function search(params: Record<string, string>, cursor: string) {
  const clean: Record<string, string> = { per_page: "20" };
  for (const k of SEARCH_PARAMS) {
    const v = (params[k] ?? "").toString().trim();
    if (v) clean[k] = v.slice(0, 60);
  }
  if (cursor) clean.cursor = cursor.slice(0, 400);
  const cacheKey = Object.keys(clean).sort().map((k) => `${k}=${clean[k]}`).join("&");

  const { data: cached } = await db.from("api_cache").select("*").eq("key", cacheKey).maybeSingle();
  const fresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < SEARCH_TTL_MIN * 60_000;
  if (fresh) {
    return { lots: await lotsByIds(cached.lot_ids), next_cursor: cached.next_cursor, has_more: cached.has_more, cached: true };
  }
  try {
    const res = await apibara("/vehicles", clean);
    const ids = await saveVehicles(res.data ?? []);
    const entry = { key: cacheKey, lot_ids: ids, next_cursor: res.meta?.next_cursor ?? null, has_more: !!res.meta?.has_more, fetched_at: new Date().toISOString() };
    await db.from("api_cache").upsert(entry);
    return { lots: await lotsByIds(ids), next_cursor: entry.next_cursor, has_more: entry.has_more, cached: false };
  } catch (e) {
    if (cached) {
      return { lots: await lotsByIds(cached.lot_ids), next_cursor: cached.next_cursor, has_more: cached.has_more, cached: true, stale: true };
    }
    throw e;
  }
}

async function lot(id: string) {
  const [platform, lotNumber] = id.split(":");
  if (!["copart", "iaai"].includes(platform) || !/^[0-9A-Za-z-]{4,20}$/.test(lotNumber ?? "")) throw new Error("Neteisingas loto ID");
  const { data: row } = await db.from("lots").select("*").eq("id", id).maybeSingle();
  const fresh = row && Date.now() - new Date(row.fetched_at).getTime() < LOT_TTL_MIN * 60_000;
  if (fresh) return { lot: row, cached: true };
  try {
    const res = await apibara(`/vehicles/${encodeURIComponent(lotNumber)}`);
    const v = res.data ?? res.vehicle ?? res;
    if (v?.platform && v.platform !== platform) throw new Error("Lotas nerastas");
    await saveVehicles([v]);
    const { data } = await db.from("lots").select("*").eq("id", id).maybeSingle();
    return { lot: data, cached: false };
  } catch (e) {
    if (row) return { lot: row, cached: true, stale: true };
    throw e;
  }
}

/** Pakeitimų srautas: atnaujina jau žinomus lotus. Pirmą kartą pradeda nuo naujausio įvykio. */
async function changes() {
  let after = await getState("changes_cursor");
  if (after === null) {
    const probe = await apibara("/changes", { limit: "1" });
    after = String(probe.meta?.latest_available_sequence ?? probe.meta?.next_cursor ?? 0);
    await setState("changes_cursor", after);
    return { started_at: after, processed: 0 };
  }
  let res;
  try {
    res = await apibara("/changes", { after, limit: "500" });
  } catch (e) {
    if (String(e).includes("410")) { await db.from("api_state").delete().eq("key", "changes_cursor"); }
    throw e;
  }
  let updated = 0;
  for (const ev of res.data ?? []) {
    const id = `${ev.vehicle?.platform}:${ev.vehicle?.lot_number}`;
    const a = ev.after ?? {};
    const patch: Record<string, unknown> = {};
    const pick = (...keys: string[]) => keys.map((k) => a[k]).find((x) => x !== undefined);
    const bid = pick("pricing.current_bid_usd", "current_bid_usd");
    if (bid !== undefined) patch.current_bid_usd = num(bid);
    const bn = pick("pricing.buy_now_usd", "buy_now_usd");
    if (bn !== undefined) patch.buy_now_usd = num(bn);
    const sp = pick("pricing.sale_price_usd", "sale_price_usd", "pricing.last_sold_price_usd");
    if (sp !== undefined) patch.sale_price_usd = num(sp);
    const at = pick("auction.auction_at", "auction_at");
    if (at !== undefined) patch.auction_at = at;
    if (ev.event === "lot.sold") patch.outcome = "sold";
    if (ev.event === "lot.not_sold") patch.outcome = "not_sold";
    if (ev.event === "lot.removed") patch.outcome = "removed";
    if (ev.terminal || ev.event === "auction.ended") patch.auction_state = "ended";
    if (Object.keys(patch).length) {
      const { count } = await db.from("lots").update(patch, { count: "exact" }).eq("id", id);
      updated += count ?? 0;
    }
  }
  if (res.meta?.next_cursor !== undefined) await setState("changes_cursor", String(res.meta.next_cursor));
  return { processed: res.data?.length ?? 0, updated, has_more: res.meta?.has_more ?? false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    switch (body.action) {
      case "search":
        return json(await search(body.params ?? {}, body.cursor ?? ""));
      case "lot":
        return json(await lot(String(body.id ?? "")));
      case "changes":
        return json(await changes());
      default:
        return json({ error: "Nežinomas veiksmas" }, 400);
    }
  } catch (e) {
    const quota = e instanceof QuotaError;
    return json({ error: e instanceof Error ? e.message : String(e), quota }, quota ? 429 : 500);
  }
});
