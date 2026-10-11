import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "./AuthForm.tsx";

export const metadata: Metadata = { title: "Prisijungimas — Tavo auto USA" };

async function Form({ searchParams }: { searchParams: PageProps<"/prisijungti">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  return <AuthForm next={next} linkError={sp.klaida === "nuoroda"} />;
}

export default function Page({ searchParams }: PageProps<"/prisijungti">) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <p className="label">Tavo auto USA</p>
      <h1 className="mt-2 mb-8 text-3xl font-semibold tracking-tight">Paskyra</h1>
      <Suspense fallback={<div className="card muted">Kraunama…</div>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
