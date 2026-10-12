import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server.ts";

export const metadata: Metadata = { title: "Administravimas — Tavo auto USA" };

const SECTIONS = [
  { href: "/admin/tarifai", title: "Tarifai", text: "Kursas, PVM, muitas, aukcionų mokesčiai, jūros tarifai.", ready: true },
  { href: "/admin/statymai", title: "Statymai", text: "Klientų statymai, būsenos ir rezultatai.", ready: true },
  { href: "/admin/klientai", title: "Klientai ir planai", text: "Užstatų patvirtinimas, grąžinimai, Telegram pranešimai.", ready: true },
  { href: "", title: "Katalogo sinchronizacija", text: "API tiekėjo duomenų būsena.", ready: false },
];

async function Hub() {
  const user = await currentUser();
  if (!user) redirect("/prisijungti?next=/admin");
  if (!user.isAdmin) {
    return <div className="card">Ši paskyra ({user.email}) neturi administratoriaus teisių.</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map((s) =>
        s.ready ? (
          <Link key={s.title} href={s.href} className="card block hover:border-[var(--accent)]">
            <h2 className="text-lg font-semibold">{s.title} →</h2>
            <p className="muted mt-1 text-sm">{s.text}</p>
          </Link>
        ) : (
          <div key={s.title} className="card opacity-60">
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="muted mt-1 text-sm">{s.text}</p>
            <p className="label mt-3">Kuriama</p>
          </div>
        ),
      )}
    </div>
  );
}

export default function Page() {
  return (
    <main className="mx-auto w-full flex-1 max-w-6xl px-4 py-10 sm:px-6">
      <p className="label">Tavo auto USA</p>
      <h1 className="mt-2 mb-8 text-3xl font-semibold tracking-tight">Administravimas</h1>
      <Suspense fallback={<p className="muted">Kraunama…</p>}>
        <Hub />
      </Suspense>
    </main>
  );
}
