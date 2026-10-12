import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server.ts";

/** Grąžina admin vartotoją arba nukreipia / parodo klaidą. */
export async function requireAdmin(next: string) {
  const user = await currentUser();
  if (!user) redirect(`/prisijungti?next=${encodeURIComponent(next)}`);
  return user;
}

export function NotAdmin({ email }: { email: string }) {
  return <div className="card">Ši paskyra ({email}) neturi administratoriaus teisių.</div>;
}
