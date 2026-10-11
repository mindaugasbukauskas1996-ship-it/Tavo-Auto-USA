import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server.ts";
import { signOut } from "@/app/prisijungti/actions.ts";

export const metadata: Metadata = { title: "Mano paskyra — Tavo auto USA" };

async function Account() {
  const user = await currentUser();
  if (!user) redirect("/prisijungti?next=/paskyra");
  return (
    <div className="space-y-6">
      <section className="card">
        <p className="label">Prisijungta</p>
        <p className="mt-2 text-lg font-medium">{user.name || user.email}</p>
        {user.name && <p className="muted">{user.email}</p>}
        <form action={signOut} className="mt-6">
          <button className="seg text-sm">Atsijungti</button>
        </form>
      </section>
      <section className="card">
        <h2 className="text-lg font-semibold">Narystė ir statymai</h2>
        <p className="muted mt-2 text-sm">
          Netrukus čia galėsite pasirinkti narystės planą, sumokėti užstatą ir matyti savo statymus.
        </p>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Mano paskyra</h1>
      <Suspense fallback={<p className="muted">Kraunama…</p>}>
        <Account />
      </Suspense>
    </main>
  );
}
