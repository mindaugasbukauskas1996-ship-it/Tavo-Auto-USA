# Tavo auto USA

JAV aukcionų (Copart, IAAI) automobilių importo į Klaipėdą svetainė.

## Kas yra dabar

- `/skaiciuokle` — importo kainos skaičiuoklė. Tarifai skaitomi iš Supabase:
  695 aikštelės, 1 341 transporto maršrutas, 10 uostų, 48 jūros tarifai.
- Formulė: `src/lib/calculator/calculate.ts`, testai — `npm test`.
- DB schema: `supabase/migrations/`.
- Tarifų Excel → SQL: `scripts/parse_tariffs.py` (bus pakeista admin skydo mygtuku).

- `/prisijungti` — registracija ir prisijungimas (Supabase Auth, el. pašto patvirtinimas).
- `/admin/tarifai` — tarifų redagavimas: kursas, PVM, fiksuoti mokesčiai, muitas,
  Copart / IAAI mokesčių lentelės (galima įklijuoti iš Excel), jūros tarifai, pakeitimų istorija.
  Administratoriaus rolė suteikiama DB: `update profiles set role = 'admin' where email = '…';`

- `/paskyra` — kliento paskyra: mėgstamiausi, statymai, planai, sąskaitos, profilis, slaptažodis.
- Statymas loto puslapyje: tikrinamas aktyvus planas, maks. suma ir aktyvių statymų limitas (DB funkcija `place_bid`).
- `/admin/statymai` — statymų būsenos (laukia / pateikta / laimėta / pralaimėta), galutinė kaina, pastaba klientui.
- `/admin/klientai` — užstatų aktyvavimas ir grąžinimas, klientų sąrašas, Telegram pranešimų nustatymai.

## Paleidimas

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Vercel

Importuokite šią repozitoriją Vercel'yje ir nustatykite du aplinkos kintamuosius iš `.env.example`.
