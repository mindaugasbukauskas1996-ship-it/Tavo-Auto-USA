import type { SizeClass, VehicleType } from "./types.ts";

/** Transporto klasė pagal API kėbulo tipą. Admin galės pakeisti taisykles vėliau. */
export function guessSizeClass(type?: string | null, body?: string | null): SizeClass {
  const t = `${type ?? ""} ${body ?? ""}`.toUpperCase();
  if (/MOTORCYCLE|MOTO|SCOOTER|DIRT BIKE/.test(t)) {
    return /TOUR|TRIKE|GOLD ?WING|ELECTRA|ROAD KING/.test(t) ? "moto_large" : "moto";
  }
  if (/BUS|BOX TRUCK|CARGO VAN|CUTAWAY|STEP VAN|MOTORHOME|RV|SPRINTER|TRANSIT/.test(t)) return "oversize";
  if (/SUV|SPORT UTILITY|PICKUP|CREW|CAB|TRUCK|VAN|MINIVAN|WAGON 4D UTILITY/.test(t)) return "large";
  return "regular";
}

/** Muito tipas: motociklas, senovinis (30+ m.) arba lengvasis. */
export function guessVehicleType(size: SizeClass, year?: number | null, now = new Date()): VehicleType {
  if (size === "moto" || size === "moto_large") return "moto";
  if (year && now.getFullYear() - year >= 30) return "classic";
  return "car";
}
