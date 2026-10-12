"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, currentUser } from "@/lib/supabase/server.ts";

export type ActionResult = { ok: boolean; message: string };

const errText = (m: string) =>
  m.replace(/^.*?ERROR:\s*/i, "").replace(/\s*\(SQLSTATE.*$/, "") || "Įvyko klaida. Bandykite dar kartą.";

async function db() {
  const user = await currentUser();
  if (!user) throw new Error("Prisijunkite.");
  return { supabase: await supabaseServer(), user };
}

export async function placeBid(lotId: string, amount: number): Promise<ActionResult> {
  try {
    const { supabase } = await db();
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Įveskite statymo sumą." };
    const { error } = await supabase.rpc("place_bid", { p_lot_id: lotId, p_amount: Math.round(amount) });
    if (error) return { ok: false, message: errText(error.message) };
    revalidatePath("/paskyra");
    return { ok: true, message: "Statymas priimtas. Apie rezultatą pranešime po aukciono." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function cancelBid(id: number): Promise<ActionResult> {
  try {
    const { supabase } = await db();
    const { error } = await supabase.rpc("cancel_bid", { p_id: id });
    if (error) return { ok: false, message: errText(error.message) };
    revalidatePath("/paskyra");
    return { ok: true, message: "Statymas atšauktas." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function toggleFavorite(lotId: string, on: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await db();
    const q = on
      ? supabase.from("favorites").upsert({ user_id: user.id, lot_id: lotId })
      : supabase.from("favorites").delete().eq("user_id", user.id).eq("lot_id", lotId);
    const { error } = await q;
    if (error) return { ok: false, message: errText(error.message) };
    return { ok: true, message: on ? "Pridėta prie mėgstamiausių." : "Pašalinta iš mėgstamiausių." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function requestPlan(planId: number): Promise<ActionResult> {
  try {
    const { supabase } = await db();
    const { error } = await supabase.rpc("request_plan", { p_plan_id: planId });
    if (error) return { ok: false, message: errText(error.message) };
    revalidatePath("/paskyra");
    return { ok: true, message: "Planas užsakytas. Apmokėjimo instrukcijas rasite skiltyje „Sąskaitos“." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function requestRefund(id: number): Promise<ActionResult> {
  try {
    const { supabase } = await db();
    const { error } = await supabase.rpc("request_refund", { p_id: id });
    if (error) return { ok: false, message: errText(error.message) };
    revalidatePath("/paskyra");
    return { ok: true, message: "Prašymas grąžinti užstatą išsiųstas." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

const PROFILE_FIELDS = [
  "first_name", "last_name", "phone", "country", "address", "city", "zip",
  "company_name", "company_code", "vat_code", "company_address",
] as const;

export async function updateProfile(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await db();
    const patch: Record<string, string> = {};
    for (const f of PROFILE_FIELDS) patch[f] = String(form.get(f) ?? "").trim().slice(0, 120);
    if (!patch.first_name || !patch.last_name) return { ok: false, message: "Įveskite vardą ir pavardę." };
    patch.full_name = `${patch.first_name} ${patch.last_name}`;
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) return { ok: false, message: errText(error.message) };
    revalidatePath("/paskyra");
    return { ok: true, message: "Pakeitimai išsaugoti." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function changePassword(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await db();
    const pw = String(form.get("password") ?? "");
    if (pw.length < 8) return { ok: false, message: "Slaptažodis per trumpas (bent 8 simboliai)." };
    if (pw !== String(form.get("password2") ?? "")) return { ok: false, message: "Slaptažodžiai nesutampa." };
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return { ok: false, message: errText(error.message) };
    return { ok: true, message: "Slaptažodis pakeistas." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
