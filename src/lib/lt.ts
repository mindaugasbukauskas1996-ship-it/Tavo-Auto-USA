// API reikšmių vertimai į lietuvių kalbą. Nežinomos reikšmės grąžinamos kaip yra.

const pick = (v: string | null | undefined, rules: [RegExp, string][]) => {
  if (!v) return null;
  for (const [re, lt] of rules) if (re.test(v)) return lt;
  return v;
};

export const ltFuel = (v?: string | null) =>
  pick(v, [
    [/^(gas|gasoline|petrol)$/i, "Benzinas"], [/diesel/i, "Dyzelinas"], [/electric/i, "Elektra"],
    [/hybrid/i, "Hibridinis"], [/flex/i, "Benzinas/etanolis"], [/hydrogen/i, "Vandenilis"],
    [/lpg|propane|cng/i, "Dujos"],
  ]);

export const ltTransmission = (v?: string | null) =>
  pick(v, [[/auto/i, "Automatinė"], [/manual/i, "Mechaninė"], [/unknown/i, "Nežinoma"]]);

export const ltDrive = (v?: string | null) =>
  pick(v, [
    [/rear/i, "Galiniai ratai"], [/front/i, "Priekiniai ratai"], [/all|awd/i, "Visi ratai (AWD)"],
    [/4x4|4wd|four/i, "Visi ratai (4x4)"],
  ]);

export const ltRunCondition = (v?: string | null) =>
  pick(v, [
    [/run.*drive.*verif/i, "Vedasi, važiuoja (patikrinta)"], [/run.*drive/i, "Vedasi, važiuoja"],
    [/engine start|starts/i, "Užsiveda"], [/stationary|does not start|won.?t start/i, "Nesiveda"],
    [/unknown|no info|^default$/i, "Nėra informacijos"],
  ]);

export const ltDamage = (v?: string | null) =>
  pick(v, [
    [/minor dent|scratch/i, "Smulkūs įlenkimai, įbrėžimai"], [/front/i, "Priekis"], [/rear/i, "Galas"],
    [/^side|left|right/i, "Šonas"], [/all over/i, "Visas kėbulas"], [/mechanical/i, "Mechaninis gedimas"],
    [/hail/i, "Kruša"], [/water|flood/i, "Skendęs"], [/fire|burn/i, "Gaisras"], [/normal wear/i, "Įprastas nusidėvėjimas"],
    [/vandal/i, "Vandalizmas"], [/under/i, "Dugnas"], [/roof|top/i, "Stogas"], [/roll/i, "Apvirtęs"],
    [/strip/i, "Išardytas"], [/bio/i, "Biologinė tarša"], [/theft/i, "Vagystė"], [/electrical/i, "Elektros gedimas"],
    [/frame/i, "Rėmo pažeidimas"], [/suspension/i, "Pakaba"], [/^none|no damage/i, "Be pažeidimų"],
  ]);

export const ltSeller = (v?: string | null) =>
  pick(v, [[/^insurance/i, "Draudimo bendrovė"], [/non_insurance/i, "Ne draudimo bendrovė"], [/dealer/i, "Prekybininkas"], [/finance/i, "Finansų įmonė"]]);

export const kmFromMi = (mi: number | null | undefined) =>
  mi === null || mi === undefined ? null : Math.round(mi * 1.609344);

export const fmtKm = (mi: number | null | undefined) => {
  const km = kmFromMi(mi);
  return km === null ? "—" : `${new Intl.NumberFormat("lt-LT").format(km)} km`;
};

/** „Liko 1 d. 4 val. 12 min.“ arba null, jei laikas praėjo / nežinomas. */
export function timeLeft(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (!(ms > 0)) return null;
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), min = m % 60;
  return `${d} d. ${h} val. ${min} min.`;
}

export const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("lt-LT", { timeZone: "Europe/Vilnius", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";
