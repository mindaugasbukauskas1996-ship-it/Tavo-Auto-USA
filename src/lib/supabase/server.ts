import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Supabase klientas su prisijungusio vartotojo sesija (serverio komponentams ir veiksmams). */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Serverio komponente slapukų rašyti negalima — sesiją atnaujina proxy.ts
          }
        },
      },
    },
  );
}

/** Grąžina prisijungusį vartotoją ir jo rolę arba null (vienai užklausai — vienas kvietimas). */
export const currentUser = cache(async () => {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, first_name, last_name")
    .eq("id", data.user.id)
    .maybeSingle();
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.full_name || "";
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name,
    firstName: profile?.first_name || name.split(" ")[0] || "",
    isAdmin: profile?.role === "admin",
  };
});
