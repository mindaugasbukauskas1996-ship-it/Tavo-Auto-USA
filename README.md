# Tavo auto USA

JAV aukcionų (Copart, IAAI) automobilių importo į Klaipėdą svetainė.

## Kas yra dabar

- `/skaiciuokle` — importo kainos skaičiuoklė. Tarifai skaitomi iš Supabase:
  695 aikštelės, 1 341 transporto maršrutas, 10 uostų, 48 jūros tarifai.
- Formulė: `src/lib/calculator/calculate.ts`, testai — `npm test`.
- DB schema: `supabase/migrations/`.
- Tarifų Excel → SQL: `scripts/parse_tariffs.py` (bus pakeista admin skydo mygtuku).

## Paleidimas

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Vercel

Importuokite šią repozitoriją Vercel'yje ir nustatykite du aplinkos kintamuosius iš `.env.example`.
