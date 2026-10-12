"use server";

import { revalidatePath } from "next/cache";
import { currentUser, supabaseServer } from "@/lib/supabase/server.ts";

export type AdminResult = { ok: boolean; message: string };

async function adminDb() {
  const u = await currentUser();
  if (!u?.isAdmin) throw new Error("Tik administratorius.");
  return supabaseServer();
}
const fail = (e: unknown): AdminResult => ({ ok: false, message: e instanceof Error ? e.message : String(e) });

const BID_STATUSES = ["pending", "placed", "won", "lost", "cancelled"];

export async function updateBid(id: number, status: string, finalPrice: string, note: string): Promise<AdminResult> {
  try {
    if (!BID_STATUSES.includes(status)) throw new Error("Neteisinga būsena.");
    const fp = finalPrice.trim() === "" ? null : Number(finalPrice.replace(/\s/g, "").replace(",", "."));
    if (fp !== null && !(fp >= 0)) throw new Error("Neteisinga galutinė kaina.");
    const db = await adminDb();
    const { error } = await db.from("bids")
      .update({ status, final_price_usd: fp, admin_note: note.trim().slice(0, 500), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/statymai");
    return { ok: true, message: "Išsaugota." };
  } catch (e) { return fail(e); }
}

const PLAN_TRANSITIONS: Record<string, { status: string; stamp?: "activated_at" | "closed_at" }> = {
  activate: { status: "active", stamp: "activated_at" },
  refunded: { status: "refunded", stamp: "closed_at" },
  cancel: { status: "cancelled", stamp: "closed_at" },
};

export async function setPlanStatus(id: number, action: string): Promise<AdminResult> {
  try {
    const t = PLAN_TRANSITIONS[action];
    if (!t) throw new Error("Neteisingas veiksmas.");
    const db = await adminDb();
    const patch: Record<string, string> = { status: t.status };
    if (t.stamp) patch[t.stamp] = new Date().toISOString();
    const { error } = await db.from("user_plans").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/klientai");
    return { ok: true, message: "Atnaujinta." };
  } catch (e) { return fail(e); }
}

export async function saveTelegram(_: AdminResult | null, form: FormData): Promise<AdminResult> {
  try {
    const db = await adminDb();
    const token = String(form.get("token") ?? "").trim();
    const chat = String(form.get("chat") ?? "").trim();
    const { error } = await db.rpc("set_telegram", { p_token: token, p_chat: chat });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/klientai");
    return { ok: true, message: "Telegram nustatymai išsaugoti." };
  } catch (e) { return fail(e); }
}

export async function testTelegram(): Promise<AdminResult> {
  try {
    const db = await adminDb();
    const { error } = await db.rpc("test_telegram");
    if (error) throw new Error(error.message);
    return { ok: true, message: "Bandomasis pranešimas išsiųstas — patikrinkite Telegram." };
  } catch (e) { return fail(e); }
}
