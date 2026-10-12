import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "./AuthForm.tsx";

export const metadata: Metadata = { title: "Prisijungimas — Tavo auto USA" };

async function Form({ searchParams }: { searchParams: PageProps<"/prisijungti">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const mode = sp.rezimas === "registracija" ? "up" : "in";
  return <AuthForm key={mode} next={next} linkError={sp.klaida === "nuoroda"} initialMode={mode} />;
}

export default function Page({ searchParams }: PageProps<"/prisijungti">) {
  return (
    <main className="flex-1 px-4 py-14" style={{ background: "var(--bg)" }}>
      <div className="mx-auto w-full max-w-md">
      <h1 className="mb-6 text-center text-3xl font-normal tracking-tight">Prisijungimas ir registracija</h1>
      <Suspense fallback={<div className="card muted">Kraunama…</div>}>
        <Form searchParams={searchParams} />
      </Suspense>
      </div>
    </main>
  );
}
