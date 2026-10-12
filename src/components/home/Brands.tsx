import Link from "next/link";
import { POPULAR_MAKES } from "@/lib/makes.ts";

export default function Brands() {
  return (
    <div className="container-x pb-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {POPULAR_MAKES.map((m) => (
          <Link key={m} href={`/katalogas?make=${encodeURIComponent(m)}`}
            className="rounded-lg border border-line px-3 py-4 text-center text-[15px] font-semibold tracking-wide text-muted transition-colors hover:border-accent hover:text-accent">
            {m}
          </Link>
        ))}
      </div>
    </div>
  );
}
