"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="card muted aspect-[4/3] grid place-items-center">Nuotraukų nėra</div>;
  const go = (d: number) => setI((i + d + images.length) % images.length);
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--line)]">
        <img src={images[i]} alt={`${alt} — ${i + 1} nuotrauka`} className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Ankstesnė nuotrauka"
              className="badge absolute left-2 top-1/2 -translate-y-1/2 px-3 py-2 text-lg">‹</button>
            <button type="button" onClick={() => go(1)} aria-label="Kita nuotrauka"
              className="badge absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 text-lg">›</button>
            <span className="badge absolute bottom-2 right-2">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {images.slice(0, 12).map((src, j) => (
          <button key={src} type="button" onClick={() => setI(j)} aria-label={`Rodyti ${j + 1} nuotrauką`}
            className={`aspect-[4/3] overflow-hidden rounded-md ${j === i ? "ring-2 ring-[var(--accent)]" : "opacity-80"}`}>
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
