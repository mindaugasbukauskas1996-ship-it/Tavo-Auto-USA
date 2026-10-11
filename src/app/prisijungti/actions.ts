"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server.ts";

export type AuthState = { error?: string; info?: string };

const msg = (m: string) =>
  m.includes("Invalid login") ? "Neteisingas el. paštas arba slaptažodis."
  : m.includes("Email not confirmed") ? "El. paštas dar nepatvirtintas — paspauskite nuorodą laiške."
  : m.includes("already registered") ? "Toks el. paštas jau užregistruotas."
  : m.includes("Password should") ? "Slaptažodis per trumpas (bent 8 simboliai)."
  : m;

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: msg(error.message) };
  const next = String(form.get("next") ?? "/");
  redirect(next.startsWith("/") ? next : "/");
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Slaptažodis per trumpas (bent 8 simboliai)." };
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signUp({
    email: String(form.get("email") ?? "").trim(),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { full_name: String(form.get("full_name") ?? ""), phone: String(form.get("phone") ?? "") },
    },
  });
  if (error) return { error: msg(error.message) };
  return { info: "Išsiuntėme patvirtinimo laišką. Paspauskite jame esančią nuorodą ir prisijunkite." };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
