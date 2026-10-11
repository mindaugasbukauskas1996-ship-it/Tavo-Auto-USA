"use server";

import { currentUser, supabaseServer } from "@/lib/supabase/server.ts";

export type SaveResult = { ok: boolean; message: string };

async function adminDb() {
  const user = await currentUser();
  if (!user?.isAdmin) throw new Error("Tik administratorius gali keisti tarifus.");
  return supabaseServer();
}

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`Netinkamas skaičius: „${v}“`);
  return n;
};

const fail = (e: unknown): SaveResult => ({ ok: false, message: e instanceof Error ? e.message : String(e) });

/** Nustatymai: kursas, buferis, PVM, fiksuoti mokesčiai. Procentai ateina kaip 21 → saugoma 0.21. */
export async function saveSettings(rows: { key: string; value: string; unit: string }[]): Promise<SaveResult> {
  try {
    const db = await adminDb();
    for (const r of rows) {
      const v = num(r.value);
      if (v < 0) throw new Error("Reikšmės negali būti neigiamos.");
      const { error } = await db.from("settings").update({ value: r.unit === "%" ? v / 100 : v }).eq("key", r.key);
      if (error) throw new Error(error.message);
    }
    return { ok: true, message: "Nustatymai išsaugoti." };
  } catch (e) { return fail(e); }
}

/** Muito tarifai; tuščias laukas = nepatvirtinta (null). */
export async function saveDuty(rows: { type: string; pct: string }[]): Promise<SaveResult> {
  try {
    const db = await adminDb();
    for (const r of rows) {
      const pct = r.pct.trim() === "" ? null : num(r.pct) / 100;
      const { error } = await db.from("duty_rates").update({ pct }).eq("vehicle_type", r.type);
      if (error) throw new Error(error.message);
    }
    return { ok: true, message: "Muito tarifai išsaugoti." };
  } catch (e) { return fail(e); }
}

export type FeeRow = { fromUsd: string; toUsd: string; feeUsd: string; pct: string };

/** Aukciono mokesčių lentelė pakeičiama visa. Intervalai turi eiti iš eilės ir nepersidengti. */
export async function saveFees(auction: "copart" | "iaai", rows: FeeRow[]): Promise<SaveResult> {
  try {
    const parsed = rows
      .filter((r) => r.fromUsd.trim() !== "")
      .map((r) => ({
        auction,
        from_usd: num(r.fromUsd),
        to_usd: r.toUsd.trim() === "" ? null : num(r.toUsd),
        fee_usd: r.feeUsd.trim() === "" ? 0 : num(r.feeUsd),
        pct: r.pct.trim() === "" ? 0 : num(r.pct) / 100,
      }))
      .sort((a, b) => a.from_usd - b.from_usd);
    parsed.forEach((r, i) => {
      if (r.to_usd !== null && r.to_usd < r.from_usd) throw new Error(`Eilutė ${i + 1}: „iki“ mažesnė už „nuo“.`);
      const prev = parsed[i - 1];
      if (prev && (prev.to_usd === null || prev.to_usd >= r.from_usd))
        throw new Error(`Intervalai persidengia ties ${r.from_usd} $.`);
    });
    const db = await adminDb();
    const del = await db.from("auction_fee_brackets").delete().eq("auction", auction);
    if (del.error) throw new Error(del.error.message);
    if (parsed.length) {
      const ins = await db.from("auction_fee_brackets").insert(parsed);
      if (ins.error) throw new Error(ins.error.message);
    }
    return { ok: true, message: `Išsaugota ${parsed.length} eil.` };
  } catch (e) { return fail(e); }
}

/** Jūros tarifai: uostas × dydžio klasė. Tuščias laukas = tarifo nėra. */
export async function saveSea(rows: { port: string; size: string; price: string }[]): Promise<SaveResult> {
  try {
    const db = await adminDb();
    const upserts = rows.filter((r) => r.price.trim() !== "").map((r) => ({
      port_code: r.port, size_class: r.size, price_usd: num(r.price),
    }));
    const { error } = await db.from("sea_rates").upsert(upserts, { onConflict: "port_code,size_class" });
    if (error) throw new Error(error.message);
    for (const r of rows.filter((r) => r.price.trim() === "")) {
      const d = await db.from("sea_rates").delete().eq("port_code", r.port).eq("size_class", r.size);
      if (d.error) throw new Error(d.error.message);
    }
    return { ok: true, message: "Jūros tarifai išsaugoti." };
  } catch (e) { return fail(e); }
}
