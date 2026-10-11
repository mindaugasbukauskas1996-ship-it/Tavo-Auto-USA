import Link from "next/link";
import { Suspense } from "react";
import { currentUser } from "@/lib/supabase/server.ts";

async function UserMenu() {
  const user = await currentUser();
  if (!user) {
    return <Link href="/prisijungti" className="btn px-4 py-2 text-sm">Prisijungti</Link>;
  }
  return (
    <div className="flex items-center gap-4 text-sm">
      {user.isAdmin && <Link href="/admin" className="nav-link">Administravimas</Link>}
      <Link href="/paskyra" className="nav-link">Mano paskyra</Link>
    </div>
  );
}

export default function Header() {
  return (
    <header className="border-b border-line" style={{ background: "var(--surface)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">Tavo auto USA</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/katalogas" className="nav-link">Katalogas</Link>
            <Link href="/skaiciuokle" className="nav-link">Skaičiuoklė</Link>
          </nav>
        </div>
        <Suspense fallback={<span className="muted text-sm">…</span>}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
